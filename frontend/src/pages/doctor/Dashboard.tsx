import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DoctorNavbar from "../../components/Doctor/DoctorNavbar";
import DoctorSidebar from "../../components/Doctor/DoctorSidebar";
import doctorService from "../../services/doctorService";
import Button from "../../components/Button";

const DoctorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true);
      try {
        const response = await doctorService.getDoctorProfile();
        if (response.success && response.data) {
          setVerificationStatus(response.data.verificationStatus);
          setRejectionReason(response.data.rejectionReason || null);
        }
      } catch (error) {
        console.error("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleReVerify = () => {
    navigate("/doctor/verification");
  };

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
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Verification Pending</h2>
              <p className="text-lg text-gray-700">
                Your account verification is in process. Please wait for admin approval.
              </p>
            </div>
          ) : verificationStatus === "rejected" ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-auto">
              <div className="mb-4">
                <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4 text-red-600">Verification Rejected</h2>
              <p className="text-lg text-gray-700 mb-4">
                Your verification request has been rejected by the admin.
              </p>
              {rejectionReason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-semibold text-red-800 mb-1">Reason:</p>
                  <p className="text-sm text-red-700">{rejectionReason}</p>
                </div>
              )}
              <Button
                onClick={handleReVerify}
                className="w-full py-3"
              >
                Re-Submit Verification
              </Button>
            </div>
          ) : (
            // Your regular dashboard content goes here for approved
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