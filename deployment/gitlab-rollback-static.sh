#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 5 ]]; then
  echo 'usage: gitlab-rollback-static.sh <role-arn> <release-sha> <bucket> <distribution-id> <canary-url>' >&2
  exit 64
fi

role_arn=$1
release_sha=$2
bucket_name=$3
distribution_id=$4
canary_url=$5
aws_region=${LAYRSV2_PRIMARY_REGION:-us-east-1}

[[ "${CI_COMMIT_REF_PROTECTED:-false}" == true && "${CI_COMMIT_BRANCH:-}" == "${CI_DEFAULT_BRANCH:-}" ]] || {
  echo 'production rollback requires a protected default-branch GitLab job' >&2
  exit 77
}
[[ "$release_sha" =~ ^[0-9a-f]{40}$ ]] || { echo 'immutable 40-byte release SHA required' >&2; exit 65; }
[[ "$bucket_name" == layrsv2-* ]] || { echo 'bucket must start with layrsv2-' >&2; exit 65; }

credentials=$(aws sts assume-role \
  --region "$aws_region" \
  --role-arn "$role_arn" \
  --role-session-name "layrs-marketing-rollback-${CI_PIPELINE_ID:-manual}-${CI_JOB_ID:-0}" \
  --duration-seconds 3600 \
  --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
  --output text)
read -r AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN <<<"$credentials"
export AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_SESSION_TOKEN

aws s3api head-object --region "$aws_region" --bucket "$bucket_name" --key "releases/$release_sha/index.html" >/dev/null
aws s3 sync "s3://$bucket_name/releases/$release_sha/" "s3://$bucket_name/current/" \
  --region "$aws_region" --delete --only-show-errors
aws s3 cp "s3://$bucket_name/releases/$release_sha/index.html" "s3://$bucket_name/current/index.html" \
  --region "$aws_region" \
  --cache-control 'public,max-age=60,must-revalidate' \
  --content-type 'text/html; charset=utf-8' \
  --metadata-directive REPLACE \
  --only-show-errors

invalidation_id=$(aws cloudfront create-invalidation --region "$aws_region" --distribution-id "$distribution_id" --paths '/*' --query Invalidation.Id --output text)
aws cloudfront wait invalidation-completed --region "$aws_region" --distribution-id "$distribution_id" --id "$invalidation_id"
curl --fail --silent --show-error --retry 12 --retry-all-errors --retry-delay 5 "$canary_url" >/dev/null

mkdir -p deployment/releases
node - "deployment/releases/static-rollback-${CI_PIPELINE_ID}-${CI_JOB_ID}.json" "$release_sha" "$bucket_name" "$distribution_id" "$invalidation_id" "$canary_url" <<'NODE'
const fs = require('node:fs');
const [file, releaseSha, bucket, distributionId, invalidationId, canaryUrl] = process.argv.slice(2);
fs.writeFileSync(file, `${JSON.stringify({
  generatedAt: new Date().toISOString(),
  requestedFromGitSha: process.env.CI_COMMIT_SHA,
  restoredReleaseSha: releaseSha,
  provider: 'gitlab',
  pipelineId: process.env.CI_PIPELINE_ID,
  jobId: process.env.CI_JOB_ID,
  bucket,
  distributionId,
  invalidationId,
  canaryUrl,
}, null, 2)}\n`);
NODE
