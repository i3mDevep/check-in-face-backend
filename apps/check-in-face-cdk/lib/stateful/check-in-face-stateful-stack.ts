import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rekognition from 'aws-cdk-lib/aws-rekognition';
import * as lambdaSource from 'aws-cdk-lib/aws-lambda-event-sources';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { PropsBase } from '../types/props-base';

export class CheckInFaceStatefulStack extends cdk.Stack {
  public readonly checkInFaceTable: dynamodb.Table;
  public readonly imagesWorkerS3: cdk.aws_s3.Bucket;
  public readonly collectionWorkerFaces: cdk.aws_rekognition.CfnCollection;

  constructor(scope: Construct, id: string, props: PropsBase) {
    super(scope, id, props);

    const { builderId, stage } = props;

    this.imagesWorkerS3 = new s3.Bucket(
      this,
      builderId.assignedIdResource('image-worker-s3'),
      {
        bucketName: `image-workers-${stage}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        cors: [
          {
            allowedMethods: [
              s3.HttpMethods.HEAD,
              s3.HttpMethods.GET,
              s3.HttpMethods.PUT,
            ],
            allowedOrigins: ['*'],
            allowedHeaders: ['Authorization', '*'],
          },
        ],
      }
    );

    const cdn = new cloudfront.Distribution(
      this,
      builderId.assignedIdResource('image-worker-cdn'),
      {
        defaultBehavior: {
          origin: new cloudfront_origins.S3Origin(this.imagesWorkerS3),
        },
      }
    );

    this.checkInFaceTable = new dynamodb.Table(
      this,
      builderId.assignedIdResource('check-in-face-dynamodb'),
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        tableName: `check-in-face-table-${stage}`,
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: false,
        contributorInsightsEnabled: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        sortKey: {
          name: 'sk',
          type: dynamodb.AttributeType.STRING,
        },
        partitionKey: {
          name: 'pk',
          type: dynamodb.AttributeType.STRING,
        },
      }
    );

    this.collectionWorkerFaces = new rekognition.CfnCollection(
      this,
      builderId.assignedIdResource('collections-worker-rek'),
      {
        collectionId: `collection-worker-faces-${stage}`,
      }
    );

    const lambdaEventLoadImagesWorker = new nodeLambda.NodejsFunction(
      this,
      builderId.assignedIdResource('event-load-images-handler'),
      {
        functionName: `event-load-images-handler-${stage}`,
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(
          __dirname,
          'events/event-load-images-handler/index.js'
        ),
        handler: 'handler',
        environment: {
          CF_COLLECTION_ARN: this.collectionWorkerFaces.attrArn,
          CF_COLLECTION_ID: this.collectionWorkerFaces.collectionId,
          CF_LOAD_IMAGES_WORKER_BUCKET_NAME: this.imagesWorkerS3.bucketName,
        },
        bundling: {
          minify: stage === 'prod',
        },
      }
    );

    this.checkInFaceTable.grantFullAccess(lambdaEventLoadImagesWorker);

    lambdaEventLoadImagesWorker.addEventSource(
      new lambdaSource.S3EventSource(this.imagesWorkerS3, {
        events: [cdk.aws_s3.EventType.OBJECT_CREATED],
        filters: [
          {
            prefix: 'collection-images/',
          },
        ],
      })
    );

    lambdaEventLoadImagesWorker.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rekognition:IndexFaces',
          'rekognition:SearchFacesByImage',
          'rekognition:AssociateFaces',
        ],
        resources: ['*'],
      })
    );

    this.imagesWorkerS3.grantReadWrite(lambdaEventLoadImagesWorker);

    new cdk.CfnOutput(
      this,
      builderId.assignedIdResource('out-images-worker-s3-bucket'),
      {
        value: this.imagesWorkerS3.bucketName,
        exportName: 'out-images-worker-s3-name',
      }
    );

    new cdk.CfnOutput(
      this,
      builderId.assignedIdResource('out-images-worker-cdn'),
      {
        value: cdn.domainName,
        exportName: 'out-images-worker-cdn',
      }
    );
  }
}
