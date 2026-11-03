#!/bin/bash
set -e
systemctl enable traffic-dashboard.service
systemctl restart traffic-dashboard.service
