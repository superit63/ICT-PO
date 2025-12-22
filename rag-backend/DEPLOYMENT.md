# Deployment Guide

## Architecture Overview

- **Frontend**: Deployed on Netlify
- **Backend (RAG)**: Deployed on VPS
- **Database**: Supabase (cloud)

## Backend Deployment (VPS)

### 1. Server Requirements

- Node.js 18+ installed
- PM2 or similar process manager (recommended)
- Nginx (optional, for reverse proxy)

### 2. Setup Steps

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Clone or upload your project
cd /var/www
git clone <your-repo> rag-backend
cd rag-backend

# Install dependencies
npm install

# Build the project
npm run build

# Create .env file with production values
nano .env
```

### 3. Environment Variables (.env)

```env
PORT=3001
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key

# IMPORTANT: Add your Netlify domain here
CORS_ORIGINS=https://your-app.netlify.app,https://www.yourdomain.com
```

### 4. Run with PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/index.js --name rag-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system reboot
pm2 startup
```

### 5. Setup Nginx Reverse Proxy (Optional but Recommended)

Create `/etc/nginx/sites-available/rag-backend`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;  # or your VPS IP

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:

```bash
sudo ln -s /etc/nginx/sites-available/rag-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Setup SSL Certificate (Recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

### 7. Firewall Configuration

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# If not using Nginx, allow your app port
sudo ufw allow 3001
```

## Frontend Deployment (Netlify)

### 1. Environment Variables

In Netlify dashboard, go to Site settings > Environment variables:

```env
VITE_RAG_BACKEND_URL=https://api.yourdomain.com/api/chat
# or if using VPS IP directly:
# VITE_RAG_BACKEND_URL=http://your-vps-ip:3001/api/chat
```

### 2. Build Settings

- Build command: `npm run build`
- Publish directory: `dist` (or your build output directory)

### 3. Deploy

- Connect your repository to Netlify
- Or use Netlify CLI: `netlify deploy --prod`

## Testing Deployment

### 1. Test Backend Health

```bash
curl https://api.yourdomain.com/health
```

### 2. Test CORS from Browser

Open browser console on your Netlify site and run:

```javascript
fetch('https://api.yourdomain.com/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Test question',
    role: 'sale'
  })
})
.then(r => r.json())
.then(console.log);
```

### 3. Test from Frontend

Make sure your frontend is using the correct backend URL from environment variables.

## Multilingual Support

The system handles:
- ✅ Vietnamese queries with English knowledge base
- ✅ Vietnamese queries with Vietnamese knowledge base
- ✅ English queries with mixed language knowledge base

The backend automatically:
1. Detects the language of the user's question
2. Uses Gemini's multilingual embeddings for cross-language semantic search
3. Responds in the same language as the question
4. Translates English context to Vietnamese when needed

## Troubleshooting

### CORS Errors

If you see CORS errors:
1. Check `CORS_ORIGINS` in backend `.env` includes your Netlify URL
2. Ensure the URL matches exactly (including https://)
3. Restart the backend server after changing `.env`

### Connection Refused

1. Check if backend is running: `pm2 status` or `ps aux | grep node`
2. Check firewall: `sudo ufw status`
3. Check if port is accessible: `curl http://localhost:3001/health`

### SSL Certificate Issues

1. Ensure domain DNS points to your VPS IP
2. Verify Nginx configuration: `sudo nginx -t`
3. Check certificate: `sudo certbot certificates`

## Monitoring

### PM2 Monitoring

```bash
# View logs
pm2 logs rag-backend

# Monitor in real-time
pm2 monit

# View status
pm2 status
```

### Health Check Endpoint

Set up monitoring service (like UptimeRobot) to check:
```
https://api.yourdomain.com/health
```

## Updates and Maintenance

```bash
# SSH into VPS
ssh user@your-vps-ip

# Navigate to project
cd /var/www/rag-backend

# Pull latest changes
git pull

# Rebuild
npm run build

# Restart with PM2
pm2 restart rag-backend
```
