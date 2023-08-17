import { startOfMonth, eachMonthOfInterval, endOfMonth } from 'date-fns';

import {
  CHECK_IN_FACE_KEYS,
  GeneralFacet,
  buildPKWorkerTimelineWithManual,
  transformDay,
  workerTimelineEntity,
} from '../../shared/infrastructure/persistence';

import { ErrorYearIsDifferent } from '../domain/worker-time.error';
import { ParamsIntervalTime } from '../domain/dto/intervals-time.dto';

type ResponseWorkerTimeline = GeneralFacet<typeof workerTimelineEntity>;

import { WorkerTimeIntervalRepository } from '../domain/worker-time-interval.repository';
import { WorkerTimeEntity } from '../domain/worker-time.entity';

export const workerTimeAnalyticsInterval: WorkerTimeIntervalRepository = {
  getAnalyticsTimeTracking: async (
    query: ParamsIntervalTime
  ): Promise<WorkerTimeEntity[]> => {
    const startTZ = new Date(query.start);
    const endTZ = new Date(query.end);

    if (startTZ.getFullYear() !== endTZ.getFullYear())
      throw new ErrorYearIsDifferent();

    const generateIntervalsMonth = () => {
      const months = eachMonthOfInterval({ start: startTZ, end: endTZ });
      const getDayCondition = (ref: Date) => (date_: Date, defaultDate: Date) =>
        ref.getMonth() === date_.getMonth()
          ? ref.getDate()
          : defaultDate.getDate();

      return months.map((date) => {
        const dayStart = getDayCondition(startTZ)(date, startOfMonth(date));
        const dayEnd = getDayCondition(endTZ)(date, endOfMonth(date));

        return {
          month: date.getMonth(),
          dayStart,
          dayEnd,
          year: date.getFullYear(),
        };
      });
    };

    const result = (
      await Promise.all(
        generateIntervalsMonth().map((interval) =>
          workerTimelineEntity.query(
            buildPKWorkerTimelineWithManual(
              query.identification,
              interval.year.toString(),
              interval.month.toString()
            ),
            {
              between: [
                `${CHECK_IN_FACE_KEYS.day}#${transformDay(interval.dayStart)}`,
                `${CHECK_IN_FACE_KEYS.day}#${transformDay(
                  interval.dayEnd + 1
                )}`,
              ],
            }
          )
        )
      )
    ).flatMap((response) => response.Items as ResponseWorkerTimeline[]);

    return Promise.resolve(result);
  },
};
