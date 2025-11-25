// src/components/GoogleLoginButton.tsx
import React from "react";

const GOOGLE_LOGIN_URL = "http://localhost:5000/auth/google";

const GoogleLoginButton: React.FC = () => {
  const handleGoogleLogin = () => {
    window.location.href = GOOGLE_LOGIN_URL; // Redirect to backend for Google OAuth
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="btn-google-login"
    >
      Login with Google
    </button>
  );
};

export default GoogleLoginButton;
