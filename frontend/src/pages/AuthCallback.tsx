import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "../services/authService";
import { useDispatch } from "react-redux";
import { setUser } from "../redux/user/userSlice";

const AuthCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const token = searchParams.get("token");
        const userStr = searchParams.get("user");

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));

                authService.saveToken(token);
                authService.saveUser(user);
                dispatch(setUser(user));

                if (user.role === "doctor") {
                    if (user.verificationStatus === "approved") {
                        navigate("/doctor/dashboard");
                    } else {
                        navigate("/doctor/verification");
                    }
                } else if (user.role === "admin") {
                    navigate("/admin/dashboard");
                } else {
                    navigate("/");
                }
            } catch (error) {
                console.error("Failed to parse user data", error);
                navigate("/patient/login?error=auth_failed");
            }
        } else {
            navigate("/patient/login?error=no_token");
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl font-semibold">Authenticating...</div>
        </div>
    );
};

export default AuthCallback;
