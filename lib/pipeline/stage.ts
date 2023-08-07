import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { VaultCellularAutomataStack } from '../vault-cellular-automata-stack';

interface PipelineStageProps extends StageProps {
  environment: 'tst' | 'dev' | 'prd';
}

export class PipelineStage extends Stage {
  constructor(scope: Construct, id: string, props: PipelineStageProps) {
    super(scope, id, props);

    const config = this.node.tryGetContext(props.environment);

    new VaultCellularAutomataStack(this, 'CellularAutomataVault', {
      connectionId: config.connectionId,
      environment: props.environment,
    });
  }
}
