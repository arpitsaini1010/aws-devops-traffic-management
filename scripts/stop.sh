#!/bin/bash
set -e
systemctl stop traffic-dashboard.service 2>/dev/null || true
