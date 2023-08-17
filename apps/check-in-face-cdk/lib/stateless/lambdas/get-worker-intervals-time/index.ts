import { AppSyncResolverHandler } from 'aws-lambda';
import { getWorkerIntervalsTime } from '../../../../src/worker-time/application/get-worker-intervals-time';
import { workerTimeAnalyticsInterval } from '../../../../src/worker-time/infrastructure/worker-time-analytics-interval';
import { IntervalsTypes } from '../../../../src/worker-time/domain/dto/intervals-time.dto';

export const handler: AppSyncResolverHandler<
  {
    query: {
      identification: string;
      start: string;
      end: string;
    };
  },
  IntervalsTypes[]
> = async (event) => {
  const query = event.arguments.query;
  return getWorkerIntervalsTime(workerTimeAnalyticsInterval)(query);
};
