# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Copy dependencies list and install
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source files and compile
COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Package the Django Application
# ==========================================
FROM python:3.12-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python packages
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/ ./backend

# Copy the compiled frontend output from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Set production environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DEBUG=False
ENV SECRET_KEY=django-insecure-build-time-secret-key-collectstatic

# Collect static files into the Django static directory
RUN python backend/manage.py collectstatic --noinput

# Create directory for persisting SQLite database, and configure non-root user
RUN mkdir -p /app/db && \
    groupadd -g 1000 django && \
    useradd -u 1000 -g django -m -s /bin/bash django && \
    chown -R django:django /app

# Run from the backend directory
WORKDIR /app/backend

# Switch to non-root user
USER django

# Expose port 8000
EXPOSE 8000

# Run migrations and start Gunicorn server
CMD ["sh", "-c", "python manage.py migrate && gunicorn --bind 0.0.0.0:8000 --workers 3 --threads 2 --timeout 60 --access-logfile - --error-logfile - lead_management.wsgi:application"]
