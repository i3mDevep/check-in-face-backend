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

    const { stage, region, tableCheckInFace, collectionWorkerFaces } = props;

    this.builderId = props.builderId;

    this.appsyncApi = new appsync.GraphqlApi(
      this,
      this.builderId.assignedIdResource('graphql'),
      {
        name: this.builderId.assignedIdResource('graphql'),
        logConfig: {
          fieldLogLevel: appsync.FieldLogLevel.ALL,
        },
        schema: appsync.SchemaFile.fromAsset(
          path.join(__dirname, '../../../../graphql/', 'schema.graphql')
        ),
      }
    );

    const lambdaListWorker = new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource('list-worker-handler'),
      {
        functionName: `list-worker-handler-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'lambdas/list-worker-handler/index.js'),
        handler: 'handler',
        environment: {
          CF_REGION: region,
          CF_CHECK_IN_FACE_TABLE: tableCheckInFace.tableName,
        },
        bundling: {
          minify: stage === 'prod',
        },
      }
    );

    const lambdaListWorkerImages = new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource('list-worker-images-handler'),
      {
        functionName: `list-worker-images-handler-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(
          __dirname,
          'lambdas/list-worker-images-handler/index.js'
        ),
        handler: 'handler',
        environment: {
          CF_REGION: region,
          CF_CHECK_IN_FACE_TABLE: tableCheckInFace.tableName,
        },
        bundling: {
          minify: stage === 'prod',
        },
      }
    );

    const lambdaCreateWorker = new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource('create-worker-handler'),
      {
        functionName: `create-worker-handler-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, 'lambdas/create-worker-handler/index.js'),
        handler: 'handler',
        environment: {
          CF_REGION: region,
          CF_CHECK_IN_FACE_TABLE: tableCheckInFace.tableName,
          CF_COLLECTION_ID: collectionWorkerFaces.collectionId,
          CF_COLLECTION_ARN: collectionWorkerFaces.attrArn,
        },
        bundling: {
          minify: stage === 'prod',
        },
      }
    );

    const lambdaDeleteWorkerImages = new nodeLambda.NodejsFunction(
      this,
      this.builderId.assignedIdResource('delete-worker-image-handler'),
      {
        functionName: `delete-worker-image-handler-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(
          __dirname,
          'lambdas/delete-worker-image-handler/index.js'
        ),
        handler: 'handler',
        environment: {
          CF_REGION: region,
          CF_CHECK_IN_FACE_TABLE: tableCheckInFace.tableName,
          CF_COLLECTION_ID: collectionWorkerFaces.collectionId,
          CF_COLLECTION_ARN: collectionWorkerFaces.attrArn,
        },
        bundling: {
          minify: stage === 'prod',
        },
      }
    );

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

    lambdaDeleteWorkerImages.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rekognition:DeleteFaces'],
        resources: ['*'],
      })
    );

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
}
