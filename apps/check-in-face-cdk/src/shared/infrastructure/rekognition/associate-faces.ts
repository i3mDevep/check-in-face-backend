import { AssociateFacesCommand } from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const associateFaces = async (
  collectionId: string,
  userId: string,
  faces: string[]
) => {
  return await rekognition.send(
    new AssociateFacesCommand({
      CollectionId: collectionId,
      UserId: userId,
      FaceIds: faces,
    })
  );
};
