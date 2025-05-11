export class ServiceUnavailableError extends Error {
  private readonly statusCode: number;
  constructor(message: string) {
    super(message);
    this.name = 'ServiceUnavailableError';
    this.statusCode = 503;
  }
}
