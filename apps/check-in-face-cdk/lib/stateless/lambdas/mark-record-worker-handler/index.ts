import { AppSyncResolverHandler } from 'aws-lambda';
import { searchUserWithFace } from '../../../../src/shared/infrastructure/rekognition/search-user-with-face';
import {
  GeneralFacet,
  buildPKWorkerTimelineWithDateRegister,
  workerEntity,
  workerTimelineEntity,
} from '../../../../src/shared/infrastructure/persistence';
import {
  ErrorCouldNotFindFace,
  ErrorTracerRegisterType,
} from '../../../../src/worker/domain/worker-error';

type ResponseWorker = GeneralFacet<typeof workerEntity>;

type MarkRecordWorkerInput = {
  props: {
    imageKey: string;
    dateRegister: string;
    reason: string;
    type: string;
  };
};

export const handler: AppSyncResolverHandler<
  MarkRecordWorkerInput,
  ResponseWorker | unknown
> = async (event) => {
  const {
    arguments: {
      props: { imageKey, dateRegister, reason, type },
    },
  } = event;

  if (!process.env.CF_COLLECTION_ID) return;

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

  const { Items } = await workerTimelineEntity.query(
    buildPKWorkerTimelineWithDateRegister(userFind.User.UserId, dateRegister),
    { limit: 1, reverse: true }
  );

  const prevDataMarkTimeRecord = Items?.[0];

  if (prevDataMarkTimeRecord && prevDataMarkTimeRecord.type === type)
    throw new ErrorTracerRegisterType(type);

  await workerTimelineEntity.put({
    type,
    identification: userFind.User.UserId,
    dateRegister,
    reason,
    picture: imageKey,
  });

  return Item;
};
