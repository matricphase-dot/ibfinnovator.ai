#!/bin/bash
# ==============================================================================
# INNOVATORS.AI — EC2 PRODUCTION DEPLOY SCRIPT
# Run this on your EC2 server (ubuntu@52.62.130.217) as a single paste.
# Installs Nginx, builds the app, starts PM2, verifies everything.
# ==============================================================================

set -e  # Exit on any error

echo "=========================================="
echo "  INNOVATORS.AI — PRODUCTION DEPLOY"
echo "=========================================="

APP_DIR="/var/www/innovators"
DOMAIN="innovators-global.com"

# -----------------------------------------------
# 1. SYSTEM PACKAGES
# -----------------------------------------------
echo ""
echo "[1/7] Installing system packages..."
sudo apt update -y
sudo apt install -y nginx git curl ufw

# -----------------------------------------------
# 2. NODE.JS 22 (Skip if already installed)
# -----------------------------------------------
if ! command -v node &> /dev/null || [[ "$(node -v)" != v22* ]]; then
  echo "[2/7] Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt install -y nodejs
else
  echo "[2/7] Node.js $(node -v) already installed ✓"
fi

echo "  Node: $(node -v)"
echo "  NPM:  $(npm -v)"

# -----------------------------------------------
# 3. PM2 (Skip if already installed)
# -----------------------------------------------
if ! command -v pm2 &> /dev/null; then
  echo "[3/7] Installing PM2..."
  sudo npm install -g pm2
else
  echo "[3/7] PM2 already installed ✓"
fi

# -----------------------------------------------
# 4. APPLICATION CODE & BUILD
# -----------------------------------------------
echo "[4/7] Preparing application..."

if [ ! -d "$APP_DIR/.git" ]; then
  echo "  Cloning repository..."
  sudo mkdir -p "$APP_DIR"
  sudo chown -R ubuntu:ubuntu "$APP_DIR"
  git clone https://github.com/matricphase-dot/ibfinnovator.ai.git "$APP_DIR"
fi

cd "$APP_DIR"

# Check .env.local exists
if [ ! -f ".env.local" ]; then
  echo ""
  echo "  ╔══════════════════════════════════════════════╗"
  echo "  ║  ERROR: .env.local not found!                ║"
  echo "  ║  Upload it first:                            ║"
  echo "  ║  scp -i key.pem .env.local ubuntu@IP:/var/www/innovators/  ║"
  echo "  ╚══════════════════════════════════════════════╝"
  exit 1
fi

echo "  .env.local found ✓"

# Pull latest code
echo "  Pulling latest code..."
git pull origin main || true

echo "  Installing dependencies..."
npm install --production=false

echo "  Building Next.js production bundle..."
npm run build

echo "  Build complete ✓"

# -----------------------------------------------
# 5. PM2 ECOSYSTEM CONFIG
# -----------------------------------------------
echo "[5/7] Configuring PM2..."

cat > "$APP_DIR/ecosystem.config.cjs" << 'PMEOF'
module.exports = {
  apps: [
    {
      name: "innovators-app",
      script: "node_modules/next/dist/bin/next",
      args: "start --hostname 0.0.0.0 -p 3000",
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
PMEOF

# Stop any existing PM2 processes and start fresh
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Enable PM2 startup on reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true
pm2 save

echo "  PM2 running ✓"
pm2 list

# -----------------------------------------------
# 6. NGINX CONFIGURATION
# -----------------------------------------------
echo ""
echo "[6/7] Configuring Nginx..."

sudo tee /etc/nginx/sites-available/innovators > /dev/null << 'NGINXEOF'
# Upstream Next.js Node cluster
upstream nextjs_cluster {
    server 127.0.0.1:3000;
    keepalive 64;
}

# HTTP Server — Cloudflare terminates SSL, connects to origin via HTTP (Flexible)
# or HTTPS (Full/Strict). This config handles both.
server {
    listen 80;
    listen [::]:80;
    server_name innovators-global.com www.innovators-global.com app.innovators-global.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip Compression
    gzip on;
    gzip_proxied any;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        application/json
        application/javascript
        text/xml
        application/xml
        application/xml+rss
        text/javascript
        image/svg+xml
        application/wasm;

    # Next.js static assets — served directly by Nginx (bypass Node)
    location /_next/static/ {
        alias /var/www/innovators/.next/static/;
        expires 365d;
        access_log off;
        add_header Cache-Control "public, immutable";
    }

    # Public folder assets
    location /public/ {
        alias /var/www/innovators/public/;
        expires 30d;
        access_log off;
    }

    # Favicon, manifest, robots — serve from public
    location = /favicon.ico {
        root /var/www/innovators/public;
        access_log off;
    }

    # Health check endpoint (for monitoring)
    location = /api/health {
        proxy_pass http://nextjs_cluster;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # Main reverse proxy to Next.js
    location / {
        proxy_pass http://nextjs_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
        proxy_connect_timeout 30s;
        proxy_send_timeout 120s;

        # WebSocket support (for Supabase Realtime)
        proxy_buffering off;
    }

    # Block dotfiles (.env, .git, etc.)
    location ~ /\. {
        deny all;
        access_log off;
    }
}
NGINXEOF

# Enable site, remove default, test, restart
sudo ln -sf /etc/nginx/sites-available/innovators /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "  Testing Nginx configuration..."
sudo nginx -t

sudo systemctl enable nginx
sudo systemctl restart nginx

echo "  Nginx running ✓"

# -----------------------------------------------
# 7. FIREWALL (UFW)
# -----------------------------------------------
echo ""
echo "[7/7] Configuring firewall..."

sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP (Cloudflare → EC2)
sudo ufw allow 443/tcp  # HTTPS (if needed later)
sudo ufw --force enable

echo "  UFW active ✓"

# -----------------------------------------------
# VERIFICATION
# -----------------------------------------------
echo ""
echo "=========================================="
echo "  DEPLOYMENT VERIFICATION"
echo "=========================================="

# Wait for Next.js to fully boot
sleep 5

# Test local Next.js
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "307" ] || [ "$HTTP_STATUS" = "308" ]; then
  echo "  ✓ Next.js (PM2) responding on :3000  (HTTP $HTTP_STATUS)"
else
  echo "  ✗ Next.js NOT responding on :3000  (HTTP $HTTP_STATUS)"
  echo "    Run: pm2 logs innovators-app --lines 50"
fi

# Test Nginx proxy
NGINX_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
if [ "$NGINX_STATUS" = "200" ] || [ "$NGINX_STATUS" = "307" ] || [ "$NGINX_STATUS" = "308" ]; then
  echo "  ✓ Nginx proxy responding on :80     (HTTP $NGINX_STATUS)"
else
  echo "  ✗ Nginx NOT responding on :80     (HTTP $NGINX_STATUS)"
  echo "    Run: sudo nginx -t && sudo systemctl status nginx"
fi

# Test API health
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health || echo "000")
echo "  ○ /api/health endpoint:              (HTTP $HEALTH_STATUS)"

echo ""
echo "=========================================="
echo "  DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "  PM2 Processes:"
pm2 list
echo ""
echo "  Next Steps:"
echo "  1. In Cloudflare → SSL/TLS → Overview → Set mode to 'Flexible'"
echo "  2. Wait 1–2 minutes for Cloudflare cache to refresh"
echo "  3. Open https://$DOMAIN in your browser"
echo ""
echo "  Useful commands:"
echo "    pm2 logs innovators-app --lines 50   # View app logs"
echo "    pm2 monit                             # Live monitoring"
echo "    sudo systemctl status nginx           # Nginx status"
echo ""
