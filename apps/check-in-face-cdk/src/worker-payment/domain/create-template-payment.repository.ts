import { WorkerPaymentEntity } from './worker-payment.entity';

export interface CreateTemplatePaymentRepository {
  create: (props: WorkerPaymentEntity) => Promise<void>;
}
