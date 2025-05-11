import { fastify } from '~root/test/fastify';
import { VehicleValuationRequest } from '../types/vehicle-valuation-request';
import { VehicleValuation } from '@app/models/vehicle-valuation';
import { Repository } from 'typeorm';

describe('ValuationController (e2e)', () => {
  const valuationMock = {
    vrm: 'ABC123',
    lowestValue: 10000,
    highestValue: 30000,
  };

  describe('GET /valuations/', () => {
    it('should return 200 with valid request', async () => {
      const mockFindOneBy = vi.fn().mockResolvedValue(valuationMock);

      const mockGetRepository = vi.fn().mockReturnValue({
        findOneBy: mockFindOneBy,
      });

      fastify.orm.getRepository = mockGetRepository;

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        method: 'GET',
      });

      expect(res.body).toStrictEqual(JSON.stringify(valuationMock));
    });
  });

  describe('PUT /valuations/', () => {
    it('should return 404 if VRM is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations',
        method: 'PUT',
        body: requestBody,
      });

      expect(res.statusCode).toStrictEqual(404);
    });

    it('should return 400 if VRM is 8 characters or more', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/12345678',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is missing', async () => {
      const requestBody: VehicleValuationRequest = {
        // @ts-expect-error intentionally malformed payload
        mileage: null,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 400 if mileage is negative', async () => {
      const requestBody: VehicleValuationRequest = {
        mileage: -1,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(400);
    });

    it('should return 200 with valid request when valuation not found in DB', async () => {
      vi.mock('@app/valuation-service/valuation-service', () => {
        return {
          ValuationService: vi.fn().mockImplementation(() => ({
            getValuation: vi.fn().mockResolvedValue({}),
          })),
        };
      });

      const mockRepository = {
        insert: vi.fn().mockResolvedValue({}),
        findOneBy: vi.fn().mockResolvedValue(null),
      } as unknown as Repository<VehicleValuation>;

      const mockGetRepository = vi.fn().mockReturnValue(mockRepository);

      fastify.orm.getRepository = mockGetRepository;

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });

    it('should return 200 with valid request when valuation found in DB', async () => {
      const mockRepository = {
        findOneBy: vi.fn().mockResolvedValue({ mockData: valuationMock }),
      } as unknown as Repository<VehicleValuation>;

      const mockGetRepository = vi.fn().mockReturnValue(mockRepository);

      fastify.orm.getRepository = mockGetRepository;

      const requestBody: VehicleValuationRequest = {
        mileage: 10000,
      };

      const res = await fastify.inject({
        url: '/valuations/ABC123',
        body: requestBody,
        method: 'PUT',
      });

      expect(res.statusCode).toStrictEqual(200);
    });
  });
});
