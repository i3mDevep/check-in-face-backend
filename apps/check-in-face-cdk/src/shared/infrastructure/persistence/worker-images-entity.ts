import { Entity, Table } from 'dynamodb-toolbox';
import { checkInFaceTable } from './check-in-face-table';
import { CHECK_IN_FACE_KEYS } from './check-in-face-keys';

const { identification, faceId } = CHECK_IN_FACE_KEYS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ItemsType = Record<any, string>;

export const generateWorkerImagesEntity = <T extends Table<string, 'pk', 'sk'>>(
  table: T
) =>
  new Entity({
    name: 'worker-images',
    attributes: {
      pk: {
        partitionKey: true,
        hidden: true,
        dependsOn: ['identification'],
        type: 'string',
        default: (items: ItemsType) =>
          `${identification}#${items?.identification}`,
      },
      sk: {
        sortKey: true,
        hidden: true,
        dependsOn: ['faceId'],
        type: 'string',
        default: (items: ItemsType) => `${faceId}#${items?.faceId}`,
      },
      faceId: { type: 'string', required: true },
      identification: { type: 'string', required: true },
      collectionId: { type: 'string', required: true },
      status: { type: 'string', required: true },
      pathFaceInCollection: { type: 'string', required: true },
    },
    table,
  } as const);

export const workerImagesEntity = generateWorkerImagesEntity(checkInFaceTable);
