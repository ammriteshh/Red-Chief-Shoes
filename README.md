# Red Chief Shoes - Full Stack MERN E-commerce Platform

A complete e-commerce platform for Red Chief shoes built with the MERN stack (MongoDB, Express.js, React, Node.js).

## 🚀 Features

### Frontend Features
- **Modern UI/UX**: Built with React and Tailwind CSS
- **Responsive Design**: Mobile-first approach
- **User Authentication**: Login, Register, Password Reset
- **Product Catalog**: Browse, search, and filter products
- **Shopping Cart**: Add to cart, update quantities, remove items
- **Order Management**: Place orders, track status
- **User Profile**: Manage personal information and addresses
- **Product Reviews**: Rate and review products
- **Admin Dashboard**: Manage products, orders, and users

### Backend Features
- **RESTful API**: Well-structured API endpoints
- **Authentication**: JWT-based authentication with refresh tokens
- **Database**: MongoDB with Mongoose ODM
- **File Upload**: Image upload for products and avatars
- **Validation**: Input validation and sanitization
- **Security**: Helmet, CORS, rate limiting
- **Error Handling**: Comprehensive error handling middleware

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling framework
- **React Router** - Client-side routing
- **Zustand** - State management
- **React Hook Form** - Form handling
- **Axios** - HTTP client
- **React Hot Toast** - Notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Multer** - File upload
- **Bcrypt** - Password hashing
- **Express Validator** - Input validation

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Backend Setup

1. **Navigate to server directory**
   ```bash
   cd server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the server directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/red-chief-shoes
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRE=7d
   MAX_FILE_SIZE=1000000
   UPLOAD_PATH=uploads/
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to root directory**
   ```bash
   cd ..
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

## 🗂️ Project Structure

```
Red-Chief-Shoes/
├── client/                 # Frontend React app
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── sections/      # Section components
│   │   ├── store/         # State management
│   │   ├── services/      # API services
│   │   └── assets/        # Static assets
│   └── package.json
├── server/                 # Backend Express app
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── uploads/          # File uploads
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured` - Get featured products
- `GET /api/products/new-arrivals` - Get new arrivals
- `GET /api/products/search` - Search products

### Orders
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get single order
- `PUT /api/orders/:id/cancel` - Cancel order

### Reviews
- `GET /api/reviews` - Get all reviews
- `POST /api/reviews` - Create review
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review

## 🚀 Deployment

### Backend Deployment (Heroku)

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your-mongodb-atlas-uri
   heroku config:set JWT_SECRET=your-production-jwt-secret
   ```

3. **Deploy**
   ```bash
   git subtree push --prefix server heroku main
   ```

### Frontend Deployment (Vercel/Netlify)

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

## 🔐 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/red-chief-shoes
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
MAX_FILE_SIZE=1000000
UPLOAD_PATH=uploads/
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📱 Usage

1. **Start both servers** (backend on port 5000, frontend on port 5173)
2. **Open your browser** and navigate to `http://localhost:5173`
3. **Register a new account** or use existing credentials
4. **Browse products** and add items to cart
5. **Place orders** and track their status
6. **Leave reviews** for purchased products

## 👨‍💼 Admin Features

Admin users can:
- Manage products (CRUD operations)
- View and update orders
- Manage user accounts
- View analytics and statistics
- Respond to customer reviews

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Red Chief Shoes for inspiration
- React and Node.js communities
- Tailwind CSS for the amazing styling framework
- All contributors and supporters

## 📞 Support

For support, email support@redchiefs.com or create an issue in the repository.

---

**Happy Coding! 👨‍💻**