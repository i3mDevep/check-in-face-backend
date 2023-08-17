export interface WorkerPaymentEntity {
  baseHourDay: number;
  baseHourHoliday: number;
  hoursMinimum: number;
  extraHourNormalDay: number;
  extraHourHoliday: number;
  nocturnHourNormalDay: number;
  nocturnHourHoliday: number;
  intervalNonNight: { since: number; until: number };
}
