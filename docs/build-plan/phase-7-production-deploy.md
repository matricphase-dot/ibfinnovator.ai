# Phase 7: Production Deployment & Infrastructure Setup
> **Status:** Planning · Ponytail Strict: Single EC2 instance running Next.js + Redis with zero container overhead  
> **Target:** Launch on AWS EC2 `c7i-flex.large`, Local Redis, Nginx reverse proxy, and Cloudflare Strict SSL.

---

## 1. Instance Provisioning & Base Packages (Ubuntu 24.04 LTS)

```bash
# System update
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx redis-server

# Install PM2 Process Manager
sudo npm install -g pm2
```

---

## 2. Local Redis Setup
- Bind to localhost: `bind 127.0.0.1 ::1` in `/etc/redis/redis.conf`.
- Enable persistence: `appendonly yes`.
- Verify: `redis-cli ping` -> returns `PONG`.

---

## 3. Nginx Reverse Proxy Configuration (`/etc/nginx/sites-available/innovators`)

```nginx
server {
    listen 80;
    server_name innovator-global.com www.innovator-global.com app.innovator-global.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. PM2 Cluster Deployment (`ecosystem.config.js`)
```javascript
module.exports = {
  apps: [{
    name: 'innovators-web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    instances: 2, // 2 vCPUs on c7i-flex.large
    exec_mode: 'cluster',
    env: {
      PORT: 3000,
      NODE_ENV: 'production'
    }
  }]
};
```

---

## 5. CI/CD Build & Zero-Downtime Deploy (GitHub Actions)
Build remotely in GitHub Actions to protect EC2 CPU/RAM:
1. `npm ci`
2. `npm run typecheck`
3. `npm run build`
4. Rsync `.next/standalone`, `.next/static`, and `public` to EC2.
5. SSH command: `pm2 reload innovators-web --update-env`.
