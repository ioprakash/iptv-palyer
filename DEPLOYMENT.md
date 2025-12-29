# Deployment Instructions

Follow these steps to update your **Raspberry Pi Server** with the latest code from GitHub while keeping your database safe.

## Standard Update (Quick)
Use this if you haven't made any files changes directly on the server.

```bash
cd ~/docker/compose/iptv-web/

# 1. Pull latest code
git pull

# 2. Rebuild and restart containers
docker compose down
docker compose build
docker compose up -d
```

---

## Force Update (Recommended)
Use this if `git pull` fails or if you have "rogue files" / conflicts. **This method guarantees a clean state.**

### 1. Backup Database
Preserve your channel data before wiping changes.
```bash
cd ~/docker/compose/iptv-web/
cp server/channels.db ../channels.db.backup
```

### 2. Clean & Reset Code
Remove all local changes and stray files.
```bash
# Remove known rogue files if they exist
rm src/components/index.ts
rm src/components/m3uImporter.ts

# Force git to match the repository exactly
git fetch --all
git reset --hard origin/main
```

### 3. Restore Database
Bring your data back.
```bash
cp ../channels.db.backup server/channels.db
```

### 4. Rebuild & Restart
```bash
docker compose down
docker compose build
docker compose up -d
```
