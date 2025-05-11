import axios from 'axios';

import { SuperCarValuationResponse } from './types/super-car-valuation-response';
import { ValuationProvider } from '@app/valuation-providers/valuation-provider';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { Repository } from 'typeorm';
import { ProviderLog } from '@app/models/provider-log';

export class SuperCarProvider implements ValuationProvider {
  // constructor(private providerLogRepository: Repository<ProviderLog>) {}

  // @AuditDecorator('SuperCar', this.providerLogRepository, 'run.mocky.io')
  async getValuation(vrm: string, mileage: number): Promise<VehicleValuation> {
    axios.defaults.baseURL =
      'https://run.mocky.io/v3/9245229e-5c57-44e1-964b-36c7fb29168b';
    const response = await axios.get<SuperCarValuationResponse>(
      `valuations/${vrm}?mileage=${mileage}`,
    );

    const valuation = new VehicleValuation();

    valuation.vrm = vrm;
    valuation.lowestValue = response.data.valuation.lowerValue;
    valuation.highestValue = response.data.valuation.upperValue;
    valuation.provider = 'SuperCar';

    return valuation;

    /*return Promise.resolve({
      vrm: 'ABC123',
      lowestValue: 10000,
      highestValue: 30000,
      provider: 'SuperCar',
    } as unknown as VehicleValuation);

    throw new Error('Primary provider not available');*/
  }
}
