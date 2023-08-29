export interface GeneratePaymentWorkerResponse {
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
      paymentHoursExtra: number;
      paymentHoursNight: number;
      paymentHoursExtraHoliday: number;
      paymentHoursNightHoliday: number;
    };
  };
}
