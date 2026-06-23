# DropCloud

> Serverless file synchronization — built on AWS, hosted at $0.

**Live URL:**(https://main.d14jnftetiz25k.amplifyapp.com)

---

## What it does

DropCloud is a full-stack serverless Dropbox clone. Users can:

- **Register / sign in** — via AWS Cognito (email + password)
- **Upload files** — drag-and-drop or click, any file type, multiple at once
- **Browse files** — see name, size, and upload date for every file
- **Download files** — signed S3 URLs, no public bucket required
- **Delete files** — removes all versions from S3 and metadata from DynamoDB
- **View version history** — every upload of the same filename creates a new S3 version; restore any previous version

---

## Architecture

```
Browser (React + Amplify JS)
  │
  ├─► Amplify Hosting (CDN + HTTPS + CI/CD)
  ├─► Cognito (auth, JWT tokens)
  ├─► S3 (file storage, versioning enabled)
  │     └─► Lambda: onS3Upload (writes metadata to DynamoDB on upload)
  └─► API Gateway (Cognito-authorised REST API)
        ├─► Lambda: GET  /files    → listFiles
        ├─► Lambda: GET  /versions → getVersions
        └─► Lambda: DELETE /files  → deleteFile
```

All AWS resources are defined in `infrastructure/cloudformation.yml`.

---

## Project structure

```
dropcloud/
├── src/
│   ├── App.js               # Root — auth state + layout
│   ├── App.css              # Global styles & design tokens
│   ├── aws-exports.js       # Amplify config (auto-generated, not committed)
│   └── components/
│       ├── AuthForm.js      # Login / register / confirm
│       ├── AuthForm.css
│       ├── FileUpload.js    # Drag-and-drop upload with progress
│       ├── FileUpload.css
│       ├── FileList.js      # File table (download, delete, versions)
│       ├── FileList.css
│       ├── VersionHistory.js # Modal: S3 version list + restore
│       └── VersionHistory.css
├── lambda/
│   ├── onS3Upload/index.js  # S3 trigger → DynamoDB metadata
│   ├── listFiles/index.js   # GET /files
│   ├── getVersions/index.js # GET /versions
│   ├── deleteFile/index.js  # DELETE /files (all versions)
│   └── package.json
├── infrastructure/
│   └── cloudformation.yml   # Full IaC: S3, DynamoDB, Cognito, Lambda, API GW
├── public/
│   └── index.html
├── amplify.yml              # Amplify Hosting build config
├── deploy.sh                # One-command deploy script
├── package.json
└── .gitignore
```

---

## Prerequisites

- **Node.js 20+** and npm
- **AWS CLI v2** — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- AWS account with an IAM user that has `AdministratorAccess` (or scoped permissions)

---

## Deploy in 4 steps

### 1 — Configure AWS CLI

```bash
aws configure
# AWS Access Key ID:     <your key>
# AWS Secret Access Key: <your secret>
# Default region:        eu-north-1     # or whichever region you prefer
# Default output format: json
```

### 2 — Clone and deploy

```bash
git clone https://github.com/YOUR_USERNAME/dropcloud.git
cd dropcloud
chmod +x deploy.sh
./deploy.sh dev
```

`deploy.sh` will:
1. Deploy the CloudFormation stack (S3, DynamoDB, Cognito, Lambda, API Gateway)
2. Zip and upload each Lambda function
3. Write `src/aws-exports.js` with your real endpoints
4. Run `npm run build`

### 3 — Connect to Amplify Hosting

1. Push your code to GitHub / GitLab / Bitbucket
2. Go to **AWS Amplify Console → New App → Host web app**
3. Connect your repo and branch
4. Amplify will detect `amplify.yml` and build automatically
5. Copy the generated URL and update this README

### 4 — Add S3 event notification (one-time)

The CloudFormation template creates the Lambda but AWS requires the S3 notification to be set manually the first time (circular dependency limitation):

```bash
BUCKET=$(aws cloudformation describe-stacks \
  --stack-name dropcloud-stack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" \
  --output text)

LAMBDA_ARN=$(aws lambda get-function \
  --function-name dropcloud-onS3Upload-dev \
  --query 'Configuration.FunctionArn' \
  --output text)

aws s3api put-bucket-notification-configuration \
  --bucket "$BUCKET" \
  --notification-configuration "{
    \"LambdaFunctionConfigurations\": [{
      \"LambdaFunctionArn\": \"$LAMBDA_ARN\",
      \"Events\": [\"s3:ObjectCreated:*\"]
    }]
  }"
```

---

## Free tier limits (AWS)

| Service | Free tier | Typical usage |
|---------|-----------|---------------|
| S3 | 5 GB storage, 20K GET, 2K PUT/month | Well within for personal use |
| Lambda | 1M requests, 400K GB-seconds/month | Virtually unlimited |
| DynamoDB | 25 GB, 25 WCU/RCU | Unlimited for small projects |
| Cognito | 50,000 MAU | Unlimited for personal use |
| API Gateway | 1M calls/month (first 12 months) | Well within |
| Amplify Hosting | 5 GB storage, 15 GB bandwidth/month | Fine for personal use |

---

## Environment variables (Lambda)

| Function | Variable | Value |
|----------|----------|-------|
| onS3Upload | `TABLE_NAME` | DynamoDB table name |
| listFiles | `TABLE_NAME` | DynamoDB table name |
| getVersions | `BUCKET_NAME` | S3 bucket name |
| deleteFile | `BUCKET_NAME`, `TABLE_NAME` | Both |

All set automatically by `deploy.sh`.

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, AWS Amplify JS v6 |
| Auth | AWS Cognito |
| Storage | AWS S3 (versioning enabled) |
| Database | AWS DynamoDB (PAY_PER_REQUEST) |
| Compute | AWS Lambda (Node.js 20) |
| API | AWS API Gateway (REST, Cognito authorizer) |
| Hosting | AWS Amplify Hosting |
| IaC | AWS CloudFormation |
| Fonts | Syne (UI), Space Mono (code/labels) |

---

## License

MIT
