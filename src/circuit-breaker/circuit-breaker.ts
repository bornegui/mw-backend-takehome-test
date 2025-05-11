import { VehicleValuation } from '@app/models/vehicle-valuation';

export interface CircuitBreaker {
  getValuation(vrm: string, mileage: number): Promise<VehicleValuation>;
}
