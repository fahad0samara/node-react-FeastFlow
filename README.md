# FeastFlow

FeastFlow is a modern, full-stack food delivery platform that transforms the way people order and enjoy food. Built with TypeScript, React, Node.js, and Express, it offers a seamless experience for customers, restaurants, and delivery partners.

## Features

### For Customers
- **Smart Authentication**
  - Email/Password login with secure validation
  - Google OAuth integration
  - JWT-based session management
- **Intuitive Food Discovery**
  - Browse restaurant menus with rich visuals
  - Smart filters for dietary preferences
  - Real-time search with instant results
- **Seamless Ordering**
  - Interactive cart management
  - Multiple payment options
  - Order tracking in real-time
- **Personalization**
  - Save favorite restaurants and dishes
  - Customizable meal preferences
  - Order history and reordering

### For Restaurants
- **Menu Management**
  - Easy menu item creation and updates
  - Image upload and management
  - Category organization
- **Order Processing**
  - Real-time order notifications
  - Order status management
  - Kitchen display system
- **Analytics Dashboard**
  - Sales and performance metrics
  - Customer insights
  - Inventory tracking

## Tech Stack

### Frontend (React Application)
- **Core**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **HTTP Client**: Axios
- **Authentication**: JWT, Google OAuth

### Backend (Node.js Server)
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcrypt
- **Validation**: Joi
- **File Upload**: Multer
- **API Security**: Helmet, CORS

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Google OAuth credentials (for social login)

### Installation

1. Clone both repositories:
   ```bash
   git clone https://github.com/yourusername/feastflow-frontend.git
   git clone https://github.com/yourusername/feastflow-backend.git
   ```

2. Install frontend dependencies:
   ```bash
   cd feastflow-frontend
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd feastflow-backend
   npm install
   ```

4. Set up environment variables:

   Frontend (.env):
   ```env
   VITE_APP_API_URL=http://localhost:5000
   VITE_APP_GOOGLE_CLIENT_ID=your_google_client_id
   ```

   Backend (.env):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

5. Start the development servers:

   Frontend:
   ```bash
   cd feastflow-frontend
   npm run dev
   ```

   Backend:
   ```bash
   cd feastflow-backend
   npm run dev
   ```

## Application Structure

### Frontend Structure
```
src/
├── Auth/           # Authentication components
├── components/     # Reusable UI components
├── Redux/          # Redux store and slices
├── types/          # TypeScript interfaces
├── utils/          # Utility functions
└── App.tsx         # Main application
```

### Backend Structure
```
src/
├── Model/          # Mongoose models
├── controllers/    # Route controllers
├── router/         # Express routes
├── services/       # Business logic
├── validate/       # Validation schemas
└── app.ts          # Express setup
```

## Security Features
- Password hashing with bcrypt
- JWT-based authentication
- Google OAuth integration
- Input validation and sanitization
- Rate limiting
- CORS protection
- XSS prevention
- Secure HTTP headers

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments
- React Team for the amazing frontend library
- Node.js community for the robust backend runtime
- MongoDB team for the flexible database
- All contributors who help make FeastFlow better

## Support
For support, email support@feastflow.com or join our Slack channel.
