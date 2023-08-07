#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VaultCellularAutomataStack } from '../lib/vault-cellular-automata-stack';

const app = new cdk.App();
const env = app.node.tryGetContext('env');
const config = app.node.tryGetContext(env);

new VaultCellularAutomataStack(app, 'VaultCellularAutomataStack', {
  env: {
    account: config.account,
    region: config.region,
  },
  connectionId: config.connectionId,
  environment: env,
});
