import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
    children: JSX.Element;
    role: "doctor" | "admin" | "patient";
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
    const token = localStorage.getItem(`authToken`);

    if (!token) {
        return <Navigate to={`/${role}/login`} replace />;
    }

    return children;
};

export default ProtectedRoute;
