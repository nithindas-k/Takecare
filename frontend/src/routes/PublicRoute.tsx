import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
    children: JSX.Element;
    role: "doctor" | "admin" | "patient";
}

const PublicRoute: React.FC<Props> = ({ children, role }) => {
    const token = localStorage.getItem(`authToken`);

    console.log("hellooooo");

    // If already logged in → redirect to home/dashboard
    if (token) {
        return <Navigate to={`/`} replace />;
    }

    return children;
};

export default PublicRoute;
