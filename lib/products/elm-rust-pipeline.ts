import { CfnParameter } from 'aws-cdk-lib';
import * as cb from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sc from 'aws-cdk-lib/aws-servicecatalog';
import { Construct } from 'constructs';

import { VaultPipeline } from '../constructs/vault-pipeline';

interface ElmRustPipelineProductProps {
  connectionId: string;
  environment: 'tst' | 'dev' | 'prd';
}

export class ElmRustPipelineProduct extends sc.ProductStack {
  constructor(scope: Construct, id: string, props: ElmRustPipelineProductProps) {
    super(scope, id);

    const repositoryName = new CfnParameter(this, 'Repository', {
      description: 'Github repo containing the Elm and Rust + WebAssembly code',
      type: 'String',
    }).valueAsString;

    const vaultPath = new CfnParameter(this, 'UrlPath', {
      description: 'URL path in the vault',
      type: 'String',
    }).valueAsString;

    new VaultPipeline(this, 'VaultPipeline', {
      connectionId: props.connectionId,
      environment: props.environment,
      repositoryName: repositoryName,
      vaultPath: vaultPath,
    });
  }
}
