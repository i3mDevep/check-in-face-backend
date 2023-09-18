#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { builderIdResources } from '@hegel-tech/shared-cdk';

import { CheckInFaceStatelessStack } from '../lib/stateless/check-in-face-stateless-stack';
import { CheckInFaceStatefulStack } from '../lib/stateful/check-in-face-stateful-stack';
import { ClientAppStack } from '../lib/client-app';

const app = new cdk.App();

const stage = 'prod';

const builderIdStateless = builderIdResources('check-in-face-stateless', stage);
const builderIdStateful = builderIdResources('check-in-face-stateful', stage);
const builderIdClientApp = builderIdResources(
  'check-in-face-client-app',
  stage
);

const checkInFaceStatefulStack = new CheckInFaceStatefulStack(
  app,
  `check-in-face-stateful-${stage}`,
  {
    builderId: builderIdStateful,
    stage,
  }
);

new CheckInFaceStatelessStack(app, `check-in-face-stateless-${stage}`, {
  collectionWorkerFaces: checkInFaceStatefulStack.collectionWorkerFaces,
  tableCheckInFace: checkInFaceStatefulStack.checkInFaceTable,
  imagesWorkerS3: checkInFaceStatefulStack.imagesWorkerS3,
  builderId: builderIdStateless,
  region: cdk.Aws.REGION,
  stage,
});

new ClientAppStack(app, `check-in-face-client-apps-${stage}`, {
  builderId: builderIdClientApp,
  region: cdk.Aws.REGION,
  stage,
});
