import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as appsync from 'aws-cdk-lib/aws-appsync';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';

export interface CheckInFaceStatelessStackProps extends PropsBase {
  tableCheckInFace: dynamodb.Table;
  collectionWorkerFaces: cdk.aws_rekognition.CfnCollection;
  imagesWorkerS3: s3.Bucket;
  region: string;
}

export class CheckInFaceStatelessStack extends cdk.Stack {
  private builderId: PropsBase['builderId'];
  private appsyncApi: cdk.aws_appsync.GraphqlApi;

  constructor(
    scope: Construct,
    id: string,
    props: CheckInFaceStatelessStackProps
  ) {
    super(scope, id, props);

    const {
      stage,
      region,
      tableCheckInFace,
      collectionWorkerFaces,
      imagesWorkerS3,
    } = props;

    const commonEnvironment = {
      CF_REGION: region,
      CF_CHECK_IN_FACE_TABLE: tableCheckInFace.tableName,
      CF_COLLECTION_ID: collectionWorkerFaces.collectionId,
      CF_COLLECTION_ARN: collectionWorkerFaces.attrArn,
      CF_LOAD_IMAGES_WORKER_BUCKET_NAME: imagesWorkerS3.bucketName,
      TZ: 'America/Bogota',
    };

    this.builderId = props.builderId;

    const appSyncName = this.builderId.assignedIdResource('graphql');

    this.appsyncApi = new appsync.GraphqlApi(this, appSyncName, {
      name: appSyncName,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: cdk.aws_appsync.AuthorizationType.API_KEY,
          apiKeyConfig: {
            expires: cdk.Expiration.after(cdk.Duration.days(365)),
          },
        },
      },
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, '../../../../graphql/', 'schema.graphql')
      ),
    });

    // Lambdas //

    const lambdaListWorker = this.createLambdaNodeJSBase({
      functionName: 'list-worker-handler',
      routePath: 'lambdas/list-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaDetailWorker = this.createLambdaNodeJSBase({
      functionName: 'get-detail-worker-handler',
      routePath: 'lambdas/get-detail-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaListWorkerImages = this.createLambdaNodeJSBase({
      functionName: 'list-worker-images-handler',
      routePath: 'lambdas/list-worker-images-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaCreateWorker = this.createLambdaNodeJSBase({
      functionName: 'create-worker-handle',
      routePath: 'lambdas/create-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaDisassociateWorkerImages = this.createLambdaNodeJSBase({
      functionName: 'disassociate-worker-image-handler',
      routePath: 'lambdas/disassociate-worker-image-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaMarkRecordWorker = this.createLambdaNodeJSBase({
      functionName: 'mark-record-worker-handler',
      routePath: 'lambdas/mark-record-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaListMarkTimeWorker = this.createLambdaNodeJSBase({
      functionName: 'list-mark-time-worker-handler',
      routePath: 'lambdas/list-mark-time-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaIntervalWorkerTime = this.createLambdaNodeJSBase({
      functionName: 'get-worker-intervals-time',
      routePath: 'lambdas/get-worker-intervals-time/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaGeneratePaymentWorker = this.createLambdaNodeJSBase({
      functionName: 'generate-payment-worker',
      routePath: 'lambdas/generate-payment-worker/index.js',
      environment: commonEnvironment,
      stage,
    });

    // Permission //

    imagesWorkerS3.grantReadWrite(lambdaMarkRecordWorker);

    tableCheckInFace.grantReadWriteData(lambdaListMarkTimeWorker);
    tableCheckInFace.grantReadWriteData(lambdaMarkRecordWorker);
    tableCheckInFace.grantReadWriteData(lambdaDisassociateWorkerImages);
    tableCheckInFace.grantReadWriteData(lambdaCreateWorker);
    tableCheckInFace.grantReadWriteData(lambdaListWorker);
    tableCheckInFace.grantReadWriteData(lambdaListWorkerImages);
    tableCheckInFace.grantReadData(lambdaDetailWorker);
    tableCheckInFace.grantReadData(lambdaIntervalWorkerTime);
    tableCheckInFace.grantReadData(lambdaGeneratePaymentWorker);

    lambdaCreateWorker.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rekognition:CreateUser'],
        resources: ['*'],
      })
    );

    lambdaMarkRecordWorker.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rekognition:SearchUsersByImage'],
        resources: ['*'],
      })
    );

    lambdaDisassociateWorkerImages.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rekognition:DisassociateFaces'],
        resources: ['*'],
      })
    );

    // Resolvers //

    this.createLambdaResolver({
      id: 'generate-payment-worker',
      lambdaHandler: lambdaGeneratePaymentWorker,
      resolverProps: { typeName: 'Query', fieldName: 'generateWorkerPayment' },
    });

    this.createLambdaResolver({
      id: 'get-worker-intervals-time',
      lambdaHandler: lambdaIntervalWorkerTime,
      resolverProps: { typeName: 'Query', fieldName: 'getWorkerIntervalsTime' },
    });

    this.createLambdaResolver({
      id: 'list-worker-images',
      lambdaHandler: lambdaListWorkerImages,
      resolverProps: { typeName: 'Query', fieldName: 'getWorkerImages' },
    });

    this.createLambdaResolver({
      id: 'get-detail-worker',
      lambdaHandler: lambdaDetailWorker,
      resolverProps: { typeName: 'Query', fieldName: 'getDetailWorker' },
    });

    this.createLambdaResolver({
      id: 'get-list-worker',
      lambdaHandler: lambdaListWorker,
      resolverProps: { typeName: 'Query', fieldName: 'getListWorker' },
    });

    this.createLambdaResolver({
      id: 'mark-record-worker',
      lambdaHandler: lambdaMarkRecordWorker,
      resolverProps: { typeName: 'Mutation', fieldName: 'markRecordWorker' },
    });

    this.createLambdaResolver({
      id: 'put-worker',
      lambdaHandler: lambdaCreateWorker,
      resolverProps: { typeName: 'Mutation', fieldName: 'putWorker' },
    });

    this.createLambdaResolver({
      id: 'disassociate-worker-images',
      lambdaHandler: lambdaDisassociateWorkerImages,
      resolverProps: {
        typeName: 'Mutation',
        fieldName: 'disassociateWorkerImages',
      },
    });

    this.createLambdaResolver({
      id: 'list-mark-time-worker',
      lambdaHandler: lambdaListMarkTimeWorker,
      resolverProps: { typeName: 'Query', fieldName: 'getListWorkerMarkTime' },
    });

    new cdk.CfnOutput(this, this.builderId.assignedIdResource('out-api-key'), {
      value: this.appsyncApi.apiKey ?? 'non-key',
    });

    new cdk.CfnOutput(
      this,
      this.builderId.assignedIdResource('out-graphql-url'),
      {
        value: this.appsyncApi.graphqlUrl,
      }
    );
  }

  createLambdaResolver(props: {
    id: string;
    lambdaHandler: cdk.aws_lambda_nodejs.NodejsFunction;
    resolverProps: Omit<cdk.aws_appsync.BaseResolverProps, 'dataSource'>;
  }) {
    const { id, lambdaHandler, resolverProps } = props;

    const lambdaSource = this.appsyncApi.addLambdaDataSource(
      this.builderId.assignedIdResource(`${id}-source`),
      lambdaHandler
    );

    const resolver = lambdaSource.createResolver(
      this.builderId.assignedIdResource(`${id}-resolver`),
      { ...resolverProps }
    );

    return { lambdaSource, resolver };
  }

  createLambdaNodeJSBase(params: {
    functionName: string;
    routePath: string;
    stage: string;
    environment?: Record<string, string>;
  }) {
    const { functionName, routePath, stage, environment } = params;
    return new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource(functionName),
      {
        functionName: `${functionName}-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, routePath),
        handler: 'handler',
        environment,
        bundling: {
          minify: stage === 'prod',
        },
      }
    );
  }
}
