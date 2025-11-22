# Procure-to-Pay System

A comprehensive Purchase Request & Approval System built with Django REST Framework and React TypeScript.

## Features

- **Multi-level Approval Workflow**: Staff submit requests → Level 1 & Level 2 approvers review → Finance team manages approved requests
- **Role-based Access Control**: Different dashboards for Staff, Approvers, and Finance team
- **Document Processing**: AI-powered extraction from proforma invoices and receipt validation
- **Purchase Order Generation**: Automatic PO creation upon final approval
- **Receipt Validation**: Compare receipts against purchase orders to flag discrepancies
- **RESTful API**: Complete API with JWT authentication
- **Modern UI**: React with TypeScript and Tailwind CSS

## Tech Stack

### Backend
- Django 5.2.8
- Django REST Framework
- PostgreSQL
- JWT Authentication
- OpenAI API (for document processing)
- PDF/OCR libraries (pdfplumber, pytesseract)

### Frontend
- React 18 with TypeScript
- Tailwind CSS
- React Router
- Axios

### Infrastructure
- Docker & Docker Compose
- Nginx (for frontend)

## Live Application

🌐 **Public Frontend URL**: http://51.21.222.212

You can access the live application using the default credentials:
- **Staff**: `staff@p2p.com` / `Test@123`
- **Approver Level 1**: `approve1@p2p.com` / `Test@123`
- **Approver Level 2**: `approve2@p2p.com` / `Test@123`
- **Finance**: `finance@p2p.com` / `Test@123`

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) OpenAI API key for enhanced document processing

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/u-leslie/P2P_fullstack.git
   cd P2P_fullstack
   ```

2. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env and add your SECRET_KEY and OPENAI_API_KEY (optional)
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Default users are automatically created on startup (login with email):
     - **Staff**: `staff@p2p.com` / `Test@123`
     - **Approver Level 1**: `approve1@p2p.com` / `Test@123`
     - **Approver Level 2**: `approve2@p2p.com` / `Test@123`
     - **Finance**: `finance@p2p.com` / `Test@123`
   
   To create additional superuser:
   ```bash
   docker-compose exec backend python manage.py createsuperuser
   ```

5. **Access the application**
   - **Live Frontend**: http://51.21.222.212
   - **Local Development**:
     - Frontend: http://localhost:3000
     - Backend API: http://localhost:800
     - API Documentation (Swagger): http://localhost:8000/swagger/
     - Admin Panel: http://localhost:8000/admin/

## Development Setup

### Backend Development

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up PostgreSQL (default) or use SQLite for development
# PostgreSQL is the default. To use SQLite, set USE_SQLITE=True in .env
# For PostgreSQL, ensure PostgreSQL is running and configure DB_* variables in .env

python manage.py migrate
python manage.py seed_users  # Seed default users (staff, approvers, finance)
python manage.py createsuperuser  # Optional: create admin user
python manage.py runserver
```

### Frontend Development

```bash
cd frontend
npm install
npm start
```

## User Roles

1. **Staff**: Can create, view, and update their own pending requests. Can upload proformas and receipts.
2. **Approver Level 1**: Can view and approve/reject pending requests at level 1.
3. **Approver Level 2**: Can view and approve/reject requests that have passed level 1.
4. **Finance**: Can view all approved requests and manage purchase orders.

## Default Users

The application automatically seeds the following users on startup:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| `staff@p2p.com` | `Test@123` | Staff | Regular staff member |
| `approve1@p2p.com` | `Test@123` | Approver Level 1 | First-level approver |
| `approve2@p2p.com` | `Test@123` | Approver Level 2 | Second-level approver |
| `finance@p2p.com` | `Test@123` | Finance | Finance team member |

You can use these credentials to test the application immediately after startup. To re-seed users (useful if you've modified them), run:
```bash
docker-compose exec backend python manage.py seed_users --force
```

## Password Requirements

When registering new users, passwords must meet the following requirements:
- **Minimum 8 characters**
- **At least one uppercase letter** (A-Z)
- **At least one lowercase letter** (a-z)
- **At least one symbol** (!@#$%^&* etc.)

These requirements are enforced on the backend during user registration.

## API Endpoints

### Authentication
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login with email and password
- `GET /api/auth/me/` - Get current user
- `POST /api/auth/refresh/` - Refresh JWT token

### Purchase Requests
- `GET /api/requests/` - List requests (filtered by role)
- `POST /api/requests/` - Create new request
- `GET /api/requests/{id}/` - Get request details
- `PUT /api/requests/{id}/` - Update request (if pending)
- `PATCH /api/requests/{id}/approve/` - Approve request
- `PATCH /api/requests/{id}/reject/` - Reject request
- `GET /api/requests/{id}/history/` - Get approval history

### Documents
- `POST /api/proformas/` - Upload proforma invoice
- `POST /api/receipts/` - Upload receipt
- `GET /api/purchase-orders/` - List purchase orders
- `POST /api/receipts/{id}/validate/` - Validate receipt against PO

## Document Processing

The system supports AI-powered document extraction:

1. **Proforma Upload**: Extracts vendor name, items, prices, and terms
2. **PO Generation**: Automatically creates purchase order upon final approval
3. **Receipt Validation**: Compares receipt data against PO and flags discrepancies

Uses OpenAI GPT-4 (if API key provided) or falls back to basic text extraction.

## Deployment

### Production Considerations

1. Set `DEBUG=False` in environment variables
2. Configure proper `ALLOWED_HOSTS`
3. Use a production-grade database (PostgreSQL recommended)
4. Set up proper static file serving (e.g., AWS S3, CloudFront)
5. Configure CORS properly for your domain
6. Use environment variables for sensitive data
7. Set up SSL/TLS certificates

### Deployment Options

- **AWS EC2**: Deploy using Docker on EC2 instance
- **Render**: Connect GitHub repo and deploy
- **Fly.io**: Use `fly deploy` command
- **Railway**: Connect repo and deploy
- **DigitalOcean**: Use App Platform or Droplets

## Docker & Hosting Guide

### 1. Local development
```bash
docker-compose up --build
```
- Backend → http://localhost:8000
- Frontend → http://localhost:3000

### 2. Build & push production images (Docker Hub tag (Example): `uleslie`)
```bash
# Backend (gunicorn + entrypoint)
docker build -t uleslie/p2p-backend:latest backend
docker push uleslie/p2p-backend:latest

# Frontend (compile with API URL)
docker build \
  --build-arg REACT_APP_API_URL=https://<your-domain-or-ip>/api \
  -t uleslie/p2p-frontend:latest \
  frontend
docker push uleslie/p2p-frontend:latest
```

### 3. Run production stack (locally or on a server)
1. Create a production env file (copy your local `.env` or start fresh):
   ```bash
   cp backend/.env backend/.env.production   # edit with production values
   ```
2. Bring up the stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```
- Frontend exposed on port **80**
- Backend exposed on port **8000**

### 4. AWS EC2 (Free Tier) deployment steps
1. Launch **Ubuntu 22.04** `t2.micro`, open ports 22/80/443 (8000 optional).
2. SSH in and install Docker:
   ```bash
   sudo apt update && sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   exit && ssh back in
   ```
3. Clone repo & prepare environment:
   ```bash
   git clone https://github.com/u-leslie/P2P_fullstack.git
   cd P2P_fullstack
   cp backend/.env backend/.env.production   # adjust DB creds, secrets
   ```
4. Pull images & start production compose:
   ```bash
   docker login
   docker pull uleslie/p2p-backend:latest
   docker pull uleslie/p2p-frontend:latest
   docker-compose -f docker-compose.prod.yml up -d
   ```
5. Visit `http://<ec2-public-ip>` for the React UI. API lives at `http://<ec2-public-ip>:8000/api`.
6. (Optional) Attach a domain + HTTPS (Nginx + Certbot or AWS Load Balancer).

> Stop the EC2 instance when idle to stay within Free Tier limits.

## Testing

```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

## Project Structure

```
P2P_fullstack/
├── backend/
│   ├── users/          # User model and authentication
│   ├── requests/       # Purchase request models and views
│   ├── documents/      # Document processing and models
│   └── procure_to_pay/ # Django project settings
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── context/   # Auth context
│   │   └── services/  # API service
│   └── public/
├── docker-compose.yml
└── README.md
```

## Repository

 **GitHub Repository**: https://github.com/u-leslie/P2P_fullstack

## License

This project is part of a technical assessment.

## Contact

For questions or issues, please contact the development team.

