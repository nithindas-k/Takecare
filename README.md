<div align="center">
  <a href="https://takecare.nithin.site">
    <img src="./frontend/public/doctor.png" alt="TakeCare Logo" height="200" />
  </a>
  <h1>TakeCare - Healthcare Management Platform</h1>
  <p>
    <strong>Live Demo:</strong> 
    <a href="https://takecare.nithin.site">takecare.nithin.site</a>
  </p>
</div>

---

## Project Overview

TakeCare is a comprehensive healthcare platform designed to bridge the gap between patients and doctors. It provides a seamless interface for managing medical appointments, patient records, and doctor schedules, ensuring an efficient healthcare experience for all stakeholders.

This repository contains both the frontend and backend of the TakeCare application. The platform is built using the MERN stack (MongoDB, Express, React, Node.js) with TypeScript for enhanced type safety and maintainability.

---

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

---

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

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- Cloudinary account for file storage
- Razorpay account for payment processing

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Takecare
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## Configuration

### Backend Environment Variables

Create a `.env` file in the backend directory and add the following:

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

### Frontend Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

### Start Frontend Development Server

```bash
cd frontend
npm run dev
```

---

## Development Scripts

### Backend

- npm run dev: Starts the development server with hot-reload.
- npm run build: Compiles TypeScript to JavaScript.
- npm start: Runs the compiled production build.

### Frontend

- npm run dev: Starts the Vite development server.
- npm run build: Builds the application for production.
- npm run preview: Previews the production build locally.

---

## Project Structure

```text
Takecare/
├── backend/            # Express server with TypeScript
│   ├── src/
│   │   ├── controllers/ # Route handlers
│   │   ├── models/      # Mongoose schemas
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── app.ts       # Entry point
├── frontend/           # React application with Vite
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page-level components
│   │   ├── services/    # API service calls
│   │   └── store/       # Redux state management
└── README.md           # Project documentation
```

---

## License

This project is licensed under the ISC License.
