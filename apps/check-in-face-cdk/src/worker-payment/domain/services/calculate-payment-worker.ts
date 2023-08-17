import { GeneratePaymentHours } from '../dto/generate-payment-hours';
import { GeneratePaymentWorkerResponse } from '../dto/generate-payment-worker-response';
import { WorkerPaymentEntity } from '../worker-payment.entity';
import { calculateHoursNight } from './calculate-hours-night';

export const calculatePaymentWorker = (
  props: GeneratePaymentHours,
  paymentTemplate: WorkerPaymentEntity
) => {
  return Array.from(props).reduce((prev, [key, intervals]) => {
    const {
      hoursMinimum,
      baseHourDay,
      extraHourNormalDay,
      nocturnHourNormalDay,
      intervalNonNight: { since, until },
    } = paymentTemplate;
    const [day, month, year] = key.split('#');

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

    const hoursWorkedBasic = Math.min(hoursMinimum, hoursWorked);
    const hoursWorkedExtra = Math.max(0, hoursWorked - hoursMinimum);

    const data = {
      [`${day}/${month}/${year}`]: {
        hoursNight,
        hoursWorked,
        hoursWorkedBasic,
        hoursWorkedExtra,
        payment: {
          paymentHoursBasic: hoursWorkedBasic * baseHourDay,
          surcharges: {
            paymentHoursExtra: hoursWorkedExtra * extraHourNormalDay,
            paymentHoursNight: hoursNight * nocturnHourNormalDay,
          },
        },
      },
    };
    return { ...prev, ...data };
  }, {} as GeneratePaymentWorkerResponse);
};
