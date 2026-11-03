#!/bin/bash
set -e
APP_DIR="/opt/traffic-dashboard"
id ec2-user >/dev/null 2>&1 || useradd --system --create-home ec2-user
chown -R ec2-user:ec2-user "$APP_DIR"
cat > /etc/systemd/system/traffic-dashboard.service <<'UNIT'
[Unit]
Description=AWS Traffic Management Demo
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/traffic-dashboard
Environment=PORT=3000
ExecStart=/usr/bin/node /opt/traffic-dashboard/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
UNIT
systemctl daemon-reload
