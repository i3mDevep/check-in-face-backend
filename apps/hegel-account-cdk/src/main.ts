#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { builderIdResources } from '@hegel-tech/shared-cdk';

import { HegelAccountStatefulStack } from '../lib/stateful/hegel-account-stateful-stack';
import { HegelAccountStatelessStack } from '../lib/stateless/hegel-account-stateless-stack';

const app = new cdk.App();

const stage = 'dev';

const builderIdStateful = builderIdResources('hegel-account-stateful', stage);
const builderIdStateless = builderIdResources('hegel-account-stateless', stage);

const { accountVpc } = new HegelAccountStatefulStack(
  app,
  'hegel-account-stateful',
  {
    builderId: builderIdStateful,
    stage,
  }
);

new HegelAccountStatelessStack(app, 'hegel-account-stateless', {
  builderId: builderIdStateless,
  accountId: cdk.Aws.ACCOUNT_ID,
  region: cdk.Aws.REGION,
  accountVpc,
  stage,
});
