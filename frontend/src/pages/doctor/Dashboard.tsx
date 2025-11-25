import React, { useEffect, useState } from "react";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorSidebar from "../../components/Doctor/DoctorSidebar";
import doctorService from "../../services/doctorService";

const DoctorDashboard: React.FC = () => {
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const response = await doctorService.getDoctorProfile();
        if (response.success && response.data) {
          setVerificationStatus(response.data.verificationStatus);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorNavbar />
      <main className="max-w-7xl mx-auto pt-8 pb-14 px-2 grid grid-cols-12 gap-8">
        <DoctorSidebar />
        <section className="col-span-8 xl:col-span-9 flex items-center justify-center">
          {verificationStatus === "pending" ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">Verification Pending</h2>
              <p className="text-lg text-gray-700">
                Your account verification is in process. Please wait for admin approval.
              </p>
            </div>
          ) : (
            // Your regular dashboard content goes here for approved/rejected
            <div>
              {/* ...dashboard stats and main content... */}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default DoctorDashboard;
  