export class ErrorTracerRegisterType extends Error {
  constructor(type: string) {
    super(`the type ${type} must be different`);
    this.name = 'ErrorTracerRegisterType';
  }
}

export class ErrorRegisterInvalid extends Error {
  constructor(date: string) {
    super(`the date register ${date} is invalid`);
    this.name = 'ErrorRegisterInvalid';
  }
}

export class ErrorCouldNotFindFace extends Error {
  constructor() {
    super(`sorry, but this face didn't find`);
    this.name = 'ErrorCouldNotFindFace';
  }
}
