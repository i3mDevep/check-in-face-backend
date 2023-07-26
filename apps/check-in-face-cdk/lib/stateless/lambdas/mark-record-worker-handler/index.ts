import { AppSyncResolverHandler } from 'aws-lambda';
import { searchUserWithFace } from '../../../../src/shared/infrastructure/rekognition/search-user-with-face';
import {
  GeneralFacet,
  workerEntity,
  workerTimelineEntity,
} from '../../../../src/shared/infrastructure/persistence';

type ResponseWorker = GeneralFacet<typeof workerEntity>;

type MarkRecordWorkerInput = {
  props: {
    imageKey: string;
    dateRegister: string;
    reason: string;
  };
};

export const handler: AppSyncResolverHandler<
  MarkRecordWorkerInput,
  ResponseWorker | unknown
> = async (event) => {
  const {
    arguments: {
      props: { imageKey, dateRegister, reason },
    },
  } = event;

  if (!process.env.CF_COLLECTION_ID) return;

  try {
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

    if (!users.UserMatches?.length) return { error: 'did not find user' };

    const [userFind] = users.UserMatches;

    if (!userFind.User?.UserId) return { error: 'user id is undefine' };

    const { Item } = await workerEntity.get({
      identification: userFind.User.UserId,
    });

    if (!Item) return { error: 'did not find user' };

    await workerTimelineEntity.put({
      identification: userFind.User.UserId,
      dateRegister,
      reason,
    });

    return Item;
  } catch (error) {
    return error;
  }
};
