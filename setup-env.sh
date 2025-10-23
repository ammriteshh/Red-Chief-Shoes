#!/bin/bash

# Red Chief Shoes - Environment Setup Script
echo "🚀 Setting up Red Chief Shoes MERN Stack Environment..."

# Create server .env file
echo "📁 Creating server/.env file..."
if [ ! -f "server/.env" ]; then
    cp server/env.example server/.env
    echo "✅ server/.env created successfully!"
else
    echo "⚠️  server/.env already exists, skipping..."
fi

# Create frontend .env file
echo "📁 Creating .env file for frontend..."
if [ ! -f ".env" ]; then
    cp env.example .env
    echo "✅ .env created successfully!"
else
    echo "⚠️  .env already exists, skipping..."
fi

# Create uploads directory
echo "📁 Creating uploads directory..."
mkdir -p server/uploads/avatars
mkdir -p server/uploads/products
mkdir -p server/uploads/reviews
echo "✅ Upload directories created!"

# Generate a random JWT secret
echo "🔐 Generating JWT secret..."
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "red-chief-shoes-super-secret-jwt-key-$(date +%s)")

# Update JWT secret in server .env
if [ -f "server/.env" ]; then
    sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" server/.env
    rm server/.env.bak 2>/dev/null || true
    echo "✅ JWT secret updated!"
fi

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Make sure MongoDB is running on your system"
echo "2. Install dependencies:"
echo "   - Backend: cd server && npm install"
echo "   - Frontend: npm install"
echo "3. Start the servers:"
echo "   - Backend: cd server && npm run dev"
echo "   - Frontend: npm run dev"
echo ""
echo "🌐 Your app will be available at:"
echo "   - Frontend: http://localhost:5173"
echo "   - Backend API: http://localhost:5000/api"
echo ""
echo "📝 Don't forget to update the .env files with your actual values!"
