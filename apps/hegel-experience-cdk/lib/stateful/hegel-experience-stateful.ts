import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';

export class HegelExperienceStateful extends cdk.Stack {
  public readonly experienceVpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: PropsBase) {
    super(scope, id, props);

    const { builderId } = props;

    this.experienceVpc = new ec2.Vpc(
      this,
      builderId.assignedIdResource('experience-vpc'),
      {
        ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
        natGateways: 0,
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'experience-private-subnet-1',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      }
    );

    const sg = new ec2.SecurityGroup(
      this,
      builderId.assignedIdResource('experience-layer-sg'),
      {
        vpc: this.experienceVpc,
        allowAllOutbound: true,
        securityGroupName: 'experience-layer-vpc-sg',
      }
    );

    sg.addIngressRule(ec2.Peer.ipv4('10.1.0.0/16'), ec2.Port.tcp(443));

    const vpcEndpointApiGateway = new ec2.InterfaceVpcEndpoint(
      this,
      builderId.assignedIdResource('experience-api-endpoint'),
      {
        vpc: this.experienceVpc,
        service: ec2.InterfaceVpcEndpointAwsService.APIGATEWAY,
        subnets: this.experienceVpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }),
        privateDnsEnabled: true,
        securityGroups: [sg],
      }
    );

    vpcEndpointApiGateway.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
  }
}
