#!/bin/bash

# Clear Data Script for Rezolve Agentic Studio
# This script stops containers, removes database volumes, and restarts fresh
# WARNING: This will delete ALL data including agents, workflows, and executions

echo "====================================="
echo "Rezolve Agentic Studio - Clear Data"
echo "====================================="
echo ""
echo "WARNING: This will permanently delete:"
echo "  - All agents"
echo "  - All workflows"
echo "  - All workflow executions"
echo "  - All execution history"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Operation canceled."
    exit 0
fi

echo ""
echo "Stopping containers..."
docker-compose down

echo ""
echo "Removing database volume..."
docker volume rm agentic-studio_postgres_data 2>/dev/null || echo "Volume not found or already removed"

echo ""
echo "Restarting containers with fresh database..."
docker-compose up -d

echo ""
echo "Waiting for database to initialize..."
sleep 5

echo ""
echo "====================================="
echo "Data cleared successfully!"
echo "====================================="
echo ""
echo "The application is now running with a fresh database."
echo "Access it at: http://localhost:5173"
echo ""
