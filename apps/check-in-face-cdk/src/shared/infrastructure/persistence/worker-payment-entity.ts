import { Entity, Table } from 'dynamodb-toolbox';
import { checkInFaceTable } from './check-in-face-table';
import { CHECK_IN_FACE_KEYS } from './check-in-face-keys';

const { payment, version } = CHECK_IN_FACE_KEYS;

export const generatePaymentEntity = <T extends Table<string, 'pk', 'sk'>>(
  table: T
) =>
  new Entity({
    name: 'payment',
    attributes: {
      pk: {
        partitionKey: true,
        hidden: true,
        type: 'string',
        default: () => payment,
      },
      sk: {
        sortKey: true,
        hidden: true,
        type: 'string',
        default: () => `${version}#1`,
      },
      baseHourDay: { type: 'number', required: true },
      baseHourHoliday: { type: 'number', required: true },
      hoursMinimum: { type: 'number', required: true },
      extraHourNormalDay: { type: 'number', required: true },
      extraHourHoliday: { type: 'number', required: true },
      nocturnHourNormalDay: { type: 'number', required: true },
      nocturnHourHoliday: { type: 'number', required: true },
      intervalNonNight: { type: 'map', required: true },
    },
    table,
  } as const);

export const paymentEntity = generatePaymentEntity(checkInFaceTable);
