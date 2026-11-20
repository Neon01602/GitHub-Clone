# CodeVault

A GitHub-inspired collaborative code hosting platform built for the AWS 11-service learning project.

## Features
- User registration, login and profile
- Public/private repositories
- Git-backed repositories: init, clone, commit, branches, push and pull
- Repository file browser and ZIP downloads
- Issues, comments, labels and assignment
- Pull requests with branch comparison, review and merge workflow
- Repository collaborators and permissions
- Releases and activity dashboard
- S3 repository bundle/archive storage
- DynamoDB metadata, SQS background jobs, CloudWatch logs
- API Gateway, CloudFront, EC2, VPC, IAM and EC2 Auto Scaling deployment targets

## AWS services (only the requested 11)
S3, EC2, IAM, CloudWatch, AWS Management Console, VPC, API Gateway, DynamoDB, EC2 Auto Scaling, CloudFront, SQS.

## Architecture
- React/Vite frontend served through CloudFront.
- Express API and Git CLI on EC2, reached through API Gateway HTTP integration.
- Git working copies and bare repositories are handled on EC2.
- Repository bundles and generated ZIP archives are persisted in S3.
- DynamoDB stores users, repository metadata, collaborators, issues, pull requests and activity.
- SQS queues archive generation and repository indexing tasks; EC2 workers consume the queue.
- IAM instance roles grant narrowly scoped access to S3, DynamoDB and SQS.
- CloudWatch receives application logs and operational metrics.

## Local development
Requirements: Node.js 20+, Git 2.30+.

1. Copy `backend/.env.example` to `backend/.env` and configure values.
2. Create an S3 bucket, DynamoDB tables and SQS queue (or use the local development mode).
3. Install and start the backend:
   ```bash
   cd backend && npm install && npm run dev
   ```
4. In another terminal:
   ```bash
   cd frontend && npm install && npm run dev
   ```
5. Open http://localhost:5173.

## Important
This repository is the application code, not an AWS deployment. Create AWS resources deliberately, configure IAM roles and network access, and set billing alerts before deploying. Never commit real credentials. Public repositories are readable without login; private repository access is enforced by the API.
