import { WorkerPaymentEntity } from './worker-payment.entity';

export interface GetTemplatePaymentRepository {
  get: () => Promise<WorkerPaymentEntity>;
}
