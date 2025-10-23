@echo off
REM Red Chief Shoes - Environment Setup Script for Windows
echo 🚀 Setting up Red Chief Shoes MERN Stack Environment...

REM Create server .env file
echo 📁 Creating server\.env file...
if not exist "server\.env" (
    copy "server\env.example" "server\.env" >nul
    echo ✅ server\.env created successfully!
) else (
    echo ⚠️  server\.env already exists, skipping...
)

REM Create frontend .env file
echo 📁 Creating .env file for frontend...
if not exist ".env" (
    copy "env.example" ".env" >nul
    echo ✅ .env created successfully!
) else (
    echo ⚠️  .env already exists, skipping...
)

REM Create uploads directory
echo 📁 Creating uploads directory...
if not exist "server\uploads\avatars" mkdir "server\uploads\avatars"
if not exist "server\uploads\products" mkdir "server\uploads\products"
if not exist "server\uploads\reviews" mkdir "server\uploads\reviews"
echo ✅ Upload directories created!

echo.
echo 🎉 Environment setup complete!
echo.
echo 📋 Next steps:
echo 1. Make sure MongoDB is running on your system
echo 2. Install dependencies:
echo    - Backend: cd server ^&^& npm install
echo    - Frontend: npm install
echo 3. Start the servers:
echo    - Backend: cd server ^&^& npm run dev
echo    - Frontend: npm run dev
echo.
echo 🌐 Your app will be available at:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:5000/api
echo.
echo 📝 Don't forget to update the .env files with your actual values!
pause
