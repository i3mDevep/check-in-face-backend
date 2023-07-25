#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import { HegelExperienceStateless } from '../lib/stateless/hegel-experience-stateless';
import { HegelExperienceStateful } from '../lib/stateful/hegel-experience-stateful';
import { builderIdResources } from '@hegel-tech/shared-cdk';

const app = new cdk.App();

const stage = 'dev';

const builderIdStateful = builderIdResources(
  'hegel-experience-stateful',
  stage
);

const builderIdStateless = builderIdResources(
  'hegel-experience-stateless',
  stage
);

const hegelExperienceStateful = new HegelExperienceStateful(
  app,
  'hegel-experience-stateful',
  {
    builderId: builderIdStateful,
    stage,
  }
);

new HegelExperienceStateless(app, 'hegel-core-stack', {
  builderId: builderIdStateless,
  stage,
  vpcExperience: hegelExperienceStateful.experienceVpc,
  accountDomainURL: cdk.Fn.importValue('internal-account-api-url'),
});
