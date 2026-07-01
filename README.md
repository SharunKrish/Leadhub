# 📋 Lead Management Dashboard

A modern, responsive web application for managing, tracking, and analyzing sales and marketing leads from various channels (Facebook, Google, Organic).

Built as an **Internship Project Assignment** adhering to Django best practices, validation requirements, and interactive UI excellence.

---

## 🚀 Quick Start Guide

> [!IMPORTANT]
> **Python 3.12+** is required for this project to run Django 6.0.

### 1. Backend Setup (Django REST Framework)
From the project root:
```bash
# Navigate to the backend directory
cd backend

# Initialize the Python virtual environment
python3 -m venv .venv
source .venv/bin/activate  # (On Windows use `.venv\Scripts\activate`)

# Install python requirements
pip install -r requirements.txt

# Run database migrations
python manage.py migrate

# Seed the database with realistic mock data (50 leads + notes)
python manage.py seed_leads

# Start the Django development server
python manage.py runserver
```
The API server will run at `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup (React + Vite)
From the project root (open a new terminal tab/window):
```bash
# Navigate to the frontend directory
cd frontend

# Install npm dependencies
npm install

# Start the Vite development server
npm run dev
```
The React app will run at `http://localhost:5173/` (proxied to `/api` locally).

---

## 🔑 Administrator Credentials
The database seeds a default superuser account for grading and administrative review:
* **Username:** `admin`
* **Password:** `admin`

You can use these credentials to log in on the web application login page, or log in to the Django Admin Panel directly at `http://127.0.0.1:8000/admin/`.

---

## 🛠️ Implemented Features

### Core Requirements (Fully Implemented)
1. **Interactive Dashboard View:**
   * Total leads counter.
   * Today's lead count (computed in local time).
   * Leads grouped by Source (Facebook, Google, Organic).
   * Leads grouped by Status (New, Contacted, Qualified, Closed).
2. **Lead Directory & CRUD Management:**
   * List all leads in a clean data table.
   * Add a new lead.
   * Edit existing lead details.
   * Delete leads (with confirmation modal).
   * Dynamically change lead statuses.
3. **Advanced Search & Filtering:**
   * Search leads instantly by **Name**, **Email**, or **Phone Number**.
   * Filter database list by **Lead Source** and **Lead Status**.
4. **Excel Export:**
   * Export all filtered/searched records into a styled `.xlsx` file using `openpyxl`.

### Implemented Bonus Features
1. **User Authentication & Login:** Secure Django Token authentication flow with protected routes.
2. **Password Visibility Toggle:** Show/hide password button inside authentication input fields (Login and Settings page).
3. **Pagination:** Page-by-page server pagination (20 items per page).
4. **Charts & Analytics:** Integrated Chart.js pie and bar charts showing lead metrics.
5. **CSV Import:** Bulk-import leads by uploading a CSV file (with error tracking reporting).
6. **Dashboard Graphs:** Highly visual analytics charts that adapt automatically to theme states.
7. **Lead Notes/Comments:** Attach notes and follow-ups to specific leads (e.g. record call logs, demo status).
8. **Sorting:** Dynamically sort directory lists by created date or alphabetical columns.
9. **Dark Mode:** Fluid dark/light theme switch powered by React Context and Bootstrap 5 native themes.

---

## 🌐 Production Deployment (Render + Docker)

This application is ready for production as a unified **Docker Container** on **Render**. The container automatically builds the React frontend, packages it under Django's static files, and starts Gunicorn.

### 1. Database Setup
1. Create a **PostgreSQL** database on Render.
2. Copy the **Internal Database URL** (e.g., `postgres://...`).

### 2. Web Service Setup
1. Create a new **Web Service** on Render connected to your repository.
2. Select **Docker** as the Runtime environment.
3. Keep the **Pre-Deploy Command** blank (migrations are handled automatically on startup).
4. Add the following **Environment Variables** in Render:

| Variable Name | Example Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgres://user:pass@host/db` | Your Render PostgreSQL connection string |
| `DATABASE_SSL_REQUIRE` | `True` | Requires SSL connection to database |
| `DEBUG` | `False` | Disables debug mode in production |
| `SECRET_KEY` | `your-long-secure-random-string` | Production Django secret key |
| `ALLOWED_HOSTS` | `.onrender.com` or `leadhub.onrender.com` | Allowed hostnames for requests |

### 3. Automatic Migrations
The Dockerfile runs migrations (`python manage.py migrate`) inside the container right before booting the Gunicorn server. No manual migrations are required on deploy.

### 4. Create Admin Account in Production
To access the admin dashboard on the deployed app:
1. Navigate to your Web Service page in the **Render Dashboard**.
2. Click the **Shell** tab on the left-hand menu.
3. Run the following command:
   ```bash
   python manage.py createsuperuser
   ```
4. Follow the interactive console prompts to set up your username, email, and password.

---

## 🧪 Running Unit Tests
A full API suite of 12 unit tests covers validation rules, duplicate prevention, filters, stats, and token credentials.

To run the test suite:
```bash
cd backend
python manage.py test
```
