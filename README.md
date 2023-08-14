# Employee Time Tracking using Amazon Rekognition

This project demonstrates a serverless employee time tracking system using Amazon Rekognition, part of the Amazon Web Services (AWS) ecosystem. The application captures employee check-ins through facial recognition and stores the relevant data in a serverless manner using various AWS services.

![alt text](https://github.com/i3mDevep/check-in-face-backend/blob/main/assets/arquitecture-check-in-face.svg?raw=true)

## Project Overview

The goal of this project is to create a system that allows employees to clock in and out by having their faces recognized. The system utilizes AWS Rekognition, a machine learning service, to perform facial recognition on images captured during check-ins.

## Features

- **Facial Recognition**: Employees can clock in and out by having their faces recognized using Amazon Rekognition.
- **Serverless Architecture**: The entire application is built using serverless services provided by AWS, eliminating the need to manage infrastructure.
- **DynamoDB**: Employee check-in and check-out times are stored in DynamoDB, a NoSQL database service by AWS.
- **AppSync**: AWS AppSync is used to create a GraphQL API for interacting with the application's backend services.
- **Lambda Functions**: AWS Lambda functions handle business logic, including facial recognition, data storage, and API interactions.
- **S3**: Images captured during check-ins are stored in Amazon S3, a scalable object storage service.
- **CloudFront**: Content Delivery Network (CDN) is utilized for efficient image distribution.
- **Nx Cloud**: The project uses Nx Cloud for managing monorepositories, streamlining development workflows.

## How to Use

1. Clone the repository to your local machine.
2. Navigate to the project's root directory and install dependencies using `npm install`.
3. Configure your AWS credentials using the AWS CLI or environment variables.
4. Deploy the CDK stacks for both `CheckInFaceStatefulStack` and `CheckInFaceStatelessStack`.
5. Once deployed, you can interact with the GraphQL API to perform employee check-ins and check-outs.
6. During a check-in, an image is captured and sent to the backend for facial recognition using Amazon Rekognition.
7. The system processes the recognition result and records the employee's check-in time.

## Prerequisites

- AWS Account: You need an AWS account to deploy and use the services in this project.
- Node.js: Ensure you have Node.js installed for development and deployment.
- AWS CLI: Install the AWS CLI to configure your credentials and deploy resources.
- Amazon Rekognition: Familiarity with Amazon Rekognition service is beneficial.

## Deployment

1. Install AWS CLI and configure your AWS credentials.
2. Use `pnpm nx run check-in-face-cdk:deploy --all --require-approval never`.

## Conclusion

This project demonstrates the power of serverless architecture combined with Amazon Rekognition to create an innovative solution for employee time tracking. Feel free to explore and expand upon this project to suit your specific requirements.

For detailed instructions, refer to the README within each stack's directory.

