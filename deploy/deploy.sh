#!/usr/bin/env bash
# Run this ON THE VPS whenever you want to pull the latest code from GitHub and redeploy.
# Usage: cd /var/www/garage-door && ./deploy/deploy.sh
set -euo pipefail

echo "==> Pulling latest code from GitHub..."
git pull origin main

echo "==> Installing/updating server dependencies..."
cd server
npm install --omit=dev
cd ..

echo "==> Restarting service..."
pm2 restart garage-door-lift

echo "==> Done. Recent logs:"
pm2 logs garage-door-lift --lines 20 --nostream
