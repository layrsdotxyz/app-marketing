#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 5 ]]; then
  echo 'usage: gitlab-deploy-static.sh <role-arn> <artifact-dir> <bucket> <distribution-id> <canary-url>' >&2
  exit 64
fi

role_arn=$1
artifact_dir=$2
bucket_name=$3
distribution_id=$4
canary_url=$5
aws_region=${LAYRSV2_PRIMARY_REGION:-us-east-1}

[[ "${CI_COMMIT_REF_PROTECTED:-false}" == true && "${CI_COMMIT_BRANCH:-}" == "${CI_DEFAULT_BRANCH:-}" ]] || {
  echo 'production publication requires a protected default-branch GitLab job' >&2
  exit 77
}

credentials=$(aws sts assume-role \
  --region "$aws_region" \
  --role-arn "$role_arn" \
  --role-session-name "layrs-marketing-gitlab-${CI_PIPELINE_ID:-manual}-${CI_JOB_ID:-0}" \
  --duration-seconds 3600 \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)
read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<<"$credentials"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN

invalidation_id=$(deployment/publish-static-release.sh \
  "$artifact_dir" "$bucket_name" "$distribution_id" "$aws_region" | tail -1)
[[ "$invalidation_id" =~ ^[A-Z0-9]+$ ]] || { echo 'CloudFront invalidation ID was not returned' >&2; exit 78; }
aws cloudfront wait invalidation-completed \
  --region "$aws_region" \
  --distribution-id "$distribution_id" \
  --id "$invalidation_id"
curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 "$canary_url" >/dev/null

mkdir -p deployment/releases
node - "deployment/releases/static-${CI_COMMIT_SHA}.json" "$bucket_name" "$distribution_id" "$invalidation_id" "$canary_url" <<'NODE'
const fs = require('node:fs');
const [file, bucket, distributionId, invalidationId, canaryUrl] = process.argv.slice(2);
fs.writeFileSync(file, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  gitSha: process.env.CI_COMMIT_SHA,
  provider: 'gitlab',
  pipelineId: process.env.CI_PIPELINE_ID,
  jobId: process.env.CI_JOB_ID,
  bucket,
  distributionId,
  invalidationId,
  canaryUrl,
}, null, 2)}\n`);
NODE
