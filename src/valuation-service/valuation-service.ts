import { CircuitBreaker } from '@app/circuit-breaker/circuit-breaker';
import { VehicleValuation } from '@app/models/vehicle-valuation';

export class ValuationService {
  private circuitBreaker: CircuitBreaker;

  constructor(private circuitBreaker: CircuitBreaker) {
    this.circuitBreaker = circuitBreaker;
  }

  public async getValuation(
    vrm: string,
    mileage: number,
  ): Promise<VehicleValuation> {
    return await this.circuitBreaker.getValuation(vrm, mileage);
  }
}
