#!/bin/sh
# Render s3.json from env for the standalone gateway or the combined server.
set -eu
umask 077
sed -e "s|\${S3_ACCESS_KEY}|${S3_ACCESS_KEY}|" -e "s|\${S3_SECRET_KEY}|${S3_SECRET_KEY}|" \
  /etc/seaweedfs/s3.template.json > /tmp/s3.json
if [ "$#" -gt 0 ]; then
  exec weed "$@" -s3.config=/tmp/s3.json
fi
exec weed s3 -filer=filer:8888 -port=8333 -config=/tmp/s3.json
