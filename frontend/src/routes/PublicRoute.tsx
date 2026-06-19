import React from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

interface Props {
    children: React.ReactNode;
}

const PublicRoute: React.FC<Props> = ({ children }) => {
    const isAuth = authService.isAuthenticated();
    const userInfo = authService.getCurrentUserInfo();

    if (isAuth && userInfo) {
        if (userInfo.role === 'doctor') {
            return <Navigate to="/doctor/dashboard" replace />;
        }
        if (userInfo.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        }
        if (userInfo.role === 'patient') {
            return <Navigate to="/patient/home" replace />;
        }
        return <Navigate to="/patient/home" replace />;
    }

    return children;
};

export default PublicRoute;
