import { HttpRequest } from '@aws-sdk/protocol-http';
import fetch from 'node-fetch';
import * as AWS from 'aws-sdk';
import { signRequest } from './helper/request-signer';

const ACCOUNT_DOMAIN_URL = process.env.ACCOUNT_DOMAIN_URL;

export const handler = async (e: any) => {
  const url =
    'https://brq256cgki.execute-api.us-east-1.amazonaws.com/dev/account/';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-consumer-id': 'experience-layer-bff',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    console.log('Response:', data);

    return {
      statusCode: 200,
      body: JSON.stringify({ id: 'michael', name: 'lindo', email: 'tu' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Error puto'),
    };
  }
};
