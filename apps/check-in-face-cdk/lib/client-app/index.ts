import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as s3 from 'aws-cdk-lib/aws-s3';

import * as cloud_front from 'aws-cdk-lib/aws-cloudfront';

import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';

interface ClientAppStackProps extends PropsBase {
  region: string;
}

export class ClientAppStack extends cdk.Stack {
  readonly unauthenticatedRole: iam.Role;

  constructor(scope: Construct, id: string, props: ClientAppStackProps) {
    super(scope, id, props);

    const { builderId, stage } = props;

    const s3BuildAppFrontend = new s3.Bucket(
      this,
      builderId.assignedIdResource('bucket-front-client'),
      {
        bucketName: builderId.assignedIdResource('fronted-client'),
        cors: [
          {
            allowedMethods: [
              s3.HttpMethods.GET,
              s3.HttpMethods.POST,
              s3.HttpMethods.PUT,
            ],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
          },
        ],
      }
    );
    const cdnFrontend = new cloud_front.Distribution(
      this,
      builderId.assignedIdResource('cdn-front-client'),
      {
        defaultRootObject: 'index.html',
        defaultBehavior: {
          origin: new S3Origin(s3BuildAppFrontend),
          responseHeadersPolicy:
            cloud_front.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        },
        additionalBehaviors: {},
        errorResponses: [
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
          },
        ],
      }
    );

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

    new cdk.CfnOutput(this, builderId.assignedIdResource('out-frontend-cdn'), {
      value: cdnFrontend.domainName,
    });
  }
}
