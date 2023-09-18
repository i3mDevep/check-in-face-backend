import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { Table } from 'dynamodb-toolbox';

export const generateCheckInFaceTable = (
  name: string,
  document: DynamoDBDocumentClient
) =>
  new Table({
    name,
    partitionKey: 'pk',
    sortKey: 'sk',
    DocumentClient: document,
  });

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const marshallOptions = {
  convertEmptyValues: false,
};

const translateConfig = { marshallOptions };

export const documentClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env['AWS_REGION'] }),
  translateConfig
);
// OPEN - ISSUE[NAME-TABLE] = must be dynamic
export const checkInFaceTable = generateCheckInFaceTable(
  'check-in-face-table-prod',
  documentClient
);
