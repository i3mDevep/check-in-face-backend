import {
  IndexFacesCommand,
  IndexFacesCommandInput,
} from '@aws-sdk/client-rekognition';
import { rekognition } from './client';

export const indexFaces = async (command: IndexFacesCommandInput) => {
  return await rekognition.send(new IndexFacesCommand(command));
};
