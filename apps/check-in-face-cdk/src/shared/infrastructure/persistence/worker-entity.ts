import { Entity, Table } from 'dynamodb-toolbox';
import { checkInFaceTable } from './check-in-face-table';
import { CHECK_IN_FACE_KEYS } from './check-in-face-keys';

const { worker, identification } = CHECK_IN_FACE_KEYS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsType = Record<any, string>;

export const generateWorkerEntity = <T extends Table<string, 'pk', 'sk'>>(
  table: T
) =>
  new Entity({
    name: 'worker',
    attributes: {
      pk: {
        partitionKey: true,
        hidden: true,
        type: 'string',
        default: () => worker,
      },
      sk: {
        sortKey: true,
        hidden: true,
        dependsOn: ['identification'],
        type: 'string',
        default: (items: ItemsType) =>
          `${identification}#${items?.identification}`,
      },
      fullName: { type: 'string', required: true },
      identification: { type: 'string', required: true },
      profilePath: { type: 'string', required: false },
      info: { type: 'map', required: false, default: {} },
    },
    table,
  } as const);

export const workerEntity = generateWorkerEntity(checkInFaceTable);
