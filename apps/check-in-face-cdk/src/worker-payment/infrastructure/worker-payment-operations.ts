import { paymentEntity } from '../../shared/infrastructure/persistence';
import { CreateTemplatePaymentRepository } from '../domain/create-template-payment.repository';
import { GetTemplatePaymentRepository } from '../domain/get-template-payment.repository';
import { WorkerPaymentEntity } from '../domain/worker-payment.entity';

export const workerPaymentOperations: CreateTemplatePaymentRepository &
  GetTemplatePaymentRepository = {
  create: async (props: WorkerPaymentEntity) => {
    await paymentEntity.put(props);
  },
  get: async () => (await paymentEntity.get({})).Item,
};
