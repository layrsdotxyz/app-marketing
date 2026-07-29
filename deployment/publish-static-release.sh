#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 4 ]]; then
  echo 'usage: publish-static-release.sh <artifact-dir> <bucket> <distribution-id> <region>' >&2
  exit 64
fi

artifact_dir=$1
bucket_name=$2
distribution_id=$3
aws_region=$4

[[ -f "$artifact_dir/index.html" ]] || { echo 'artifact requires index.html' >&2; exit 66; }
[[ "$bucket_name" == layrsv2-* ]] || { echo 'bucket must start with layrsv2-' >&2; exit 65; }

caller_arn=$(aws sts get-caller-identity --query Arn --output text)
[[ "$caller_arn" != *':root' && "$caller_arn" == *':assumed-role/layrsv2-'* ]] || {
  echo 'least-privilege layrsv2 role required' >&2
  exit 77
}

release_id=${CIRCLE_SHA1:-${GITHUB_SHA:-}}
[[ "$release_id" =~ ^[0-9a-f]{40}$ ]] || { echo 'immutable 40-byte release SHA required' >&2; exit 65; }

aws s3 sync "$artifact_dir" "s3://$bucket_name/releases/$release_id/" \
  --region "$aws_region" \
  --only-show-errors \
  --cache-control 'public,max-age=31536000,immutable'
aws s3 sync "s3://$bucket_name/releases/$release_id/" "s3://$bucket_name/current/" \
  --region "$aws_region" \
  --delete \
  --only-show-errors
aws s3 cp "$artifact_dir/index.html" "s3://$bucket_name/current/index.html" \
  --region "$aws_region" \
  --cache-control 'public,max-age=60,must-revalidate' \
  --content-type 'text/html; charset=utf-8'
for route in deployment demo adoption; do
  [[ -f "$artifact_dir/$route.html" ]] || { echo "artifact requires $route.html" >&2; exit 66; }
  aws s3 cp "$artifact_dir/$route.html" "s3://$bucket_name/releases/$release_id/$route" \
    --region "$aws_region" \
    --cache-control 'public,max-age=31536000,immutable' \
    --content-type 'text/html; charset=utf-8'
  aws s3 cp "$artifact_dir/$route.html" "s3://$bucket_name/current/$route" \
    --region "$aws_region" \
    --cache-control 'public,max-age=60,must-revalidate' \
    --content-type 'text/html; charset=utf-8'
done
for media_file in layrs-privacy-demo.webm layrs-privacy-demo.vtt; do
  [[ -f "$artifact_dir/media/$media_file" ]] || { echo "artifact requires media/$media_file" >&2; exit 66; }
  aws s3 cp "$artifact_dir/media/$media_file" "s3://$bucket_name/current/media/$media_file" \
    --region "$aws_region" \
    --cache-control 'public,max-age=60,must-revalidate' \
    --content-type "$(
      if [[ "$media_file" == *.webm ]]; then
        printf 'video/webm'
      else
        printf 'text/vtt; charset=utf-8'
      fi
    )"
done
aws cloudfront create-invalidation \
  --region "$aws_region" \
  --distribution-id "$distribution_id" \
  --paths '/' '/index.html' '/deployment' '/deployment.html' '/demo' '/demo.html' '/adoption' '/adoption.html' \
    '/adoption.js' '/deployment.js' '/site.js' '/styles.css' '/evidence.css' \
    '/media/layrs-privacy-demo.webm' '/media/layrs-privacy-demo.vtt' \
  --query Invalidation.Id \
  --output text
