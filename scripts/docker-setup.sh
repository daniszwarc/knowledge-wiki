#!/bin/bash
set -e

echo "APi GROUP Knowledge Wiki — Docker Setup"
echo "========================================"

# Check .env exists
if [ ! -f .env ]; then
  echo "ERROR: .env file not found."
  echo "Copy .env.docker.example to .env and fill in your values."
  exit 1
fi

echo "Building containers..."
docker compose build

echo "Starting postgres..."
docker compose up -d postgres

echo "Waiting for postgres to be ready..."
sleep 10

echo "Running database migrations..."
docker compose run --rm wiki npx tsx scripts/migrate.ts

echo "Seeding admin user..."
docker compose run --rm wiki npx tsx scripts/seed-admin.ts

echo "Starting all services..."
docker compose up -d

echo "Pulling Ollama models (this may take a few minutes)..."
docker compose exec ollama ollama pull llama3.2:latest
docker compose exec ollama ollama pull nomic-embed-text

echo ""
echo "Setup complete."
echo "Wiki is running at http://localhost:3000"
echo "Pipeline is running at http://localhost:8000"
echo "Default admin: admin@company.com / Admin1234!"
echo "Change the admin password immediately after first login."
