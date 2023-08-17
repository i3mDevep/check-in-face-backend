import { ParamsIntervalTime } from '../domain/dto/intervals-time.dto';
import { calculateIntervalTime } from '../domain/services/calculate-intervals-time';
import { getWorkerTimeAndGroupByDay } from '../domain/services/get-worker-time-and-group-by-day';
import { WorkerTimeIntervalRepository } from '../domain/worker-time-interval.repository';

export const getWorkerIntervalsTime =
  (repository: WorkerTimeIntervalRepository) =>
  async (query: ParamsIntervalTime) => {
    const workerRegistersGroup = await getWorkerTimeAndGroupByDay(repository)(
      query
    );
    return Array.from(workerRegistersGroup).flatMap(([, values]) =>
      calculateIntervalTime(values)
    );
  };
