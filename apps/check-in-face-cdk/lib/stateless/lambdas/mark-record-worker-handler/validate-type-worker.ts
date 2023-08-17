import {
  CHECK_IN_FACE_KEYS,
  buildPKWorkerTimelineWithDateRegister as bpk,
  transformDay,
  workerTimelineEntity,
} from '../../../../src/shared/infrastructure/persistence';
import {
  ErrorRegisterInvalid,
  ErrorTracerRegisterType,
} from '../../../../src/worker/domain/worker-error';

export const validateTypeWorker = async ({
  id,
  register,
  type,
}: {
  id: string;
  register: string;
  type: string;
}) => {
  if (new Date(register) > new Date()) throw new ErrorRegisterInvalid(register);

  const { Items } = await workerTimelineEntity.query(bpk(id, register), {
    beginsWith: `${CHECK_IN_FACE_KEYS.day}#${transformDay(new Date(register))}`,
  });

  const buildDto = (type_: string, date: string) => ({
    type: type_,
    dateRegister: new Date(date),
  });

  const newRegister = buildDto(type, register);
  const extractDates = [
    ...(Items ?? []).map((item) => buildDto(item.type, item.dateRegister)),
    newRegister,
  ];

  extractDates.sort(
    (a, b) => a.dateRegister.getTime() - b.dateRegister.getTime()
  );

  const indexNewRegister = extractDates.findIndex(
    (data) => data.dateRegister === newRegister.dateRegister
  );
  if (
    extractDates?.[indexNewRegister - 1]?.type === newRegister.type ||
    extractDates?.[indexNewRegister + 1]?.type === newRegister.type
  )
    throw new ErrorTracerRegisterType(type);
};
