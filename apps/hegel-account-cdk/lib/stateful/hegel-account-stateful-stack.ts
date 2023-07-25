import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { PropsBase } from '../types/props-base';

export class HegelAccountStatefulStack extends cdk.Stack {
  public readonly accountTable: dynamodb.Table;
  public readonly accountVpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props: PropsBase) {
    super(scope, id, props);

    const { builderId } = props;

    this.accountVpc = new ec2.Vpc(
      this,
      builderId.assignedIdResource('accounts-vpc'),
      {
        ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
        natGateways: 0,
        maxAzs: 2,
        subnetConfiguration: [
          {
            cidrMask: 24,
            name: 'account-private-subnet-1',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      }
    );

    this.accountVpc.addGatewayEndpoint(
      builderId.assignedIdResource('gateway-account-dynamodb'),
      {
        service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      }
    );

    this.accountTable = new dynamodb.Table(
      this,
      builderId.assignedIdResource('account-dynamodb'),
      {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        tableName: 'hegel-account-table',
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        pointInTimeRecovery: false,
        contributorInsightsEnabled: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
      }
    );
  }
}
