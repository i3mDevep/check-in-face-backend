import { ParamsIntervalTime } from '../dto/intervals-time.dto';
import { WorkerTimeIntervalRepository } from '../worker-time-interval.repository';
import { groupByDayWorkerTime } from './group-worker-time-by-day';

export const getWorkerTimeAndGroupByDay =
  (repository: WorkerTimeIntervalRepository) =>
  async (query: ParamsIntervalTime) => {
    const workerRegisters = await repository.getAnalyticsTimeTracking(query);
    workerRegisters.sort(
      (a, b) =>
        new Date(a?.dateRegister as string).getTime() -
        new Date(b?.dateRegister as string).getTime()
    );

    const resultsConvertTZ = groupByDayWorkerTime(workerRegisters);

    return resultsConvertTZ;
  };
