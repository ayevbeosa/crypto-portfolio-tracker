#!/bin/bash

set -e

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  🚀 Crypto Portfolio Tracker - Quick Start Script       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your settings."
else
    echo "✅ .env file already exists"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo ""
echo "🐳 Starting Docker containers..."
docker-compose up -d postgres redis

echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Running database migrations..."
npm run migration:run

echo ""
echo "🌱 Seeding initial data..."
npm run seed

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║  ✅ Setup Complete!                                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "🎯 Next steps:"
echo "   1. Review and update .env file if needed"
echo "   2. Start the development server:"
echo "      npm run start:dev"
echo ""
echo "   3. Access the application:"
echo "      API: http://localhost:3000/api/v1"
echo "      Swagger: http://localhost:3000/api/docs"
echo "      Health: http://localhost:3000/api/v1/health"
echo ""
echo "📚 For more information, see SETUP_GUIDE.md"
echo ""