import {
  differenceInMinutes,
  isToday,
  startOfMonth,
  eachMonthOfInterval,
  endOfMonth,
  startOfDay,
  endOfDay,
} from 'date-fns';

import {
  CHECK_IN_FACE_KEYS,
  GeneralFacet,
  buildPKWorkerTimelineWithManual,
  getDateWithTimezone,
  workerTimelineEntity,
} from '../../../../src/shared/infrastructure/persistence';

const totalMinutesForDay = 60 * 24;

export type IntervalsTypes = {
  start: Date;
  end: Date;
  minutes: number;
  minutesFormatter: { hours: number; minutes: number };
  position: {
    top: number;
    height: number;
  };
};

type ResponseWorkerTimeline = GeneralFacet<typeof workerTimelineEntity>;

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

export const getTimeWorkedAnalytics = async (
  intervals: { start: string; end: string },
  extra: { identification: string }
) => {
  const { start, end } = intervals;
  const { identification } = extra;
  const startTZ = getDateWithTimezone(start);
  const endTZ = getDateWithTimezone(end);

  if (startTZ.getFullYear() !== endTZ.getFullYear())
    throw Error('year different');

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

  const results = (
    await Promise.all(
      generateIntervalsMonth().map((interval) =>
        workerTimelineEntity.query(
          buildPKWorkerTimelineWithManual(
            identification,
            interval.year.toString(),
            interval.month.toString()
          ),
          {
            between: [
              `${CHECK_IN_FACE_KEYS.day}#${interval.dayStart}`,
              `${CHECK_IN_FACE_KEYS.day}#${interval.dayEnd + 1}`,
            ],
          }
        )
      )
    )
  ).flatMap((response) => response.Items as ResponseWorkerTimeline[]);

  results.sort(
    (a, b) =>
      new Date(a?.dateRegister as string).getTime() -
      new Date(b?.dateRegister as string).getTime()
  );

  const resultsConvertTZReduce = results.reduce((prev, curr) => {
    const transformTz = getDateWithTimezone(curr?.dateRegister as string);
    const key = `${transformTz.getDate()}#${transformTz.getMonth()}`;
    const prevData = prev.get(key) ?? [];
    prev.set(key, [
      ...prevData,
      { ...curr, dateRegisterTz: new Date(curr?.dateRegister as string) },
    ]);
    return prev;
  }, new Map<string, (ResponseWorkerTimeline & { dateRegisterTz: Date })[]>());

  return Array.from(resultsConvertTZReduce).flatMap(([, values]) =>
    getIntervals(values)
  );
};

const getIntervals = (
  resources: (ResponseWorkerTimeline & { dateRegisterTz: Date })[]
) => {
  const result: IntervalsTypes[] = [];
  const positionsReady: number[] = [];

  resources.forEach((resource, index) => {
    const resourceDateRegisterDate = resource.dateRegisterTz;
    if (positionsReady.some((positionCheck) => positionCheck === index)) return;
    if (index === 0 && resource.type === 'out') {
      result.push(
        calculateIntervalItem(
          startOfDay(resourceDateRegisterDate),
          resourceDateRegisterDate,
          () => 0
        )
      );
      positionsReady.push(index);
      return;
    }
    if (index === resources.length - 1 && resource.type === 'in') {
      result.push(
        calculateIntervalItem(
          resourceDateRegisterDate,
          isToday(resourceDateRegisterDate)
            ? new Date()
            : endOfDay(resourceDateRegisterDate),
          calculateTop
        )
      );
      positionsReady.push(index);
      return;
    }

    positionsReady.push(index);
    positionsReady.push(index + 1);

    result.push(
      calculateIntervalItem(
        resourceDateRegisterDate,
        resources[index + 1].dateRegisterTz,
        calculateTop
      )
    );
  });

  return result;
};
