import { AppSyncResolverHandler } from 'aws-lambda';
import { searchUserWithFace } from '../../../../src/shared/infrastructure/rekognition/search-user-with-face';

type MarkRecordWorkerInput = {
  props: {
    imageKey: string;
  };
};

export const handler: AppSyncResolverHandler<
  MarkRecordWorkerInput,
  string | unknown
> = async (event) => {
  const {
    arguments: {
      props: { imageKey },
    },
  } = event;
  try {
    if (!process.env.CF_COLLECTION_ID) return;
    console.log('🚀 ~ file: index.ts:29 ~ >= ~ imageKey:', imageKey);
    console.log(
      '🚀 ~ file: index.ts:29 ~ >= ~ process.env.CF_LOAD_IMAGES_WORKER_BUCKET_NAME:',
      process.env.CF_LOAD_IMAGES_WORKER_BUCKET_NAME
    );

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

    console.log('🚀 ~ file: index.ts:23 ~ >= ~ users:', JSON.stringify(users));

    return users.UserMatches?.[0].User?.UserId;
  } catch (error) {
    console.log('🚀 ~ file: index.ts:37 ~ >= ~ error:', error);
    return error;
  }
};
