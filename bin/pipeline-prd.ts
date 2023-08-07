#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline/pipeline';

const app = new cdk.App();
const env = 'prd';
const config = app.node.tryGetContext(env);

new PipelineStack(app, 'vault-cellular-automata-prd-pipeline', {
  env: {
    account: '799425856515',
    region: 'eu-west-1',
  },
  account: config.account,
  branch: 'main',
  connectionId: config.connectionId,
  environment: env,
  repoName: 'brainfartlab/aws-vault-cellular-automata',
});
