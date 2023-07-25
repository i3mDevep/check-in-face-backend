import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';

interface ClientAppStackProps extends PropsBase {
  region: string;
}

export class ClientAppStack extends cdk.Stack {
  readonly unauthenticatedRole: iam.Role;

  constructor(scope: Construct, id: string, props: ClientAppStackProps) {
    super(scope, id, props);

    const { builderId, stage } = props;

    const identityPoolCheckInFace = new cognito.CfnIdentityPool(
      this,
      builderId.assignedIdResource('identity-pool'),
      {
        allowUnauthenticatedIdentities: true,
        identityPoolName: `identity-pool-check-in-face-${stage}`,
      }
    );

    this.unauthenticatedRole = new iam.Role(
      this,
      builderId.assignedIdResource('unauthenticated-role'),
      {
        assumedBy: new iam.FederatedPrincipal(
          'cognito-identity.amazonaws.com',
          {
            StringEquals: {
              'cognito-identity.amazonaws.com:aud': identityPoolCheckInFace.ref,
            },
            'ForAnyValue:StringLike': {
              'cognito-identity.amazonaws.com:amr': 'unauthenticated',
            },
          },
          'sts:AssumeRoleWithWebIdentity'
        ),
      }
    );

    this.unauthenticatedRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:*',
          'cognito-sync:*',
          'rekognition:SearchFacesByImage',
          'rekognition:DetectFaces',
        ],
        resources: ['*'],
      })
    );

    new cognito.CfnIdentityPoolRoleAttachment(
      this,
      builderId.assignedIdResource('identity-role-attachment'),
      {
        identityPoolId: identityPoolCheckInFace.ref,
        roles: {
          unauthenticated: this.unauthenticatedRole.roleArn,
        },
      }
    );

    new cdk.CfnOutput(
      this,
      builderId.assignedIdResource('out-arn-identity-pool'),
      {
        value: identityPoolCheckInFace.ref,
      }
    );
  }
}
