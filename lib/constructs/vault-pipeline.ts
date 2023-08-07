import { Arn, ArnFormat, Stack } from 'aws-cdk-lib';
import * as cb from 'aws-cdk-lib/aws-codebuild';
import * as cp from 'aws-cdk-lib/aws-codepipeline';
import * as cpa from 'aws-cdk-lib/aws-codepipeline-actions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as yaml from 'yaml';
import * as fs from 'fs';

interface VaultPipelineProps {
  connectionId: string;
  environment: 'tst' | 'dev' | 'prd';
  repositoryName: string;
  vaultPath: string;
}

export class VaultPipeline extends Construct {
  constructor(scope: Construct, id: string, props: VaultPipelineProps) {
    super(scope, id);

    const connectionArn = Arn.format({
      arnFormat: ArnFormat.SLASH_RESOURCE_NAME,
      resource: 'connection',
      resourceName: props.connectionId,
      service: 'codestar-connections',
    }, Stack.of(this));

    const artifactBucket = s3.Bucket.fromBucketName(this, 'ArtifactBucket', `artifact.${props.environment}.brainfartlab.com`);

    const pipeline = new cp.Pipeline(this, 'VaultPipeline', {
      artifactBucket: artifactBucket,
      pipelineName: props.repositoryName,
    });

    // props.vaultBucket.grantWrite(pipeline.role);

    const sourceArtifact = new cp.Artifact();
    const buildArtifact = new cp.Artifact();

    pipeline.addStage({
      stageName: 'Source',
      actions: [
        new cpa.CodeStarConnectionsSourceAction({
          actionName: 'Github',
          branch: {
            'tst': 'dev',
            'dev': 'dev',
            'prd': 'main',
          }[props.environment],
          connectionArn,
          output: sourceArtifact,
          owner: 'brainfartlab',
          repo: props.repositoryName,
        }),
      ],
    });

    const buildProject = new cb.PipelineProject(this, 'BuildProject', {
      buildSpec: cb.BuildSpec.fromObject(
        yaml.parse(fs.readFileSync('./lib/buildspec/build.yml', 'utf8')),
      ),
    });

    pipeline.addStage({
      stageName: 'Build',
      actions: [
        new cpa.CodeBuildAction({
          actionName: 'Compile',
          input: sourceArtifact,
          outputs: [buildArtifact],
          project: buildProject,
        }),
      ],
    });

    const vaultBucket = s3.Bucket.fromBucketName(this, 'VaultBucket', `vault.${props.environment}.brainfartlab.com`);

    pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new cpa.S3DeployAction({
          actionName: 'S3',
          bucket: vaultBucket,
          input: buildArtifact,
          objectKey: props.vaultPath,
        }),
      ],
    });
  }
}
