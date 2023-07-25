import { AppSyncResolverHandler } from 'aws-lambda';
import { workerEntity } from '../../../../src/shared/infrastructure/persistence';
import { createUser } from '../../../../src/shared/infrastructure/rekognition/create-user';

type CreateWorkerInput = {
  props: {
    fullName: string;
    identification: string;
    profilePath?: string;
  };
};

export const handler: AppSyncResolverHandler<
  CreateWorkerInput,
  Partial<CreateWorkerInput['props']> | undefined
> = async (event) => {
  try {
    if (!process.env.CF_COLLECTION_ID)
      throw new Error('CF_COLLECTION_ID undefine');

    await workerEntity.put(
      {
        identification: event.arguments.props.identification,
        fullName: event.arguments.props.fullName,
        profilePath: event.arguments.props?.profilePath,
      },
      { conditions: [{ attr: 'identification', exists: false }] }
    );

    await createUser(
      process.env.CF_COLLECTION_ID,
      event.arguments.props.identification
    );

    return {
      ...event.arguments.props,
    };
  } catch (error) {
    return undefined;
  }
};
