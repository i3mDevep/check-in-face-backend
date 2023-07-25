import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';
import { CfnOutput } from 'aws-cdk-lib';
import { PropsBase } from '../types/props-base';

export interface HegelAccountStatelessStackProps extends PropsBase {
  accountVpc: ec2.Vpc;
  accountId: string;
  region: string;
}

export class HegelAccountStatelessStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: HegelAccountStatelessStackProps
  ) {
    super(scope, id, props);

    const { builderId, stage, accountId, region, accountVpc } = props;

    const createAccountHandler = new nodeLambda.NodejsFunction(
      this,
      builderId.assignedIdResource('create-account-handler'),
      {
        functionName: 'create-account-handler',
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'src/create-account/create-account.js'),
        memorySize: 1024,
        handler: 'handler',
        bundling: {
          minify: true,
          // externalModules: ['aws-sdk'],
        },
        vpc: accountVpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    const apiPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['execute-api:Invoke'],
          principals: [
            new iam.AccountPrincipal(accountId), // this is the account which is calling it.
          ],
          resources: [
            // `arn:aws:execute-api:${props.region}:${props.accountId}:resitId/prod/POST/account/`,
            `arn:aws:execute-api:${region}:${accountId}:*/*/*/*/`,
          ],
        }),
      ],
    });

    const internalAccountApi = new apigw.RestApi(
      this,
      builderId.assignedIdResource('internal-account-api'),
      {
        description: 'internal account api',
        restApiName: 'internal-account-api',
        deploy: true,
        policy: apiPolicy,
        defaultMethodOptions: {
          authorizationType: apigw.AuthorizationType.NONE,
        },
        endpointTypes: [apigw.EndpointType.PRIVATE],
        deployOptions: {
          stageName: stage,
        },
      }
    );

    const accountResource = internalAccountApi.root.addResource('account');

    accountResource.addMethod(
      'POST',
      new apigw.LambdaIntegration(createAccountHandler, {
        proxy: true,
        allowTestInvoke: true,
      })
    );

    new CfnOutput(
      this,
      builderId.assignedIdResource('internal-account-api-url'),
      {
        value: internalAccountApi.url,
        description: 'The url of the internal account api',
        exportName: 'internal-account-api-url',
      }
    );
  }
}
