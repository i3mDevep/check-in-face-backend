export class ErrorYearIsDifferent extends Error {
  constructor() {
    super('year must be same for start and end dates');
  }
}
