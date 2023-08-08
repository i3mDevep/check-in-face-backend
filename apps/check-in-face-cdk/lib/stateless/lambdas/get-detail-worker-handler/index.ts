import { AppSyncResolverHandler } from 'aws-lambda';
import {
  workerEntity,
  GeneralFacet,
} from '../../../../src/shared/infrastructure/persistence';

type ResponseWorker = GeneralFacet<typeof workerEntity>;

export const handler: AppSyncResolverHandler<
  { identification: string },
  ResponseWorker | undefined
> = async (event) => {
  try {
    const { Item } = await workerEntity.get({
      identification: event.arguments.identification,
    });
    return Item;
  } catch (error) {
    return undefined;
  }
};
