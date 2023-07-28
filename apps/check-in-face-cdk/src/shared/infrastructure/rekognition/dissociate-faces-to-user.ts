import { DisassociateFacesCommand } from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const dissociateFacesForUser = async (
  collectionId: string,
  userId: string,
  faces: string[]
) => {
  return await rekognition.send(
    new DisassociateFacesCommand({
      CollectionId: collectionId,
      FaceIds: faces,
      UserId: userId,
    })
  );
};
