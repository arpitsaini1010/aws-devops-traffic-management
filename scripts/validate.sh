#!/bin/bash
set -e
for i in {1..15}; do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null; then
    echo "Application health check passed"
    exit 0
  fi
  sleep 2
done
echo "Application did not become healthy"
systemctl status traffic-dashboard.service --no-pager || true
exit 1
