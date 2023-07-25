import { builderIdResources } from '@hegel-tech/shared-cdk';
import * as cdk from 'aws-cdk-lib';

export interface PropsBase extends cdk.StackProps {
  stage: string;
  builderId: Pick<ReturnType<typeof builderIdResources>, 'assignedIdResource'>;
}
