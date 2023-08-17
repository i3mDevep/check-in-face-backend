import { CreateTemplatePaymentRepository } from '../domain/create-template-payment.repository';
import { GetTemplatePaymentRepository } from '../domain/get-template-payment.repository';

export const workerPaymentOperations: CreateTemplatePaymentRepository &
  GetTemplatePaymentRepository = {
  create: () => Promise.resolve(),
  get: () =>
    Promise.resolve({
      baseHourDay: 1000,
      baseHourHoliday: 1500,
      extraHourNormalDay: 1,
      extraHourHoliday: 2,
      nocturnHourNormalDay: 3,
      nocturnHourHoliday: 5,
      hoursMinimum: 8,
      intervalNonNight: { since: 0, until: 9 },
    }),
};
