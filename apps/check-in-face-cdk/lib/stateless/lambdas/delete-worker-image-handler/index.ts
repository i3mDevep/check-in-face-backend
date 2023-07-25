import { AppSyncResolverHandler } from 'aws-lambda';
import {
  DeleteFacesCommand,
  RekognitionClient,
} from '@aws-sdk/client-rekognition';

import { workerImagesEntity } from '../../../../src/shared/infrastructure/persistence';

type DeleteWorkerInput = {
  props: {
    faceIds: string[];
    identification: string;
  };
};

const client = new RekognitionClient({});

export const handler: AppSyncResolverHandler<
  DeleteWorkerInput,
  Partial<DeleteWorkerInput['props']> | undefined
> = async (event) => {
  try {
    const promises = event.arguments.props.faceIds.map(async (faceId) =>
      workerImagesEntity.delete({
        identification: event.arguments.props.identification,
        faceId,
      })
    );

    await client.send(
      new DeleteFacesCommand({
        CollectionId: process.env.CF_COLLECTION_ID,
        FaceIds: event.arguments.props.faceIds,
      })
    );

    await Promise.all(promises);

    return {
      ...event.arguments.props,
    };
  } catch (error) {
    return undefined;
  }
};
