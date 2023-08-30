import { workerTimeAnalyticsInterval } from '../src/worker-time/infrastructure/worker-time-analytics-interval';
import { workerPaymentApplications } from '../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../src/worker-payment/infrastructure/worker-payment-operations';

describe('test', () => {
  it('generate payment test', async () => {
    await workerPaymentApplications(
      workerPaymentOperations,
      workerTimeAnalyticsInterval
    ).generatePaymentWorker({
      end: '2023-08-26T05:00:00.000Z',
      holidays: [24],
      identification: '12312',
      start: '2023-08-20T05:00:00.000Z',
      scheduleWeek: [
        'Monday 10 hours',
        'Tuesday 9 hours',
        'Wednesday 9 hours',
        'Thursday 10 hours',
        'Friday 9 hours',
        'Saturday 10 hours',
      ],
    });
  });
});
