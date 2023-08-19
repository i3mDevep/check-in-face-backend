import { GeneratePaymentHours } from '../dto/generate-payment-hours';
import { GeneratePaymentWorkerResponse } from '../dto/generate-payment-worker-response';
import { WorkerPaymentEntity } from '../worker-payment.entity';
import { calculateHoursNight } from './calculate-hours-night';

export const calculatePaymentWorker = (
  props: GeneratePaymentHours,
  paymentTemplate: WorkerPaymentEntity,
  holidays: number[]
) => {
  const convertMapDayToArray = Array.from(props);
  const totalDays = convertMapDayToArray.length;

  return convertMapDayToArray.reduce((prev, [key, intervals]) => {
    const {
      hoursMinimum,
      baseHourDay,
      baseHourHoliday,
      extraHourHoliday,
      nocturnHourHoliday,
      extraHourNormalDay,
      nocturnHourNormalDay,
      intervalNonNight: { since, until },
    } = paymentTemplate;
    const [day, month, year] = key.split('#');

    const averageHoursPerDay = hoursMinimum / totalDays;

    const costHours = holidays.includes(Number(day))
      ? {
          costHourBase: baseHourHoliday,
          costHourExtra: extraHourHoliday,
          costHourNigh: nocturnHourHoliday,
        }
      : {
          costHourBase: baseHourDay,
          costHourExtra: extraHourNormalDay,
          costHourNigh: nocturnHourNormalDay,
        };

    const hoursWorked =
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

    const hoursWorkedBasic = Math.min(averageHoursPerDay, hoursWorked);
    const hoursWorkedExtra = Math.max(0, hoursWorked - averageHoursPerDay);

    const data = {
      [`${day}/${month}/${year}`]: {
        hoursNight,
        hoursWorked,
        hoursWorkedBasic,
        hoursWorkedExtra,
        payment: {
          paymentHoursBasic: hoursWorkedBasic * costHours.costHourBase,
          surcharges: {
            paymentHoursExtra: hoursWorkedExtra * costHours.costHourExtra,
            paymentHoursNight: hoursNight * costHours.costHourNigh,
          },
        },
      },
    };
    return { ...prev, ...data };
  }, {} as GeneratePaymentWorkerResponse);
};
