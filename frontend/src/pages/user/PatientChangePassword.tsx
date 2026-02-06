import React from "react";
import PatientLayout from "../../components/Patient/PatientLayout";
import ChangePassword from "../../components/common/ChangePassword";
import NavBar from "../../components/common/NavBar";

const PatientChangePassword: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <NavBar />
            <PatientLayout>
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-800">Security Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your password and account security</p>
                </div>

                <ChangePassword role="user" />
            </PatientLayout>
        </div>
    );
};

export default PatientChangePassword;
