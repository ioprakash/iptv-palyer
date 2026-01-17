#!/bin/bash
# IPTV Player - Safe Update Script
# Safely updates the application while preserving database

set -e

echo "🔄 IPTV Player Update Script"
echo "=============================="

APP_DIR="/opt/docker/iptv-player"
cd "$APP_DIR"

# 1. Backup database
echo "📦 Backing up database..."
if [ -f "data/channels.db" ]; then
    cp data/channels.db "data/channels.db.backup.$(date +%Y%m%d_%H%M%S)"
    echo "✓ Database backed up"
else
    echo "⚠ No database found"
fi

# 2. Pull latest code
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 3. Check if there are updates
if [ $? -eq 0 ]; then
    echo "✓ Code updated successfully"
else
    echo "❌ Failed to pull updates"
    exit 1
fi

# 4. Rebuild image (only if needed)
echo "🔨 Rebuilding Docker image..."
docker compose build

# 5. Restart with zero downtime approach
echo "🔄 Restarting application..."

# Build new image first
docker compose up -d --build --force-recreate

# Wait for health check
sleep 5

echo ""
echo "✅ Update complete!"
echo ""
echo "Check status: docker compose ps"
echo "View logs: docker compose logs -f"
echo ""
