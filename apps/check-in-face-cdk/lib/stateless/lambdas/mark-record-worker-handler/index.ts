import { AppSyncResolverHandler } from 'aws-lambda';
import { searchUserWithFace } from '../../../../src/shared/infrastructure/rekognition/search-user-with-face';
import {
  GeneralFacet,
  workerEntity,
  workerTimelineEntity,
} from '../../../../src/shared/infrastructure/persistence';
import { ErrorCouldNotFindFace } from '../../../../src/worker/domain/worker-error';
import { validateTypeWorker } from './validate-type-worker';

type ResponseWorker = GeneralFacet<typeof workerEntity>;

type MarkRecordWorkerInput = {
  props: {
    imageKey: string;
    dateRegister: string;
    reason: string;
    type: string;
    force?: boolean;
  };
};

export const handler: AppSyncResolverHandler<
  MarkRecordWorkerInput,
  ResponseWorker | unknown
> = async (event) => {
  const {
    arguments: {
      props: { imageKey, dateRegister, reason, type, force },
    },
  } = event;

  if (!process.env.CF_COLLECTION_ID) return;
  if (force) {
    const { Item } = await workerEntity.get({
      identification: imageKey,
    });

    await validateTypeWorker({
      id: imageKey,
      register: dateRegister,
      type,
    });

    await workerTimelineEntity.put({
      type,
      identification: imageKey,
      dateRegister,
      reason,
      picture: '',
    });
    return Item;
  }

  const users = await searchUserWithFace({
    CollectionId: process.env.CF_COLLECTION_ID,
    MaxUsers: 1,
    Image: {
      S3Object: {
        Bucket: process.env.CF_LOAD_IMAGES_WORKER_BUCKET_NAME,
        Name: imageKey,
      },
    },
  });

  if (!users.UserMatches?.length) throw new ErrorCouldNotFindFace();

  const [userFind] = users.UserMatches;

  if (!userFind.User?.UserId) throw new ErrorCouldNotFindFace();

  const { Item } = await workerEntity.get({
    identification: userFind.User.UserId,
  });

  if (!Item) throw new ErrorCouldNotFindFace();

  await validateTypeWorker({
    id: userFind.User.UserId,
    register: dateRegister,
    type,
  });

  await workerTimelineEntity.put({
    type,
    identification: userFind.User.UserId,
    dateRegister,
    reason,
    picture: imageKey,
  });

  return Item;
};
