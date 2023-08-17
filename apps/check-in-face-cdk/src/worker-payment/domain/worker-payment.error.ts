export class ErrorIntervalDate extends Error {
  constructor() {
    super(`start and end date must be in the same month`);
    this.name = 'ErrorIntervalDate';
  }
}
