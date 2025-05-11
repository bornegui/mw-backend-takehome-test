import { ProviderLog } from '@app/models/provider-log';
import { Repository } from 'typeorm';

export function AuditDecorator(
  provider: string,
  providerLogRepository: Repository<ProviderLog>,
  url: string,
) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const [vrm] = args;
      const startTime = Date.now();

      const audit = new ProviderLog();
      audit.vrm = vrm;
      audit.provider = provider;
      audit.url = url;
      audit.timestamp = startTime;

      try {
        const result = await originalMethod.apply(this, args);

        const endTime = Date.now();
        audit.requestDurationMs = endTime - startTime;
        audit.responseCode = 200;

        await providerLogRepository.insert(audit);

        return result;
      } catch (error) {
        const endTime = Date.now();
        audit.requestDurationMs = endTime - startTime;
        audit.responseCode = error.response?.status ?? 500;
        audit.errorMessage = error.message;

        await providerLogRepository.insert(audit);
        throw error;
      }
    };

    return descriptor;
  };
}
