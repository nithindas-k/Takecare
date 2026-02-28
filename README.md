# TakeCare - Healthcare Management Platform

TakeCare is a comprehensive healthcare platform designed to bridge the gap between patients and doctors. It provides a seamless interface for managing medical appointments, patient records, and doctor schedules, ensuring an efficient healthcare experience for all stakeholders.

## Project Overview

This repository contains both the frontend and backend of the TakeCare application. The platform is built using the MERN stack (MongoDB, Express, React, Node.js) with TypeScript for enhanced type safety and maintainability.

## Key Features

### For Patients
- Secure account registration and authentication.
- Search and filter options for healthcare professionals.
- Real-time appointment booking and management.
- Secure payment integration for consultations.
- Notification system for appointment updates.

### For Doctors
- Professional profile management.
- Practitioner dashboard for managing patient appointments.
- Real-time schedule updates.
- Automated prescription and medical note generation.
- Analytics for patient visits and consultations.

### Core Functionalities
- Real-time communication via Socket.io.
- Google OAuth integration for quick access.
- Secure image and document handling using Cloudinary.
- Automated scheduling and background tasks with Node-cron.
- Payment processing via Razorpay.

## Technology Stack

### Frontend
- Core: React 19, TypeScript
- State Management: Redux Toolkit
- Styling: Tailwind CSS, Radix UI (shadcn/ui)
- Animations: Framer Motion, GSAP
- Communication: Axios, Socket.io-client
- Charts: Recharts
- Form Management: React Hook Form

### Backend
- Runtime: Node.js, TypeScript
- Framework: Express.js
- Database: MongoDB with Mongoose
- Authentication: JWT, Passport.js (Google OAuth)
- Communication: Socket.io
- Storage: Cloudinary, Multer
- Tasks: Node-cron
- Payments: Razorpay
- Testing: Jest, Supertest

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account for file storage
- Razorpay account for payment processing

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Takecare
   ```

2. Install Backend Dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install Frontend Dependencies:
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

Create a `.env` file in the `backend` directory and add the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:5000
```

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Development Scripts

### Backend
- `npm run dev`: Starts the development server with hot-reload.
- `npm run build`: Compiles TypeScript to JavaScript.
- `npm start`: Runs the compiled production build.

### Frontend
- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the application for production.
- `npm run preview`: Previews the production build locally.

## Project Structure

```text
Takecare/
├── backend/            # Express server with TypeScript
│   ├── src/
│   │   ├── controllers/# Route handlers
│   │   ├── models/     # Mongoose schemas
│   │   ├── routes/     # API routes
│   │   ├── services/   # Business logic
│   │   └── app.ts      # Entry point
├── frontend/           # React application with Vite
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Page-level components
│   │   ├── services/   # API service calls
│   │   └── store/      # Redux state management
└── README.md           # Project documentation
```

## License

This project is licensed under the ISC License.
