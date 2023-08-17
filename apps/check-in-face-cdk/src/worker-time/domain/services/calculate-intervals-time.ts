import { differenceInMinutes, isToday, startOfDay, endOfDay } from 'date-fns';
import { IntervalsTypes } from '../dto/intervals-time.dto';
import { WorkerTimeEntity } from '../worker-time.entity';
import { workerTracerTimeType } from '../worker-tracer-time.type';

const totalMinutesForDay = 60 * 24;

export function toHoursAndMinutes(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return { hours, minutes };
}

const calculatePercentage = (end: Date, start: Date) =>
  (differenceInMinutes(end, start) / totalMinutesForDay) * 100;

const calculateTop = (start: Date) =>
  calculatePercentage(start, startOfDay(start));

const calculateIntervalItem = (
  start: Date,
  end: Date,
  calculateTop: (start: Date) => number
): IntervalsTypes => {
  const minutes = differenceInMinutes(end, start);
  return {
    start,
    end,
    minutes,
    minutesFormatter: toHoursAndMinutes(minutes),
    position: {
      top: calculateTop(start),
      height: calculatePercentage(end, start),
    },
  };
};

export const calculateIntervalTime = (
  resources: (WorkerTimeEntity & { dateRegisterTz: Date })[]
) => {
  return resources.reduce(
    (accumulator, resource, index) => {
      const { dateRegisterTz, type } = resource;

      if (accumulator.positionsReady.has(index)) return accumulator;

      const pushInterval = (
        start: Date,
        end: Date,
        calculate: (start: Date) => number
      ) => {
        accumulator.result.push(calculateIntervalItem(start, end, calculate));
        accumulator.positionsReady.add(index);
      };

      if (index === 0 && type === workerTracerTimeType.OUT) {
        pushInterval(startOfDay(dateRegisterTz), dateRegisterTz, () => 0);
      } else if (
        index === resources.length - 1 &&
        type === workerTracerTimeType.IN
      ) {
        pushInterval(
          dateRegisterTz,
          isToday(dateRegisterTz) ? new Date() : endOfDay(dateRegisterTz),
          calculateTop
        );
      } else {
        accumulator.positionsReady.add(index);
        accumulator.positionsReady.add(index + 1);
        pushInterval(
          dateRegisterTz,
          resources[index + 1].dateRegisterTz,
          calculateTop
        );
      }

      return accumulator;
    },
    { result: [] as IntervalsTypes[], positionsReady: new Set<number>() }
  ).result;
};
