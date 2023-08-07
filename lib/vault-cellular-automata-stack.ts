import * as cdk from 'aws-cdk-lib';
import * as cb from 'aws-cdk-lib/aws-codebuild';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sc from 'aws-cdk-lib/aws-servicecatalog';
import { Construct } from 'constructs';

import { ElmRustPipelineProduct } from './products/elm-rust-pipeline';

interface VaultCellularAutomataStackProps extends cdk.StackProps {
  connectionId: string;
  environment: 'tst' | 'dev' | 'prd';
}

export class VaultCellularAutomataStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: VaultCellularAutomataStackProps) {
    super(scope, id, props);

    const artifactBucket = new s3.Bucket(this, 'VaultArtifactBucket', {
      bucketName: `artifact.${props.environment}.brainfartlab.com`,
    });

    const portfolio = new sc.Portfolio(this, 'CellularAutomataPortfolio', {
      displayName: 'Vault Cellular Automata',
      providerName: 'BrainFartLab',
      messageLanguage: sc.MessageLanguage.EN,
    });

    const powerUserRole = iam.Role.fromRoleName(this, 'PowerUserRole', 'AWSReservedSSO_AWSPowerUserAccess_f0b3e7fb97c0007e');
    portfolio.giveAccessToRole(powerUserRole);

    const elmRustPipelineProduct = new sc.CloudFormationProduct(this, 'ElmRustPipelineProduct', {
      productName: 'Elm + Rust Cellular Automata',
      productVersions: [
        {
          productVersionName: 'v0.1.0',
          cloudFormationTemplate: sc.CloudFormationTemplate.fromProductStack(
            new ElmRustPipelineProduct(this, 'ElmRustPipelineBlueprint', {
              connectionId: props.connectionId,
              environment: props.environment,
            }),
          ),
        },
      ],
      owner: 'BrainFartLab',
      supportEmail: 'avdmeers@gmail.com',
    });

    portfolio.addProduct(elmRustPipelineProduct);

    const provisioningRole = new iam.Role(this, 'ProvisioningRole', {
      assumedBy: new iam.ServicePrincipal('servicecatalog.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCloudFormationFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodeBuildAdminAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSCodePipeline_FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMFullAccess'),
      ],
      roleName: 'vault-provisioning-role',
    });

    portfolio.setLocalLaunchRole(elmRustPipelineProduct, provisioningRole, {
      messageLanguage: sc.MessageLanguage.EN,
    });
  }
}
