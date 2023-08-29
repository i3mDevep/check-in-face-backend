// import { GeneratePaymentHours } from '../dto/generate-payment-hours';
// import { GeneratePaymentWorkerResponse } from '../dto/generate-payment-worker-response';
// import { WorkerPaymentEntity } from '../worker-payment.entity';
// import { calculateHoursNight } from './calculate-hours-night';

// export const calculatePaymentWorker = (
//   props: GeneratePaymentHours,
//   paymentTemplate: WorkerPaymentEntity,
//   holidays: number[]
// ): GeneratePaymentWorkerResponse => {
//   const convertMapDayToArray = Array.from(props);

//   const {
//     hoursMinimum,
//     baseHourDay,
//     extraHourHoliday,
//     nocturnHourHoliday,
//     extraHourNormalDay,
//     baseHourHoliday,
//     nocturnHourNormalDay,
//     intervalNonNight: { since, until },
//   } = paymentTemplate;

//   let totalHoursWorked = 0;
//   let totalHoursNight = 0;
//   let totalHoursHolidays = 0;
//   let totalHoursHolidaysNight = 0;

//   const registersDetail: GeneratePaymentWorkerResponse['detail'] =
//     convertMapDayToArray.reduce((prev, [key, intervals]) => {
//       const [day, month, year] = key.split('#');
//       const isHoliday = holidays.includes(Number(day));

//       const hoursWorkedTotal =
//         intervals.reduce((acc, entry) => acc + entry.minutes, 0) / 60;

//       const getMinutesInDay = (date: Date) =>
//         date.getHours() * 60 + date.getMinutes();

//       const hoursNight =
//         intervals.reduce((prev, curr) => {
//           const { start, end } = curr;
//           const hoursNightInterval = calculateHoursNight(
//             { start: getMinutesInDay(start), end: getMinutesInDay(end) },
//             { start: since, end: until }
//           );
//           return prev + hoursNightInterval;
//         }, 0) / 60;

//       const data: GeneratePaymentWorkerResponse['detail'] = {
//         [`${day}/${month}/${year}`]: {
//           hoursWorkedTotal,
//           hoursNight,
//           registers: intervals.map((interval) => ({
//             start: interval.start,
//             end: interval.end,
//           })),
//         },
//       };

//       if (isHoliday) {
//         totalHoursHolidays += hoursWorkedTotal;
//         totalHoursHolidaysNight += hoursNight;
//       } else {
//         totalHoursWorked += hoursWorkedTotal;
//         totalHoursNight += hoursNight;
//       }

//       return { ...prev, ...data };
//     }, {});

//   const totalWorkedBasic = Math.min(hoursMinimum, totalHoursWorked);
//   const totalsWorkedExtra = Math.max(0, totalHoursWorked - hoursMinimum);

//   const payment: GeneratePaymentWorkerResponse['payment'] = {
//     paymentHoursBasic: totalWorkedBasic * baseHourDay,
//     surcharges: {
//       paymentHoursNightHoliday: totalHoursHolidaysNight * nocturnHourHoliday,
//       paymentHoursExtraHoliday: totalHoursHolidays * extraHourHoliday,
//       paymentHoursExtra: totalsWorkedExtra * extraHourNormalDay,
//       paymentHoursNight: totalHoursNight * nocturnHourNormalDay,
//     },
//   };

//   return { detail: registersDetail, payment };
// };

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

  //       const data: GeneratePaymentWorkerResponse['detail'] = {
  //         [`${day}/${month}/${year}`]: {
  //           hoursWorkedTotal,
  //           hoursNight,
  //           registers: intervals.map((interval) => ({
  //             start: interval.start,
  //             end: interval.end,
  //           })),
  //         },
  //       };

  const totalizerHoursWorked: GeneratePaymentWorkerResponse['totalizer'] =
    convertMapDayToArray.reduce(
      (prev, [key, intervals]) => {
        const [day, month, year] = key.split('#');
        const refDate = new Date(Number(year), Number(month), Number(day));
        const isHoliday = holidays.includes(Number(day));

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
            schedulesParse.find((s) => s.scheduleDay === refDate.getDay())
              ?.scheduleHours ?? 0,
            hours
          );
        const getHoursExtra = (hours: number) =>
          Math.min(0, hours - getHoursBasic(hours));

        const hoursExtraGeneral = isHoliday
          ? {
              hoursWorkedExtraHoliday:
                prev.hoursWorkedExtraHoliday +
                getHoursExtra(hoursWorkedTotalToday),
            }
          : {
              hoursWorkedExtraBasic:
                prev.hoursWorkedExtraBasic +
                getHoursExtra(hoursWorkedTotalToday),
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
                prev.hoursWorkedBasic + getHoursBasic(hoursWorkedTotalToday),
            };

        return {
          ...prev,
          ...hoursNighGeneral,
          ...hoursExtraGeneral,
          ...hoursWorkedBasicGeneral,
          hoursWorkedTotal: prev.hoursWorkedTotal + hoursWorkedTotalToday,
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
      } as GeneratePaymentWorkerResponse['totalizer']
    );

  return {
    totalizer: totalizerHoursWorked,
    payment: {
      paymentHoursBasic: 0,
      surcharges: {
        paymentHoursExtra: 0,
        paymentHoursExtraHoliday: 0,
        paymentHoursNight: 19,
        paymentHoursNightHoliday: 9,
      },
    },
  };
};
