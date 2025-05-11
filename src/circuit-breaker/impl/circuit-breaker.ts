import { ValuationProvider } from '@app/valuation-providers/valuation-provider';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { CircuitBreaker } from '@app/circuit-breaker/circuit-breaker';
import { ServiceUnavailableError } from '@app/errors/service-unavailable-error';

export class CircuitBreakerImpl implements CircuitBreaker {
  public readonly windowSize: number = 10; // Small window size allows the circuit breaker to open quickly when queries start failing
  public readonly resetTimeoutMs: number = 5 * 60 * 1000; // 5 minutes in milliseconds
  private failureThreshold: number = 0.5; // Circuit breaker will open when the error rate is greater than 50%
  private requests: boolean[] = [];
  private isOpen: boolean = false;
  private lastOpenTime: number | null = null; // Store when circuit broken was opened so that we can apply the 5-min rule for closing it

  constructor(
    private primaryProvider: ValuationProvider,
    private fallbackProvider: ValuationProvider,
  ) {}

  async getValuation(vrm: string, mileage: number): Promise<VehicleValuation> {
    if (this.shouldReset()) {
      this.reset();
    }

    if (this.isCircuitOpen()) {
      try {
        console.info('Circuit open, using fallback provider');
        const result = await this.fallbackProvider.getValuation(vrm, mileage);
        console.info('Returning response from fallback provider');
        return result;
      } catch (error) {
        console.error(
          'Unable to get valuation from the fallback provider',
          error,
        );
        throw new ServiceUnavailableError(
          'Unable to get valuation from the fallback provider',
        );
      }
    }

    try {
      console.info('Circuit closed, using primary provider');
      const result = await this.primaryProvider.getValuation(vrm, mileage);
      console.info('Returning response from primary provider');
      this.recordSuccess();
      return result;
    } catch (error) {
      this.recordFailure();
      console.error('Unable to get valuation from the primary provider', error);
      throw new ServiceUnavailableError(
        'Unable to get valuation from the primary provider',
      );
    }
  }

  private shouldReset(): boolean {
    return (
      this.isOpen &&
      this.lastOpenTime !== null &&
      Date.now() - this.lastOpenTime >= this.resetTimeoutMs
    );
  }

  private isCircuitOpen(): boolean {
    return this.isOpen;
  }

  private recordSuccess(): void {
    this.requests.push(true);
    this.updateCircuitState();
  }

  private recordFailure(): void {
    this.requests.push(false);
    this.updateCircuitState();
  }

  private updateCircuitState(): void {
    if (this.requests.length > this.windowSize) {
      this.requests.shift();
    }

    if (this.requests.length >= this.windowSize) {
      const failures = this.requests.filter((request) => !request).length;
      const failureRate = failures / this.requests.length;

      if (failureRate > this.failureThreshold && !this.isOpen) {
        console.info('Opening circuit');
        this.isOpen = true;
        this.lastOpenTime = Date.now();
      }
    }
  }

  private reset(): void {
    console.info('Closing circuit');
    this.requests = [];
    this.isOpen = false;
    this.lastOpenTime = null;
  }
}
