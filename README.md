# 📋 Lead Management Dashboard

A modern, responsive web application for managing, tracking, and analyzing sales and marketing leads from various channels (Facebook, Google, Organic).

Built as an **Internship Project Assignment** adhering to Django best practices, validation requirements, and interactive UI excellence.

---

## 🚀 Quick Start Guide

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

# Run migrations
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

### Implemented Bonus Features (All 8 Included!)
1. **User Authentication & Login:** Secure Django Token authentication flow with protected routes.
2. **Pagination:** Page-by-page server pagination (20 items per page).
3. **Charts & Analytics:** Integrated Chart.js pie and bar charts showing lead metrics.
4. **CSV Import:** Bulk-import leads by uploading a CSV file (with error tracking reporting).
5. **Dashboard Graphs:** Highly visual analytics charts that adapt automatically to theme states.
6. **Lead Notes/Comments:** Attach notes and follow-ups to specific leads (e.g. record call logs, demo status).
7. **Sorting:** Dynamically sort directory lists by created date or alphabetical columns.
8. **Dark Mode:** Fluid dark/light theme switch powered by React Context and Bootstrap 5 native themes.

---

## 🧪 Running Unit Tests
A full API suite of 12 unit tests covers validation rules, duplicate prevention, filters, stats, and token credentials.
To run the test suite:
```bash
cd backend
python manage.py test
```
