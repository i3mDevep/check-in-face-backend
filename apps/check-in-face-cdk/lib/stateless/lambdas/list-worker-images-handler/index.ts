import { AppSyncResolverHandler } from 'aws-lambda';
import {
  workerImagesEntity,
  CHECK_IN_FACE_KEYS,
  GeneralFacet,
} from '../../../../src/shared/infrastructure/persistence';
const { identification, faceId } = CHECK_IN_FACE_KEYS;

type ResponseWorkerImages = GeneralFacet<typeof workerImagesEntity>;

export const handler: AppSyncResolverHandler<
  { identification: string },
  ResponseWorkerImages[] | undefined
> = async (event) => {
  try {
    const { Items } = await workerImagesEntity.query(
      `${identification}#${event.arguments.identification}`,
      {
        beginsWith: `${faceId}`,
        filters: {
          attr: 'status',
          eq: 'associated',
        },
      }
    );
    return Items;
  } catch (error) {
    return undefined;
  }
};
