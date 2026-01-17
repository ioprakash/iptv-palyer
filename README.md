# IPTV Player

A modern, feature-rich IPTV player with admin panel for managing channels and playlists. Built with React, TypeScript, and Node.js, deployable via Docker.

## ✨ Features

- 🎬 **Modern Player Interface** - Clean, responsive video player with HLS support
- 📺 **Multi-Format Support** - HLS (m3u8), YouTube, and iframe embeds
- 🎯 **Channel Management** - Full admin panel for managing channels and playlists
- 🌐 **M3U Import** - Bulk import channels from M3U playlists
- ⭐ **Featured Channels** - Highlight important channels on landing page
- 🔄 **Auto-Sync** - Sync channels from remote playlist sources
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 💾 **SQLite Database** - Lightweight, persistent storage

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Git

### Deployment to Production Server

1. **Clone the repository:**
   ```bash
   cd /opt/docker
   git clone https://github.com/ioprakash/iptv-palyer.git iptv-player
   cd iptv-player
   ```

2. **Create data directory:**
   ```bash
   mkdir -p data
   ```

3. **Build and start:**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application:**
   - Web Player: `http://YOUR_SERVER_IP:3000`
   - Admin Panel: `http://YOUR_SERVER_IP:3000/admin`
   - Default credentials: `admin` / `kabali123`

## 🔧 Configuration

### Port Configuration

The application runs on port **3000** by default (mapped from internal port 3001).

To change the port, edit `docker-compose.yml`:
```yaml
ports:
  - "8080:3001"  # Change 8080 to your desired port
```

### Database

- **Type**: SQLite
- **Location**: `./data/channels.db`
- **Persistence**: Automatically persisted via Docker volume

## 📝 Development

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install
   ```

2. **Start development server:**
   ```bash
   # Terminal 1 - Frontend
   npm run dev

   # Terminal 2 - Backend
   cd server
   npm run dev
   ```

3. **Access:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3001`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

```bash
docker compose up -d
```

### Manual Docker Build

```bash
docker build -t iptv-player .
docker run -d -p 3000:3001 -v ./data:/app/server --name iptv-player iptv-player
```

## 🔄 Updating

### Quick Update Script

Use the included deployment script:

```bash
chmod +x deploy-server.sh
./deploy-server.sh
```

### Manual Update

```bash
git pull origin main
docker compose down
docker compose build
docker compose up -d
```

## 📖 Administration

### Admin Panel Features

- **Dashboard** - View statistics and channel counts
- **Channel Management** - Add, edit, delete, and organize channels
- **Featured Playlist** - Manage landing page featured channels
- **Import/Export** - Bulk import from M3U files
- **Source Management** - Configure auto-sync sources
- **Settings** - Configure application settings

### Default Credentials

- **Username**: `admin`
- **Password**: `kabali123`

⚠️ **Security**: Change the default password immediately after first login!

## 🛡️ Firewall Configuration

Allow HTTP traffic on your server:

```bash
# UFW
sudo ufw allow 3000/tcp

# Firewalld
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload
```

## 💾 Database Management

### Backup Database

```bash
cp data/channels.db data/channels.db.backup.$(date +%Y%m%d)
```

### Restore Database

```bash
cp data/channels.db.backup.YYYYMMDD data/channels.db
docker compose restart
```

### Reset Database

```bash
docker compose down
rm data/channels.db
docker compose up -d
```

## 🛠️ Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- React Router
- HLS.js

**Backend:**
- Node.js
- Express
- SQLite
- TypeScript

**DevOps:**
- Docker
- Docker Compose

## 📁 Project Structure

```
iptv-player/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── api/               # API client
│   └── utils/             # Utility functions
├── server/                # Backend source code
│   ├── index.ts           # Express server
│   ├── database.ts        # Database initialization
│   └── m3uImporter.ts     # M3U parser
├── data/                  # Database storage (persisted)
├── dist/                  # Built frontend files
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker image definition
└── DEPLOYMENT.md          # Detailed deployment guide
```

## 🔍 Troubleshooting

### Container won't start

```bash
docker compose logs
docker compose down
docker compose up -d --build
```

### Can't access from browser

1. Check if container is running: `docker ps`
2. Check firewall: `sudo ufw status`
3. Test locally: `curl http://localhost:3000`

### Database issues

```bash
# Backup first
cp data/channels.db data/channels.db.backup

# Reset
rm data/channels.db
docker compose restart
```

## 📚 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Detailed deployment instructions
- [Server Deployment Script](./deploy-server.sh) - Automated deployment script

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is private. All rights reserved.

## 👤 Author

**Prakash**
- GitHub: [@ioprakash](https://github.com/ioprakash)

## 🙏 Acknowledgments

- IPTV-Org for channel sources
- HLS.js for video playback
- React and Vite communities

---

Made with ❤️ for IPTV enthusiasts
