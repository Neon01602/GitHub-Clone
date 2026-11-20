# CodeVault

**A GitHub-inspired code hosting platform built from the ground up.**

CodeVault brings repositories, collaboration workflows and Git operations into a clean developer workspace. This project is also an AWS deployment and integration exercise: the application is hosted on EC2 and connects to AWS services for data and background-job workflows.

<p align="center">
  <img src="docs/screenshots/codevault-repositories.jpg" alt="CodeVault repositories dashboard" width="100%" />
</p>

## What is CodeVault?

CodeVault is a web application for developers to organise projects, browse repositories and collaborate through familiar GitHub-style workflows. The interface includes a workspace dashboard, repository management, pull requests, issues, activity and account settings.

## Features

- **Authentication** — user registration, login and session-based API access.
- **Repository workspace** — view and manage repositories, visibility and branches.
- **Git over HTTP** — clone public repositories and push commits to repositories with write permission.
- **Repository browser** — browse project files and inspect repository content.
- **Collaboration workflows** — issues, pull requests, comments and collaborator permissions.
- **Developer dashboard** — workspace overview, activity and account settings.
- **AWS integration** — EC2-hosted Node.js API, DynamoDB metadata tables, S3 storage integration and an SQS job queue.

> The application is under active development. Some larger-scale infrastructure components and production-hardening work are planned, not yet represented as completed features.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Git operations | Git CLI, `git-http-backend` |
| Authentication | JWT, bcrypt |
| Database | Amazon DynamoDB |
| Object storage | Amazon S3 |
| Background jobs | Amazon SQS |
| Hosting / reverse proxy | Amazon EC2, Ubuntu, Nginx, PM2 |
| Permissions | AWS IAM, EC2 instance role |

## AWS architecture

The current deployment uses:

- **Amazon EC2** to host the frontend, Express API and Git HTTP backend.
- **Amazon DynamoDB** for user, repository, issue, pull-request and activity metadata.
- **Amazon S3** as the object-storage integration for repository bundles and generated artifacts.
- **Amazon SQS** for queued background work.
- **AWS IAM** instance roles to grant the application access to AWS resources without embedding access keys in the source code.
- **Nginx + PM2** to serve the frontend, proxy API/Git requests and keep the Node.js process running.

### Planned infrastructure improvements

CloudFront, API Gateway, EC2 Auto Scaling and expanded CloudWatch monitoring are part of the intended AWS architecture and deployment roadmap. They should not be considered fully configured in the current deployment.

## Run locally

### Requirements

- Node.js 20 or later
- Git 2.30 or later
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Neon01602/GitHub-Clone.git
cd GitHub-Clone
```

### 2. Configure the backend

Create `backend/.env` using the example configuration in the backend (if present). Configure the required application and AWS settings. Do not commit real secrets or AWS credentials.

```bash
cd backend
npm install
npm run dev
```

### 3. Start the frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL shown in the terminal (typically `http://localhost:5173`).

## Repository layout

```text
.
├── backend/       # Express API and Git/AWS integrations
├── frontend/      # React + Vite application
└── docs/
    └── screenshots/
        └── codevault-repositories.jpg
```

## Security notes

- Keep `.env` files and JWT secrets out of version control.
- Use IAM roles for AWS access on EC2 instead of long-lived access keys.
- Keep S3 buckets private and enforce repository-level authorization in the API.
- Restrict SSH access and expose only the required web ports.
- Add rate limiting, audit logging, backups and monitoring before treating the service as production-ready.

## Project status

CodeVault is a working full-stack project with a deployed web interface, AWS-connected backend components and a Git-over-HTTP workflow being actively tested. The infrastructure and feature set are evolving.

## Author

Built by [Neon01602](https://github.com/Neon01602).

---

If you find the project interesting, feel free to explore the code, open an issue or suggest an improvement.
