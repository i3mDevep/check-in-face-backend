import { AppSyncResolverHandler } from 'aws-lambda';
import {
  GeneralFacet,
  paymentEntity,
} from '../../../../src/shared/infrastructure/persistence';
import { PutItemToolboxGeneral } from '../../../../src/shared/infrastructure/persistence/types/put-item-general';
import { workerPaymentApplications } from '../../../../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../../../../src/worker-payment/infrastructure/worker-payment-operations';
import { workerTimeAnalyticsInterval } from '../../../../src/worker-time/infrastructure/worker-time-analytics-interval';

type CreateTemplatePayment = {
  props: PutItemToolboxGeneral<GeneralFacet<typeof paymentEntity>>;
};

export const handler: AppSyncResolverHandler<
  CreateTemplatePayment,
  boolean
> = async (event) => {
  const { props } = event.arguments;

  await workerPaymentApplications(
    workerPaymentOperations,
    workerTimeAnalyticsInterval
  ).create(props);

  return true;
};
