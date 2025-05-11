import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ValuationProvider } from '@app/valuation-providers/valuation-provider';
import { CircuitBreakerImpl } from '@app/circuit-breaker/impl/circuit-breaker';

describe('CircuitBreakerImpl', () => {
  let circuitBreaker: CircuitBreakerImpl;
  let primaryProvider: ValuationProvider;
  let fallbackProvider: ValuationProvider;

  const commonValuationMock = {
    vrm: 'ABC123',
    lowestValue: 1000,
    highestValue: 3000,
  };

  const primaryValuationMock = {
    ...commonValuationMock,
    provider: 'primary',
  };

  const fallbackValuationMock = {
    ...commonValuationMock,
    provider: 'fallback',
  };

  beforeEach(() => {
    primaryProvider = {
      getValuation: vi.fn(),
    };
    fallbackProvider = {
      getValuation: vi.fn(),
    };
    circuitBreaker = new CircuitBreakerImpl(primaryProvider, fallbackProvider);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  describe('Primary Provider Tests', () => {
    it('should use primary provider when circuit is closed', async () => {
      primaryProvider.getValuation.mockResolvedValue(primaryValuationMock);

      const result = await circuitBreaker.getValuation('ABC123', 50000);

      expect(result).toEqual(primaryValuationMock);
      expect(primaryProvider.getValuation).toHaveBeenCalledWith(
        'ABC123',
        50000,
      );
      expect(fallbackProvider.getValuation).not.toHaveBeenCalled();
    });

    it('should throw error when primary provider fails and circuit is still closed', async () => {
      primaryProvider.getValuation.mockRejectedValue(
        new Error('Primary failed'),
      );

      await expect(
        circuitBreaker.getValuation('ABC123', 50000),
      ).rejects.toThrow('Unable to get valuation from the primary provider');
    });
  });

  describe('Circuit Breaker State Tests', () => {
    it('should open circuit after reaching failure threshold', async () => {
      primaryProvider.getValuation.mockRejectedValue(
        new Error('Primary failed'),
      );
      fallbackProvider.getValuation.mockResolvedValue(fallbackValuationMock);

      // Open the circuit by generating as many errors as the window size
      for (let i = 0; i < circuitBreaker.windowSize; i++) {
        await expect(
          circuitBreaker.getValuation('ABC123', 50000),
        ).rejects.toThrow('Unable to get valuation from the primary provider');
      }

      // Next call should use fallback provider
      const result = await circuitBreaker.getValuation('ABC123', 50000);
      expect(result).toEqual(fallbackValuationMock);
      expect(fallbackProvider.getValuation).toHaveBeenCalled();
    });

    it('should reset circuit after reaching reset timeout value', async () => {
      primaryProvider.getValuation.mockRejectedValue(
        new Error('Primary failed'),
      );

      // Open the circuit by generating as many errors as the window size
      for (let i = 0; i < circuitBreaker.windowSize; i++) {
        await expect(
          circuitBreaker.getValuation('ABC123', 50000),
        ).rejects.toThrow('Unable to get valuation from the primary provider');
      }

      // Advance time by the reset timeout value
      vi.advanceTimersByTime(circuitBreaker.resetTimeoutMs);

      primaryProvider.getValuation.mockResolvedValueOnce(primaryValuationMock);

      // Should use primary provider again
      const result = await circuitBreaker.getValuation('ABC123', 50000);
      expect(result).toEqual(primaryValuationMock);
      expect(primaryProvider.getValuation).toHaveBeenCalledTimes(11); // 10 failures + 1 success
    });

    it('should not reset circuit before reaching reset timeout value', async () => {
      primaryProvider.getValuation.mockRejectedValue(
        new Error('Primary failed'),
      );
      fallbackProvider.getValuation.mockResolvedValue(fallbackValuationMock);

      // Open the circuit by generating as many errors as the window size
      for (let i = 0; i < circuitBreaker.windowSize; i++) {
        await expect(
          circuitBreaker.getValuation('ABC123', 50000),
        ).rejects.toThrow('Unable to get valuation from the primary provider');
      }

      // Advance time just before the reset timeout value
      vi.advanceTimersByTime(circuitBreaker.resetTimeoutMs - 1);

      // Should still use fallback provider
      const result = await circuitBreaker.getValuation('ABC123', 50000);
      expect(result).toEqual(fallbackValuationMock);
      expect(fallbackProvider.getValuation).toHaveBeenCalledTimes(1);
      expect(primaryProvider.getValuation).toHaveBeenCalledTimes(10);
    });
  });

  describe('Fallback Provider Tests', () => {
    it('should use fallback provider when circuit is open', async () => {
      fallbackProvider.getValuation.mockResolvedValue(fallbackValuationMock);

      // Open the circuit by generating as many errors as the window size
      for (let i = 0; i < circuitBreaker.windowSize; i++) {
        primaryProvider.getValuation.mockRejectedValueOnce(
          new Error('Primary failed'),
        );
        await expect(
          circuitBreaker.getValuation('ABC123', 50000),
        ).rejects.toThrow('Unable to get valuation from the primary provider');
      }

      const result = await circuitBreaker.getValuation('ABC123', 50000);
      expect(result).toEqual(fallbackValuationMock);
      expect(fallbackProvider.getValuation).toHaveBeenCalledWith(
        'ABC123',
        50000,
      );
    });

    it('should throw error when both providers fail', async () => {
      primaryProvider.getValuation.mockRejectedValue(
        new Error('Primary failed'),
      );
      fallbackProvider.getValuation.mockRejectedValue(
        new Error('Fallback failed'),
      );

      // Open the circuit by generating as many errors as the window size
      for (let i = 0; i < circuitBreaker.windowSize; i++) {
        await expect(
          circuitBreaker.getValuation('ABC123', 50000),
        ).rejects.toThrow('Unable to get valuation from the primary provider');
      }

      // Both providers should fail
      await expect(
        circuitBreaker.getValuation('ABC123', 50000),
      ).rejects.toThrow('Unable to get valuation from the fallback provider');
    });
  });
});
