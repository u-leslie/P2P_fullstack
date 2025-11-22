# AWS EC2 Deployment Guide

## Step 1: Connect to Your EC2 Instance

### Fix SSH Connection

1. **Find your key file location:**
   ```bash
   # Common locations:
   ls ~/.ssh/my-key.pem
   ls ~/Downloads/my-key.pem
   ```

2. **Navigate to the directory containing your key:**
   ```bash
   cd ~/.ssh  # or wherever your key is
   ```

3. **Set correct permissions:**
   ```bash
   chmod 400 my-key.pem
   ```

4. **Connect to EC2:**
   ```bash
   ssh -i my-key.pem ubuntu@51.21.222.212
   ```

   **Note:** If your key is in a different location, use the full path:
   ```bash
   ssh -i /full/path/to/my-key.pem ubuntu@51.21.222.212
   ```

---

## Step 2: Install Docker and Docker Compose

Once connected to EC2, run:

```bash
# Update system
sudo apt update

# Install Docker
sudo apt install docker.io -y

# Install Docker Compose
sudo apt install docker-compose -y

# Add your user to docker group (to run docker without sudo)
sudo usermod -aG docker ubuntu

# Log out and log back in for group changes to take effect
exit
```

**Reconnect:**
```bash
ssh -i my-key.pem ubuntu@51.21.222.212
```

**Verify Docker installation:**
```bash
docker --version
docker-compose --version
```

---

## Step 3: Clone Your Repository

```bash
# Clone your repository
git clone https://github.com/u-leslie/P2P_fullstack.git
cd P2P_fullstack

# OR if you need to upload files manually, use SCP from your local machine:
# scp -i my-key.pem -r /path/to/P2P_fullstack ubuntu@51.21.222.212:~/
```

---

## Step 4: Create Production Environment File

Create the production environment file:

```bash
cd P2P_fullstack
nano backend/.env.production
```

**Add the following content (adjust values as needed):**

```env
# Django Settings
SECRET_KEY=your-super-secret-key-here-generate-a-new-one
DEBUG=False
ALLOWED_HOSTS=51.21.222.212,ec2-51-21-222-212.eu-north-1.compute.amazonaws.com,localhost

# Database (using Docker Compose service name)
DB_NAME=procure_to_pay
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=db
DB_PORT=5432
USE_SQLITE=False

# OpenAI API (if using AI features)
OPENAI_API_KEY=your-openai-api-key-here

# CORS (if needed)
CORS_ALLOWED_ORIGINS=http://51.21.222.212,http://ec2-51-21-222-212.eu-north-1.compute.amazonaws.com
```

**To generate a secure SECRET_KEY, run:**
```bash
python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

**Save and exit:** Press `Ctrl+X`, then `Y`, then `Enter`

---

## Step 5: Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

---

## Step 6: Pull Docker Images

```bash
docker pull uleslie/p2p-backend:latest
docker pull uleslie/p2p-frontend:latest
```

---

## Step 7: Start the Application

```bash
# Make sure you're in the project root
cd ~/P2P_fullstack

# Start all services
docker-compose -f docker-compose.prod.yml up -d
```

**Check if containers are running:**
```bash
docker ps
```

You should see three containers:
- `db` (PostgreSQL)
- `backend` (Django)
- `frontend` (React/Nginx)

---

## Step 8: Verify Deployment

### Check Logs

```bash
# Backend logs
docker logs backend

# Frontend logs
docker logs frontend

# Database logs
docker logs db
```

### Test the Application

1. **Frontend:** Open in browser: `http://51.21.222.212`
2. **Backend API:** `http://51.21.222.212:8000/api`
3. **API Docs:** `http://51.21.222.212:8000/api/swagger/`

---

## Step 9: Security Group Configuration

Make sure your EC2 Security Group allows:

- **Inbound Rules:**
  - SSH (22) - from your IP
  - HTTP (80) - from anywhere (0.0.0.0/0)
  - Custom TCP (8000) - from anywhere (0.0.0.0/0) - for API access

**To update Security Group:**
1. Go to AWS Console → EC2
2. Select your instance → Security tab
3. Click on Security Group → Edit inbound rules
4. Add rules if missing

---

## Step 10: Update Frontend API URL (Important!)

Rebuild frontend with correct URL (Recommended)**

On your local machine:

```bash
cd P2P_fullstack/frontend

# Rebuild with EC2 IP
docker build \
  --build-arg REACT_APP_API_URL=http://51.21.222.212:8000/api \
  -t uleslie/p2p-frontend:latest \
  .

# Push to Docker Hub
docker push uleslie/p2p-frontend:latest
```

Then on EC2:
```bash
docker pull uleslie/p2p-frontend:latest
docker-compose -f docker-compose.prod.yml up -d frontend
```


## Troubleshooting

### Container won't start
```bash
docker logs <container-name>
docker-compose -f docker-compose.prod.yml logs
```

### Database connection issues
```bash
# Check if database is healthy
docker exec db pg_isready -U postgres

# Check backend logs
docker logs backend
```

### Permission issues
```bash
sudo chown -R $USER:$USER ~/P2P_fullstack
```

### Restart services
```bash
docker-compose -f docker-compose.prod.yml restart
```

### Stop services
```bash
docker-compose -f docker-compose.prod.yml down
```

### View all logs
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

---

## Default Login Credentials

After deployment, you can login with:

- **Staff:** `staff@p2p.com` / `Test@123`
- **Approver 1:** `approve1@p2p.com` / `Test@123`
- **Approver 2:** `approve2@p2p.com` / `Test@123`
- **Finance:** `finance@p2p.com` / `Test@123`

---

## Next Steps (Optional)

1. **Set up a domain name** and point it to your EC2 IP
2. **Configure HTTPS** using Let's Encrypt
3. **Set up automated backups** for the database
4. **Configure CloudWatch** for monitoring
5. **Set up auto-scaling** if needed

---

## Cost Management

- **Free Tier:** t2.micro instances are free for 750 hours/month
- **You're using t3.small:** This will incur charges (~$0.02/hour)
- **To minimize costs:** Stop the instance when not in use
- **Monitor:** Check AWS Billing Dashboard regularly

