#!/bin/bash
# IPTV Player - Server Deployment Script
# For GMKTec K12 Mini PC (103.186.196.148)

set -e

echo "🚀 IPTV Player Deployment Script"
echo "=================================="

# Configuration
APP_DIR="/opt/docker/iptv-player"
BACKUP_DIR="$APP_DIR/backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Step 1: Backing up database...${NC}"
if [ -f "$APP_DIR/data/channels.db" ]; then
    BACKUP_FILE="$BACKUP_DIR/channels.db.$(date +%Y%m%d_%H%M%S)"
    cp "$APP_DIR/data/channels.db" "$BACKUP_FILE"
    echo -e "${GREEN}✓ Database backed up to: $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}⚠ No database found, skipping backup${NC}"
fi

echo -e "${YELLOW}📥 Step 2: Pulling latest code from GitHub...${NC}"
cd "$APP_DIR"
git pull origin main
echo -e "${GREEN}✓ Code updated${NC}"

echo -e "${YELLOW}🔨 Step 3: Building Docker image...${NC}"
sudo docker compose build
echo -e "${GREEN}✓ Build complete${NC}"

echo -e "${YELLOW}🛑 Step 4: Stopping old container...${NC}"
sudo docker compose down
echo -e "${GREEN}✓ Container stopped${NC}"

echo -e "${YELLOW}▶️  Step 5: Starting new container...${NC}"
sudo docker compose up -d
echo -e "${GREEN}✓ Container started${NC}"

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Access your IPTV Player at:"
echo "  - Public: http://103.186.196.148"
echo "  - Local:  http://192.168.10.5"
echo ""
echo "Admin Panel:"
echo "  - URL: http://103.186.196.148/admin"
echo "  - User: admin"
echo "  - Pass: kabali123"
echo ""
echo "To view logs: sudo docker compose logs -f"
echo ""
