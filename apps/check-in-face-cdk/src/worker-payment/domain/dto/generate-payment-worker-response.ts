export interface GeneratePaymentWorkerResponse {
  [date: string]: {
    hoursWorked: number;
    hoursWorkedBasic: number;
    hoursWorkedExtra: number;
    hoursNight: number;
    payment: {
      paymentHoursBasic: number;
      surcharges: {
        paymentHoursExtra: number;
        paymentHoursNight: number;
      };
    };
  };
}
