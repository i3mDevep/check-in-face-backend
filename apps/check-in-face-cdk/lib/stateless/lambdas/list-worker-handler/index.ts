import { AppSyncResolverHandler } from 'aws-lambda';
import {
  workerEntity,
  CHECK_IN_FACE_KEYS,
  GeneralFacet,
} from '../../../../src/shared/infrastructure/persistence';
const { identification, worker } = CHECK_IN_FACE_KEYS;

type ResponseWorker = GeneralFacet<typeof workerEntity>;

export const handler: AppSyncResolverHandler<
  void,
  ResponseWorker[] | undefined
> = async () => {
  try {
    const { Items } = await workerEntity.query(worker, {
      beginsWith: `${identification}`,
    });
    return Items;
  } catch (error) {
    return undefined;
  }
};
