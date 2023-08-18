import { AppSyncResolverHandler } from 'aws-lambda';
import { workerPaymentApplications } from '../../../../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../../../../src/worker-payment/infrastructure/worker-payment-operations';
import { workerTimeAnalyticsInterval } from '../../../../src/worker-time/infrastructure/worker-time-analytics-interval';
import { WorkerPaymentEntity } from '../../../../src/worker-payment/domain/worker-payment.entity';

export const handler: AppSyncResolverHandler<
  null,
  WorkerPaymentEntity | undefined
> = async () => {
  return workerPaymentApplications(
    workerPaymentOperations,
    workerTimeAnalyticsInterval
  ).get();
};
