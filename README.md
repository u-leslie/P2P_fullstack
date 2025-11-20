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

## Quick Start

### Prerequisites
- Docker and Docker Compose
- (Optional) OpenAI API key for enhanced document processing

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IST_Tech_Assessment
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
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
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
IST_Tech_Assessment/
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

## License

This project is part of a technical assessment.

## Contact

For questions or issues, please contact the development team.

