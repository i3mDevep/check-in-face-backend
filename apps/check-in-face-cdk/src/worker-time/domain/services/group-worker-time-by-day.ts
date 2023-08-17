import { WorkerTimeEntity } from '../worker-time.entity';

export const groupByDayWorkerTime = (workerRegisters: WorkerTimeEntity[]) =>
  workerRegisters.reduce((prev, curr) => {
    const transformTz = new Date(curr?.dateRegister as string);
    const key = `${transformTz.getDate()}#${transformTz.getMonth()}#${transformTz.getFullYear()}`;
    const prevData = prev.get(key) ?? [];
    prev.set(key, [
      ...prevData,
      { ...curr, dateRegisterTz: new Date(curr?.dateRegister as string) },
    ]);
    return prev;
  }, new Map<string, (WorkerTimeEntity & { dateRegisterTz: Date })[]>());
