import {
  SearchUsersByImageCommand,
  SearchUsersByImageCommandInput,
} from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const searchUserWithFace = async (
  command: SearchUsersByImageCommandInput
) => {
  return await rekognition.send(new SearchUsersByImageCommand(command));
};
