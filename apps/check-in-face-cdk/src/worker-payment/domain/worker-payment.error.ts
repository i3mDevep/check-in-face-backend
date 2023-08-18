export class ErrorIntervalDate extends Error {
  constructor() {
    super(`start and end date must be in the same month`);
    this.name = 'ErrorIntervalDate';
  }
}

export class ErrorPaymentUndefine extends Error {
  constructor() {
    super(`you need create a payment template`);
    this.name = 'ErrorPaymentUndefine';
  }
}
