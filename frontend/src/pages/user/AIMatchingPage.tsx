import React from "react";
import AIMoctorMatcher from "../../components/Patient/ai/AIDoctorMatcher";
import PatientLayout from "../../components/Patient/PatientLayout";
import NavBar from "../../components/common/NavBar";
import Breadcrumbs from "../../components/common/Breadcrumbs";

const AIMatchingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            <NavBar />

            <Breadcrumbs
                items={[{ label: 'Home', path: '/' }, { label: 'AI Matcher' }]}
                title="AI Doctor Matching"
                subtitle="Let our intelligent assistant help you find the perfect physician."
            />

            <PatientLayout>
                <div className="w-full px-2 sm:px-4 lg:px-6 pb-6 sm:pb-10">
                    <AIMoctorMatcher />
                </div>
            </PatientLayout>
        </div>
    );
};

export default AIMatchingPage;
