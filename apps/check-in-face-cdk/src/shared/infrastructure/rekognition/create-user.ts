import { CreateUserCommand } from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const createUser = async (collectionId: string, userId: string) => {
  return await rekognition.send(
    new CreateUserCommand({
      CollectionId: collectionId,
      UserId: userId,
    })
  );
};
