import { ParamsIntervalTime } from './dto/intervals-time.dto';
import { WorkerTimeEntity } from './worker-time.entity';

export interface WorkerTimeIntervalRepository {
  getAnalyticsTimeTracking: (
    query: ParamsIntervalTime
  ) => Promise<WorkerTimeEntity[]>;
}
