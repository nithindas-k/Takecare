import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
    children: React.ReactNode;
    role: "doctor" | "admin" | "patient";
}

const PublicRoute: React.FC<Props> = ({ children, role: _role }) => {
    const token = localStorage.getItem(`authToken`);




    if (token) {
        return <Navigate to={`/`} replace />;
    }

    return children;
};

export default PublicRoute;
