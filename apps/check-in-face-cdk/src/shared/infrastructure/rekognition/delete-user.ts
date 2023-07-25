import { DeleteUserCommand } from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const deleteUser = async (collectionId: string, userId: string) => {
  return await rekognition.send(
    new DeleteUserCommand({
      CollectionId: collectionId,
      UserId: userId,
    })
  );
};
