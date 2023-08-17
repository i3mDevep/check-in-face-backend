import { workerPaymentApplications } from '../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../src/worker-payment/infrastructure/worker-payment-operations';
import { workerTimeAnalyticsInterval } from '../src/worker-time/infrastructure/worker-time-analytics-interval';
describe('generate payment worker test', () => {
  it('generatePaymentWorker', async () => {
    const s = await workerPaymentApplications(
      workerPaymentOperations,
      workerTimeAnalyticsInterval
    ).generatePaymentWorker({
      identification: '12345678',
      start: '2023-08-08T19:07:30.031Z',
      end: '2023-08-30T18:29:56.066Z',
    });
    console.log('🚀 ~ file: generate-payment-worker.test.ts:17 ~ it ~ s:', s);
  });
});
