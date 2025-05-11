import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Repository } from 'typeorm';
import { ProviderLog } from '@app/models/provider-log';
import { AuditDecorator } from '@app/decorators/audit-decorator';

describe('AuditDecorator', () => {
  let mockRepository: Repository<ProviderLog>;
  let mockSave: vi.Mock;
  let TestClass: any;

  beforeEach(() => {
    mockSave = vi.fn().mockResolvedValue({});
    mockRepository = {
      insert: mockSave,
    } as unknown as Repository<ProviderLog>;

    TestClass = class {
      @AuditDecorator('TestProvider', mockRepository, 'http://test-url')
      async testMethod(_vrm: string, _mileage: number) {
        return { success: true };
      }

      @AuditDecorator('TestProvider', mockRepository, 'http://test-url')
      async errorMethod(_vrm: string, _mileage: number) {
        throw new Error('Test error');
      }
    };

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('should create audit log for successful execution', async () => {
    const testInstance = new TestClass();
    const startTime = new Date();
    vi.setSystemTime(startTime);

    await testInstance.testMethod('ABC123', 50000);

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        vrm: 'ABC123',
        provider: 'TestProvider',
        url: 'http://test-url',
        timestamp: startTime.getTime(),
        responseCode: 200,
        requestDurationMs: expect.any(Number),
      }),
    );
  });

  it('should create audit log for failed execution', async () => {
    const testInstance = new TestClass();
    const startTime = new Date();
    vi.setSystemTime(startTime);

    await expect(testInstance.errorMethod('ABC123', 50000)).rejects.toThrow(
      'Test error',
    );

    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockSave).toHaveBeenCalledWith(
      expect.objectContaining({
        vrm: 'ABC123',
        provider: 'TestProvider',
        url: 'http://test-url',
        timestamp: startTime.getTime(),
        responseCode: 500,
        errorMessage: 'Test error',
        requestDurationMs: expect.any(Number),
      }),
    );
  });
});
