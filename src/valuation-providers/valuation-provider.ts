import { VehicleValuation } from '@app/models/vehicle-valuation';

export interface ValuationProvider {
  getValuation(vrm: string, mileage: number): Promise<VehicleValuation>;
}
