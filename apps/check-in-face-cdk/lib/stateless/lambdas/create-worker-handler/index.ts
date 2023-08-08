import { AppSyncResolverHandler } from 'aws-lambda';
import { workerEntity } from '../../../../src/shared/infrastructure/persistence';
import { createUser } from '../../../../src/shared/infrastructure/rekognition/create-user';

type CreateWorkerInput = {
  props: {
    fullName: string;
    identification: string;
    profilePath?: string;
    isPatch?: boolean;
  };
};

export const handler: AppSyncResolverHandler<
  CreateWorkerInput,
  boolean
> = async (event) => {
  if (!process.env.CF_COLLECTION_ID)
    throw new Error('CF_COLLECTION_ID undefine');

  const { isPatch, ...rest } = event.arguments.props;
  if (isPatch) {
    await workerEntity.update(rest);
    return true;
  }

  await workerEntity.put(rest, {
    conditions: [{ attr: 'identification', exists: false }],
  });

  await createUser(
    process.env.CF_COLLECTION_ID,
    event.arguments.props.identification
  );
  return true;
};
