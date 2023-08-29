import { AppSyncResolverHandler } from 'aws-lambda';
import { workerTimeAnalyticsInterval } from '../../../../src/worker-time/infrastructure/worker-time-analytics-interval';
import { workerPaymentApplications } from '../../../../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../../../../src/worker-payment/infrastructure/worker-payment-operations';
import { GenerateResponseDto } from '../../../../src/worker-payment/application/dto/generate-payment-response';

export const handler: AppSyncResolverHandler<
  {
    query: {
      identification: string;
      start: string;
      end: string;
      holidays: number[];
    };
  },
  GenerateResponseDto
> = async (event) => {
  const query = event.arguments.query;
  return workerPaymentApplications(
    workerPaymentOperations,
    workerTimeAnalyticsInterval
  ).generatePaymentWorker(query);
};
