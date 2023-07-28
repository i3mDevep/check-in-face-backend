import { Handler, S3Event } from 'aws-lambda';
import { v4 } from 'uuid';
import { workerImagesEntity } from '../../../../src/shared/infrastructure/persistence';
import { indexFaces } from '../../../../src/shared/infrastructure/rekognition/index-faces';
import { associateFaces } from '../../../../src/shared/infrastructure/rekognition/associate-faces';

const COLLECTION_ID = process.env.CF_COLLECTION_ID;

export const handler: Handler<S3Event> = async (event, _, callback) => {
  if (!COLLECTION_ID) return;

  const facesIdSuccess: Record<string, string[]> = {};

  const promises = event.Records.flatMap(async (record) => {
    const [, identification] = record.s3.object.key.split('/');
    if (!identification) return [];

    const response = await indexFaces({
      CollectionId: COLLECTION_ID,
      MaxFaces: 1,
      Image: {
        S3Object: {
          Bucket: process.env.CF_LOAD_IMAGES_WORKER_BUCKET_NAME,
          Name: record.s3.object.key,
        },
      },
      ExternalImageId: `${identification}:${v4()}`,
    });

    if (
      !response ||
      !response?.FaceRecords?.[0] ||
      !response?.FaceRecords?.[0].Face?.FaceId
    )
      return [];

    const faceId = response.FaceRecords[0].Face.FaceId;
    const passFaceIds = facesIdSuccess?.[identification] ?? [];
    facesIdSuccess[identification] = passFaceIds.concat(faceId);

    return await workerImagesEntity.put({
      collectionId: COLLECTION_ID,
      identification,
      faceId,
      pathFaceInCollection: record.s3.object.key,
      status: 'associated',
    });
  });

  await Promise.all(promises);
  await Promise.all(
    Object.entries(facesIdSuccess).map(([id, faces]) =>
      associateFaces(COLLECTION_ID, id, faces)
    )
  );

  callback(null, 'processing image');
};
