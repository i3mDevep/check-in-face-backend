import * as cdk from 'aws-cdk-lib';
import { builderIdResources } from '@hegel-tech/shared-cdk';

export interface PropsBase extends cdk.StackProps {
  stage: string;
  builderId: Pick<ReturnType<typeof builderIdResources>, 'assignedIdResource'>;
}
