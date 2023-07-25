import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';

export interface HegelExperienceStatelessProps extends PropsBase {
  vpcExperience: cdk.aws_ec2.Vpc;
  accountDomainURL: string;
}
export class HegelExperienceStateless extends cdk.Stack {
  syncApi: cdk.aws_appsync.GraphqlApi;
  builderId: PropsBase['builderId'];

  constructor(
    scope: Construct,
    id: string,
    props: HegelExperienceStatelessProps
  ) {
    super(scope, id, props);

    const { builderId, vpcExperience, accountDomainURL } = props;
    this.builderId = builderId;

    const userPool = new cognito.UserPool(
      this,
      this.builderId.assignedIdResource('user-pool'),
      {
        selfSignUpEnabled: true,
        accountRecovery: cognito.AccountRecovery.PHONE_AND_EMAIL,
        userVerification: {
          emailStyle: cognito.VerificationEmailStyle.CODE,
        },
        autoVerify: {
          email: true,
        },
        standardAttributes: {
          email: {
            required: true,
            mutable: false,
          },
        },
      }
    );

    const userPoolClient = new cognito.UserPoolClient(
      this,
      this.builderId.assignedIdResource('user-pool-client'),
      {
        userPool,
        generateSecret: false,
      }
    );

    userPoolClient.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    new cognito.CfnIdentityPool(
      this,
      builderId.assignedIdResource('identity-pool'),
      {
        allowUnauthenticatedIdentities: true,
        cognitoIdentityProviders: [
          {
            clientId: userPoolClient.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      }
    );

    const servicesHandler = new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource('services-resolver'),
      {
        functionName: 'services-resolver',
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'src/services-resolver.js'),
        memorySize: 1024,
        handler: 'handler',
        bundling: {
          minify: true,
        },
        environment: {
          ACCOUNT_DOMAIN_URL: accountDomainURL,
        },
        vpc: vpcExperience,
        vpcSubnets: vpcExperience.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }),
      }
    );

    servicesHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['execute-api:Invoke'],
        resources: ['*'],
      })
    );

    this.syncApi = new appsync.GraphqlApi(
      this,
      this.builderId.assignedIdResource('api-graphql'),
      {
        name: this.builderId.assignedIdResource('api-graphql'),

        logConfig: {
          fieldLogLevel: appsync.FieldLogLevel.ALL,
        },

        // authorizationConfig: {
        //   defaultAuthorization: {
        //     authorizationType: appsync.AuthorizationType.USER_POOL,
        //     userPoolConfig: {
        //       userPool,
        //     }
        //   },
        // },
        schema: appsync.SchemaFile.fromAsset(
          path.join(__dirname, '../../../../graphql/', 'schema.graphql')
        ),
      }
    );

    const microServicesPrivateSource = this.syncApi.addLambdaDataSource(
      this.builderId.assignedIdResource('services-data-sources'),
      servicesHandler
    );

    this.createResolverMapping('Query', 'getUser', microServicesPrivateSource);

    // new cdk.CfnOutput(this, "user-pool-id", {
    //   value: userPool.userPoolId
    // })

    // new cdk.CfnOutput(this, "user-pool-client-id", {
    //   value: userPoolClient.userPoolClientId
    // })

    // new cdk.CfnOutput(this, "user-pool-client-id", {
    //   value: userPoolClient.userPoolClientId
    // })
  }

  private createResolverMapping(
    typeName: string,
    fieldName: string,
    dataSource: cdk.aws_appsync.LambdaDataSource
  ) {
    const templates = HegelExperienceStateless.mappingTemplates(fieldName);
    const idResource = this.builderId.assignedIdResource('resolver-get-tasks');
    this.syncApi.createResolver(idResource, {
      typeName,
      fieldName,
      dataSource,
      ...templates,
    });
  }

  private static getPathTemplate(type: 'req' | 'res', fieldName: string) {
    const rootResolvers = '../../../../graphql/resolvers';
    return appsync.MappingTemplate.fromFile(
      path.join(__dirname, rootResolvers, `${fieldName}.${type}.vtl`)
    );
  }

  private static mappingTemplates(fieldName: string) {
    const { getPathTemplate } = HegelExperienceStateless;
    return {
      responseMappingTemplate: getPathTemplate('res', fieldName),
      requestMappingTemplate: getPathTemplate('req', fieldName),
    };
  }
}
