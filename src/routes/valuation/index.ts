import { FastifyInstance } from 'fastify';
import { VehicleValuationRequest } from './types/vehicle-valuation-request';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { ValuationService } from '@app/valuation-service/valuation-service';
import { SuperCarProvider } from '@app/valuation-providers/super-car/super-car-valuation';
import { PremiumCarProvider } from '@app/valuation-providers/premium-car/premium-car-valuation';
import { CircuitBreakerImpl } from '@app/circuit-breaker/impl/circuit-breaker';
import { ProviderLog } from '@app/models/provider-log';

export function valuationRoutes(fastify: FastifyInstance) {
  const valuationService = new ValuationService(
    new CircuitBreakerImpl(
      // new SuperCarProvider(fastify.orm.getRepository(ProviderLog)),
      // new PremiumCarProvider(fastify.orm.getRepository(ProviderLog)),
      new SuperCarProvider(),
      new PremiumCarProvider(),
    ),
  );

  fastify.get<{
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;

    if (vrm === null || vrm === '' || vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    const result = await valuationRepository.findOneBy({ vrm: vrm });

    if (result == null) {
      return reply.code(404).send({
        message: `Valuation for VRM ${vrm} not found`,
        statusCode: 404,
      });
    }
    return result;
  });

  fastify.put<{
    Body: VehicleValuationRequest;
    Params: {
      vrm: string;
    };
  }>('/valuations/:vrm', async (request, reply) => {
    const valuationRepository = fastify.orm.getRepository(VehicleValuation);
    const { vrm } = request.params;
    const { mileage } = request.body;

    if (vrm.length > 7) {
      return reply
        .code(400)
        .send({ message: 'vrm must be 7 characters or less', statusCode: 400 });
    }

    if (mileage === null || mileage <= 0) {
      return reply.code(400).send({
        message: 'mileage must be a positive number',
        statusCode: 400,
      });
    }

    // Before calling getValuation we want to check if the valuation has already been saved in DB
    const result = await valuationRepository.findOneBy({ vrm: vrm });

    if (result != null) {
      fastify.log.info('Returning valuation from DB: ', result);
      return result;
    }

    const valuation = await valuationService.getValuation(vrm, mileage);

    // Save to DB.
    await valuationRepository.insert(valuation).catch((err) => {
      if (err.code !== 'SQLITE_CONSTRAINT') {
        throw err;
      }
    });

    fastify.log.info('Valuation created: ', valuation);

    return valuation;
  });
}
