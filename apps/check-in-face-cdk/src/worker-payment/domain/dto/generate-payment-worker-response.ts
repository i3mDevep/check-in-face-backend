export interface GeneratePaymentWorkerResponse {
  detail: {
    [date: string]: {
      registers: { start: Date; end: Date }[];
    };
  };
  totalizer: {
    hoursWorkedTotal: number;
    hoursWorkedBasic: number;
    hoursWorkedExtraBasic: number;
    hoursWorkedBasicHoliday: number;
    hoursWorkedExtraHoliday: number;
    hoursNightHoliday: number;
    hoursNightBasic: number;
  };
  payment: {
    paymentHoursBasic: number;
    surcharges: {
      paymentHoursBasicHoliday: number;
      paymentHoursExtra: number;
      paymentHoursNight: number;
      paymentHoursExtraHoliday: number;
      paymentHoursNightHoliday: number;
    };
  };
}
