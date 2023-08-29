import { workerTimeAnalyticsInterval } from '../src/worker-time/infrastructure/worker-time-analytics-interval';
import { workerPaymentApplications } from '../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../src/worker-payment/infrastructure/worker-payment-operations';

describe('test', () => {
  it('generate payment test', async () => {
    const s = await workerPaymentApplications(
      workerPaymentOperations,
      workerTimeAnalyticsInterval
    ).generatePaymentWorker({
      end: '2023-08-26T05:00:00.000Z',
      holidays: [],
      identification: '12345678',
      start: '2023-08-20T05:00:00.000Z',
    });
    console.log('🚀 ~ file: generate-payment.test.ts:19 ~ it ~ s:', s);
  });
});
