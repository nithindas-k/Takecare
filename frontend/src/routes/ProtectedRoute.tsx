import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import authService from "../services/authService";

interface Props {
    children: React.ReactElement;
    role: "doctor" | "admin" | "patient";
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = () => {
            if (!authService.isAuthenticated()) {
                setIsAuthorized(false);
                return;
            }

            const userInfo = authService.getCurrentUserInfo();
            if (userInfo?.role === role) {
                setIsAuthorized(true);
            } else {
                setIsAuthorized(false);
            }
        };

        checkAuth();
    }, [role]);

    if (isAuthorized === null) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthorized) {
        return <Navigate to={`/${role}/login`} replace />;
    }

    return children;
};

export default ProtectedRoute;
