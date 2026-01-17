# IPTV Player - Production Deployment

Quick reference guide for deploying the IPTV Player to your production server (GMKTec K12 Mini PC).

## Server Information

- **Public IP**: `103.186.196.148`
- **Private IP**: `192.168.10.5`
- **Port**: `80` (HTTP)
- **Admin**: `admin` / `kabali123`

## First-Time Setup

### 1. On Your Local Machine (Push to GitHub)

```bash
# Navigate to project
cd d:\code\iptv-player

# Commit recent changes
git add .
git commit -m "Added fixes: SPA routing, GUI improvements, cleanup"

# Push to GitHub (replace with your repo URL)
git push origin main
```

### 2. On Server (Initial Deploy)

```bash
# SSH into server
ssh user@103.186.196.148

# Navigate to Docker directory
cd /opt/docker

# Clone repository (replace with your repo URL)
git clone https://github.com/your-username/iptv-player.git
cd iptv-player

# Create data directory for database
mkdir -p data

# Build and start
sudo docker compose build
sudo docker compose up -d

# Check status
sudo docker compose logs -f
```

### 3. Configure Firewall

```bash
# Allow HTTP traffic
sudo ufw allow 80/tcp
# OR for firewalld:
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --reload
```

## Updates (After First Deploy)

Use the deployment script:

```bash
cd /opt/docker/iptv-player
./deploy-server.sh
```

Or manually:

```bash
cd /opt/docker/iptv-player
git pull origin main
sudo docker compose down
sudo docker compose build
sudo docker compose up -d
```

## Access

- **Web Player**: http://103.186.196.148
- **Admin Panel**: http://103.186.196.148/admin

## Common Commands

```bash
# View logs
sudo docker compose logs -f

# Restart
sudo docker compose restart

# Stop
sudo docker compose down

# Rebuild from scratch
sudo docker compose down -v
sudo docker compose up -d --build

# Backup database
cp data/channels.db data/channels.db.backup

# Access container
sudo docker exec -it iptv-player sh
```

## Port Configuration

The docker-compose.yml maps port 80 on the host to port 3001 in the container:

```yaml
ports:
  - "80:3001"
```

To use a different port, change `80` to your desired port (e.g., `8080:3001`).

## Troubleshooting

**Can't access from internet:**
1. Check firewall: `sudo ufw status`
2. Verify container: `sudo docker ps`
3. Test locally: `curl http://localhost:80`
4. Check router port forwarding

**Container won't start:**
1. Check logs: `sudo docker compose logs`
2. Check port conflict: `sudo netstat -tlnp | grep :80`
3. Rebuild: `sudo docker compose build --no-cache`

**Database issues:**
- Backup is in `data/` directory
- To reset: Delete `data/channels.db` and restart container

For detailed instructions, see the main deployment guide.
