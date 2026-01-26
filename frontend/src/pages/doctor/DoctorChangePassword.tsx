import React from "react";
import DoctorSidebar from "../../components/Doctor/DoctorSidebar";
import ChangePassword from "../../components/common/ChangePassword";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";

const DoctorChangePassword: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50">
            <DoctorNavbar />
            <div className="container mx-auto px-4 pt-24 pb-12">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0">
                        <DoctorSidebar />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-gray-800">Security Settings</h1>
                            <p className="text-gray-500 mt-1">Manage your password and account security</p>
                        </div>

                        <ChangePassword role="doctor" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorChangePassword;
