import { workerTimeAnalyticsInterval } from '../src/worker-time/infrastructure/worker-time-analytics-interval';
import { workerPaymentApplications } from '../src/worker-payment/application/worker-payment.application';
import { workerPaymentOperations } from '../src/worker-payment/infrastructure/worker-payment-operations';

describe('test', () => {
  it('generate payment test', async () => {
    const queryTwo = {
      end: '2023-09-06T05:00:00.000Z',
      holidays: [3],
      identification: '24529680',
      scheduleWeek: [
        'Sunday 9 hours',
        'Wednesday 9 hours',
        'Friday 10 hours',
        'Saturday 10 hours',
        'Monday 9 hours',
      ],
      start: '2023-09-01T05:00:00.000Z',
    };
    const queryOne = {
      end: '2023-08-30T05:00:00.000Z',
      holidays: [27],
      identification: '1232345555',
      scheduleWeek: [
        'Tuesday 10 hours',
        'Wednesday 10 hours',
        'Thursday 9 hours',
        'Friday 9 hours',
        'Sunday 9 hours',
      ],
      start: '2023-08-23T05:00:00.000Z',
    };
    await workerPaymentApplications(
      workerPaymentOperations,
      workerTimeAnalyticsInterval
    ).generatePaymentWorker(queryTwo);
  });
});
