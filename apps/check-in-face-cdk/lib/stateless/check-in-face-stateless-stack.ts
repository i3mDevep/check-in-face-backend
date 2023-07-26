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
    };

    this.builderId = props.builderId;

    const appSyncName = this.builderId.assignedIdResource('graphql');

    this.appsyncApi = new appsync.GraphqlApi(this, appSyncName, {
      name: appSyncName,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
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

    const lambdaDeleteWorkerImages = this.createLambdaNodeJSBase({
      functionName: 'delete-worker-image-handler',
      routePath: 'lambdas/delete-worker-image-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    const lambdaMarkRecordWorker = this.createLambdaNodeJSBase({
      functionName: 'mark-record-worker-handler',
      routePath: 'lambdas/mark-record-worker-handler/index.js',
      environment: commonEnvironment,
      stage,
    });

    // Permission //

    imagesWorkerS3.grantReadWrite(lambdaMarkRecordWorker);
    tableCheckInFace.grantReadWriteData(lambdaMarkRecordWorker);
    tableCheckInFace.grantReadWriteData(lambdaDeleteWorkerImages);
    tableCheckInFace.grantReadWriteData(lambdaCreateWorker);
    tableCheckInFace.grantReadWriteData(lambdaListWorker);
    tableCheckInFace.grantReadWriteData(lambdaListWorkerImages);

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

    lambdaDeleteWorkerImages.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rekognition:DeleteFaces'],
        resources: ['*'],
      })
    );

    // Resolvers //

    this.createLambdaResolver({
      id: 'list-worker-images',
      lambdaHandler: lambdaListWorkerImages,
      resolverProps: { typeName: 'Query', fieldName: 'getWorkerImages' },
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
      id: 'delete-worker-images',
      lambdaHandler: lambdaDeleteWorkerImages,
      resolverProps: { typeName: 'Mutation', fieldName: 'deleteWorkerImages' },
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
