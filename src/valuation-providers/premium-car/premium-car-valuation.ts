import axios from 'axios';

import { PremiumCarValuationResponse } from './types/premium-car-valuation-response';
import { ValuationProvider } from '@app/valuation-providers/valuation-provider';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { Repository } from 'typeorm';
import { ProviderLog } from '@app/models/provider-log';

export class PremiumCarProvider implements ValuationProvider {
  // constructor(private providerLogRepository: Repository<ProviderLog>) {}

  // @AuditDecorator('PremiumCar', this.providerLogRepository, 'run.mocky.io')
  async getValuation(vrm: string, _mileage: number): Promise<VehicleValuation> {
    axios.defaults.baseURL =
      'https://run.mocky.io/v3/0dfda26a-3a5a-43e5-b68c-51f148eda473';
    const response = await axios.get<PremiumCarValuationResponse>(
      `valueCar?vrm=${vrm}`,
    );

    const valuation = new VehicleValuation();

    valuation.vrm = vrm;
    valuation.lowestValue = Math.min(
      response.data.ValuationPrivateSaleMinimum,
      response.data.ValuationDealershipMinimum,
    );
    valuation.highestValue = Math.max(
      response.data.ValuationPrivateSaleMaximum,
      response.data.ValuationDealershipMaximum,
    );
    valuation.provider = 'PremiumCar';

    return valuation;

    /*return Promise.resolve({
      vrm: 'ABC123',
      lowestValue: 10000,
      highestValue: 30000,
      provider: 'PremiumCar',
    } as unknown as VehicleValuation);

    throw new Error('Fallback provider not available');*/
  }
}
