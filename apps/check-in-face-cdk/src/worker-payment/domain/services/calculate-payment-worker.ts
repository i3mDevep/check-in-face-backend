import { getDay } from 'date-fns';
import { GeneratePaymentHours } from '../dto/generate-payment-hours';
import { GeneratePaymentWorkerResponse } from '../dto/generate-payment-worker-response';
import { WorkerPaymentEntity } from '../worker-payment.entity';
import { calculateHoursNight } from './calculate-hours-night';

export const calculatePaymentWorker = (
  props: GeneratePaymentHours,
  paymentTemplate: WorkerPaymentEntity,
  holidays: number[],
  scheduleWeek: string[]
): GeneratePaymentWorkerResponse => {
  const convertMapDayToArray = Array.from(props);

  const schedulesParse = scheduleWeek.map((schedule) => {
    const [dayText, hoursText] = schedule.split(' ');
    const mapDayToNumber = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };
    return {
      scheduleDay: mapDayToNumber[dayText as keyof typeof mapDayToNumber],
      scheduleHours: Number(hoursText),
    };
  });

  const {
    baseHourDay,
    extraHourHoliday,
    nocturnHourHoliday,
    extraHourNormalDay,
    baseHourHoliday,
    nocturnHourNormalDay,
    intervalNonNight: { since, until },
  } = paymentTemplate;

  const totalizerHoursWorked: GeneratePaymentWorkerResponse['totalizer'] & {
    detail: GeneratePaymentWorkerResponse['detail'];
  } = convertMapDayToArray.reduce(
    (prev, [key, intervals]) => {
      const [day, month, year] = key.split('#');
      const refDate = intervals[0].start;

      const isHoliday = holidays.includes(Number(day));

      const detail: GeneratePaymentWorkerResponse['detail'] = {
        [`${day}/${month}/${year}`]: {
          registers: intervals.map((interval) => ({
            start: interval.start,
            end: interval.end,
          })),
        },
      };

      const hoursWorkedTotalToday =
        intervals.reduce((acc, entry) => acc + entry.minutes, 0) / 60;

      const getMinutesInDay = (date: Date) =>
        date.getHours() * 60 + date.getMinutes();

      const hoursNight =
        intervals.reduce((prev, curr) => {
          const { start, end } = curr;
          const hoursNightInterval = calculateHoursNight(
            { start: getMinutesInDay(start), end: getMinutesInDay(end) },
            { start: since, end: until }
          );
          return prev + hoursNightInterval;
        }, 0) / 60;

      const getHoursBasic = (hours: number) =>
        Math.min(
          schedulesParse.find((s) => s.scheduleDay === getDay(refDate))
            ?.scheduleHours ?? 0,
          hours
        );
      const getHoursExtra = (hours: number) =>
        Math.max(0, hours - getHoursBasic(hours));

      const hoursExtraGeneral = isHoliday
        ? {
            hoursWorkedExtraHoliday:
              prev.hoursWorkedExtraHoliday +
              getHoursExtra(hoursWorkedTotalToday),
          }
        : {
            hoursWorkedExtraBasic:
              prev.hoursWorkedExtraBasic + getHoursExtra(hoursWorkedTotalToday),
          };

      const hoursNighGeneral = isHoliday
        ? { hoursNightHoliday: prev.hoursNightHoliday + hoursNight }
        : { hoursNightBasic: prev.hoursNightBasic + hoursNight };

      const hoursWorkedBasicGeneral = isHoliday
        ? {
            hoursWorkedBasicHoliday:
              prev.hoursWorkedBasicHoliday +
              getHoursBasic(hoursWorkedTotalToday),
          }
        : {
            hoursWorkedBasic:
              prev.hoursWorkedBasic +
              prev.hoursWorkedBasicHoliday +
              getHoursBasic(hoursWorkedTotalToday),
          };

      return {
        ...prev,
        ...hoursNighGeneral,
        ...hoursExtraGeneral,
        ...hoursWorkedBasicGeneral,
        hoursWorkedTotal: prev.hoursWorkedTotal + hoursWorkedTotalToday,
        detail: { ...prev.detail, ...detail },
      };
    },
    {
      hoursNightBasic: 0,
      hoursNightHoliday: 0,
      hoursWorkedBasic: 0,
      hoursWorkedBasicHoliday: 0,
      hoursWorkedExtraBasic: 0,
      hoursWorkedExtraHoliday: 0,
      hoursWorkedTotal: 0,
    } as GeneratePaymentWorkerResponse['totalizer'] & {
      detail: GeneratePaymentWorkerResponse['detail'];
    }
  );

  const { detail, ...rest } = totalizerHoursWorked;

  const payment: GeneratePaymentWorkerResponse['payment'] = {
    paymentHoursBasic:
      rest.hoursWorkedBasic * baseHourDay +
      rest.hoursWorkedBasicHoliday * baseHourHoliday,
    surcharges: {
      paymentHoursNightHoliday: rest.hoursNightHoliday * nocturnHourHoliday,
      paymentHoursExtraHoliday: rest.hoursWorkedExtraHoliday * extraHourHoliday,
      paymentHoursExtra: rest.hoursWorkedExtraBasic * extraHourNormalDay,
      paymentHoursNight: rest.hoursNightBasic * nocturnHourNormalDay,
    },
  };
  return {
    detail,
    payment,
    totalizer: rest,
  };
};
