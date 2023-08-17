export type IntervalsTypes = {
  start: Date;
  end: Date;
  minutes: number;
  minutesFormatter: { hours: number; minutes: number };
  position: {
    top: number;
    height: number;
  };
};

export type ParamsIntervalTime = {
  identification: string;
  start: string;
  end: string;
};
