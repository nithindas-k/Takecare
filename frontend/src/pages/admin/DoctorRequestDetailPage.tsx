import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import type { DoctorRequestDetails } from "../../types/admin.types";
import ImageModal from "../../components/common/ImageModal";

const DoctorRequestDetailPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImgSrc, setModalImgSrc] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isBanProcessing, setIsBanProcessing] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      const res = await adminService.fetchDoctorRequestDetails(doctorId!);
      if (res.success && res.data) {
        setDoctor(res.data);
      } else {
        setError(res.message || "Doctor not found");
      }
      setLoading(false);
    };
    fetchDoctor();
  }, [doctorId]);

  const handleAccept = async () => {
    if (!doctor || isApproving) return;

   
    toast((t) => (
      <div className="flex flex-col gap-3">
        <p className="font-semibold">Approve Dr. {doctor.name}?</p>
        <p className="text-sm text-gray-600">This will grant the doctor access to the system.</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id);
              proceedWithApproval();
            }}
            className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-600"
          >
            Yes, Approve
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 10000,
      position: 'top-center',
    });
  };

  const proceedWithApproval = async () => {
    if (!doctor) return;

    setIsApproving(true);

    const approvalPromise = adminService.approveDoctor(doctor.id);

    toast.promise(
      approvalPromise,
      {
        loading: 'Approving doctor...',
        success: '✅ Doctor approved successfully!',
        error: (err) => `❌ ${err.message || 'Failed to approve doctor'}`,
      }
    );

    const res = await approvalPromise;
    setIsApproving(false);

    if (res.success) {

      setDoctor({
        ...doctor,
        status: 'approved',
      });
      toast.success("Doctor has been approved!", { duration: 2000 });
    }
  };

  const handleReject = () => {
    if (!doctor || isRejecting) return;
    setRejectionReason("");
    setIsRejectionModalOpen(true);
  };

  const proceedWithRejection = async () => {
    if (!doctor) return;

    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setIsRejecting(true);

    const rejectionPromise = adminService.rejectDoctor(doctor.id, rejectionReason);

    toast.promise(
      rejectionPromise,
      {
        loading: 'Rejecting doctor...',
        success: '✅ Doctor rejected successfully!',
        error: (err) => `❌ ${err.message || 'Failed to reject doctor'}`,
      }
    );

    const res = await rejectionPromise;
    setIsRejecting(false);
    setIsRejectionModalOpen(false);

    if (res.success) {
      // Update local state to reflect rejection
      setDoctor({
        ...doctor,
        status: 'rejected',
        rejectionReason: rejectionReason,
      });

      // Show success message and stay on the page
      toast.success("Rejection reason has been recorded", { duration: 2000 });
    }
  };



  if (loading) return <div className="text-center py-10">Loading...</div>;
  if (error || !doctor)
    return (
      <div className="text-center py-10 text-red-500">
        {error || "Doctor not found"}
      </div>
    );

  const dummyAvatar = (name: string) => (
    <div className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-2xl text-white font-bold uppercase shadow-lg">
      {name
        .split(" ")
        .map((s) => s[0])
        .join("")
        .slice(0, 2)}
    </div>
  );

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Toaster position="top-center" />
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopNav />
        <div className="flex-1 overflow-y-auto">
          <div className="px-10 py-6">
            {/* Header with decorative background */}
            <div className="relative bg-gradient-to-r from-cyan-50 via-teal-50 to-cyan-50 rounded-2xl py-8 text-center mb-8 overflow-hidden border border-cyan-100">
              {/* Decorative wave patterns */}
              <div className="absolute left-0 top-0 w-40 h-40 opacity-10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#14B8A6" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.4C26.4,83.8,10,86,-5.7,85.1C-21.4,84.2,-36.1,80.2,-48.9,72.4C-61.7,64.6,-72.6,53,-79.8,39.4C-87,25.8,-90.5,10.1,-89.3,-5.2C-88.1,-20.5,-82.2,-35.4,-73.1,-48.4C-64,-61.4,-51.7,-72.5,-37.8,-79.8C-23.9,-87.1,-8.4,-90.6,5.4,-89.3C19.2,-88,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>
              <div className="absolute right-0 bottom-0 w-40 h-40 opacity-10">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#14B8A6" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.6,90,-16.3,88.5,-0.9C87,14.6,81.4,29.2,73.1,42.8C64.8,56.4,53.8,69,40.1,76.4C26.4,83.8,10,86,-5.7,85.1C-21.4,84.2,-36.1,80.2,-48.9,72.4C-61.7,64.6,-72.6,53,-79.8,39.4C-87,25.8,-90.5,10.1,-89.3,-5.2C-88.1,-20.5,-82.2,-35.4,-73.1,-48.4C-64,-61.4,-51.7,-72.5,-37.8,-79.8C-23.9,-87.1,-8.4,-90.6,5.4,-89.3C19.2,-88,30.6,-83.6,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-gray-800 relative z-10">
                Requests Details
              </h1>
            </div>

            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="text-gray-700 hover:text-teal-600 mb-6 flex items-center gap-2 font-medium transition-colors"
            >
              <span className="text-xl">←</span> Doctor Details
            </button>

            {/* Doctor Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6 border border-gray-100">
              <div className="flex flex-col lg:flex-row items-start gap-8">
                {/* Left Section - Profile */}
                <div className="flex items-start gap-5">
                  {doctor.profileImage ? (
                    <img
                      src={doctor.profileImage}
                      alt={doctor.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-cyan-400 shadow-lg"
                    />
                  ) : (
                    dummyAvatar(doctor.name)
                  )}
                  <div className="flex-1">
                    <div className="text-xs text-cyan-500 font-semibold mb-1">
                      #{doctor.id}
                    </div>
                    <div className="text-xl font-bold text-gray-800 mb-2">
                      Dr {doctor.name}
                    </div>
                    <div className="space-y-1.5">
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-base">📧</span>
                        <span>{doctor.email}</span>
                      </div>
                      <div className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-base">📞</span>
                        <span>{doctor.phone || "Not provided"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Department & Actions */}
                <div className="flex flex-col items-start lg:items-end gap-3 lg:ml-auto">
                  <div className="text-left lg:text-right">
                    <div className="text-xs text-gray-500 mb-1">
                      Department
                    </div>
                    <div className="text-cyan-600 font-bold text-lg">
                      {doctor.department}
                    </div>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 px-5 py-1.5 rounded-full text-sm font-semibold shadow-sm">
                    {doctor.experienceYears || 3} Year{doctor.experienceYears !== 1 ? "s" : ""}
                  </div>
                  <div className="flex gap-3 mt-2">
                    {doctor.status === 'pending' ? (
                      <>
                        <button
                          onClick={handleAccept}
                          disabled={isApproving || isRejecting}
                          className={`bg-green-500 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${isApproving || isRejecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
                            }`}
                        >
                          {isApproving ? (
                            <>
                              <span className="animate-spin">⏳</span> Approving...
                            </>
                          ) : (
                            <>
                              <span>✓</span> Accept
                            </>
                          )}
                        </button>
                        <button
                          onClick={handleReject}
                          disabled={isApproving || isRejecting}
                          className={`bg-red-500 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 ${isApproving || isRejecting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'
                            }`}
                        >
                          {isRejecting ? (
                            <>
                              <span className="animate-spin">⏳</span> Rejecting...
                            </>
                          ) : (
                            <>
                              <span>✗</span> Reject
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <div className={`px-6 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2 ${doctor.status === 'approved' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                        <span className="text-xl">{doctor.status === 'approved' ? '✓' : '✗'}</span>
                        {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Reason Display */}
              {doctor.status === 'rejected' && doctor.rejectionReason && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">⚠️</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-700">{doctor.rejectionReason}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Information Section */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800 mb-6">
                Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={doctor.name}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={doctor.email}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Experience
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={`${doctor.experienceYears || 3} Year`}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Speciality
                  </label>
                   <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={doctor.department || ""}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Fees (₹)
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={`ChatFees : ₹ ${doctor.ChatFees} / VideoFees : ₹ ${doctor.VideoFees}`}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-gray-600 text-sm font-medium mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                    value={doctor.address || "Malappuram kodur 676504"}
                    readOnly
                  />
                </div>
              </div>

              {/* Certificate Section */}
              <div>
                <label className="block text-gray-600 text-sm font-medium mb-3">
                  Certificate
                </label>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {doctor.documents && doctor.documents.length > 0 ? (
                    doctor.documents.map((url, idx) => {
                      const isPdf = url.toLowerCase().endsWith(".pdf");
                      return (
                        <div
                          key={idx}
                          className="relative group cursor-pointer"
                          onClick={() => {
                            if (isPdf) {
                              window.open(url, "_blank");
                            } else {
                              setModalImgSrc(url);
                              setIsModalOpen(true);
                            }
                          }}
                        >
                          {isPdf ? (
                            <div className="w-40 h-28 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-red-500 shadow-sm hover:shadow-md transition-all hover:border-red-400">
                              <span className="text-3xl">📄</span>
                              <span className="text-xs font-medium mt-1">PDF Document</span>
                            </div>
                          ) : (
                            <img
                              src={url}
                              alt={`Certificate ${idx + 1}`}
                              className="w-40 h-28 object-cover border-2 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all hover:border-cyan-400"
                            />
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black/50 px-2 py-1 rounded">
                              {isPdf ? "Open PDF" : "View"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="w-40 h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                      <span className="text-2xl">📄</span>
                      <span>No certificate</span>
                    </div>
                  )}
                </div>

                {/* Modal */}
                <ImageModal
                  isOpen={isModalOpen}
                  src={modalImgSrc}
                  onClose={() => setIsModalOpen(false)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection Modal */}
      {isRejectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Doctor Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting Dr. {doctor?.name}'s application. This will be visible to the doctor.
            </p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 mb-4 focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[100px]"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsRejectionModalOpen(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={proceedWithRejection}
                disabled={!rejectionReason.trim() || isRejecting}
                className={`px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors ${!rejectionReason.trim() || isRejecting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              >
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorRequestDetailPage;
