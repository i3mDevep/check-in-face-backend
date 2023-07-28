import { AppSyncResolverHandler } from 'aws-lambda';
import { workerImagesEntity } from '../../../../src/shared/infrastructure/persistence';
import { dissociateFacesForUser } from '../../../../src/shared/infrastructure/rekognition/dissociate-faces-to-user';

type DisassociateWorkerInput = {
  props: {
    faceIds: string[];
    identification: string;
  };
};

export const handler: AppSyncResolverHandler<
  DisassociateWorkerInput,
  boolean | undefined
> = async (event) => {
  if (!process.env.CF_COLLECTION_ID) return;

  try {
    const userDissociate = await dissociateFacesForUser(
      process.env.CF_COLLECTION_ID,
      event.arguments.props.identification,
      event.arguments.props.faceIds
    );

    const faceIdCouldDelete = (
      userDissociate.DisassociatedFaces ?? []
    )?.flatMap((face) => face.FaceId ?? []);

    const promises = event.arguments.props.faceIds
      .filter((faceId) => faceIdCouldDelete.includes(faceId))
      .map(async (faceId) =>
        workerImagesEntity.update({
          identification: event.arguments.props.identification,
          faceId,
          status: 'dissociated',
        })
      );

    await Promise.all(promises);

    return true;
  } catch (error) {
    return undefined;
  }
};
