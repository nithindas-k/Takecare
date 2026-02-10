import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, Phone, MapPin, FileText, CheckCircle, XCircle } from "lucide-react";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";
import type { DoctorRequestDetails } from "../../types/admin.types";
import ImageModal from "../../components/common/ImageModal";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";

const DoctorRequestDetailPage: React.FC = () => {
  const { doctorId } = useParams<{ doctorId: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<DoctorRequestDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImgSrc, setModalImgSrc] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      try {
        const res = await adminService.fetchDoctorRequestDetails(doctorId!);
        if (res.success && res.data) {
          setDoctor(res.data);
        } else {
          toast.error(res.message || "Doctor not found");
        }
      } catch (e: unknown) {
        const error = e as { message?: string };
        toast.error(error.message || "Error fetching doctor details");
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [doctorId]);

  const handleAccept = async () => {
    if (!doctor || isApproving) return;

    toast.custom((id) => (
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl shadow-lg border border-gray-100 w-full max-w-sm">
        <p className="font-semibold text-gray-800">Approve Dr. {doctor.name}?</p>
        <p className="text-sm text-gray-600">This will grant the doctor access to the system.</p>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              toast.dismiss(id);
              proceedWithApproval();
            }}
            className="bg-cyan-600 hover:bg-cyan-700"
            size="sm"
          >
            Yes, Approve
          </Button>
          <Button
            onClick={() => toast.dismiss(id)}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
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
        success: 'Doctor approved successfully!',
        error: (err: { message?: string }) => err.message || 'Failed to approve doctor',
      }
    );

    const res = await approvalPromise;
    setIsApproving(false);

    if (res.success) {
      setDoctor({
        ...doctor,
        status: 'approved',
      });
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
        success: 'Doctor rejected successfully!',
        error: (err: { message?: string }) => err.message || 'Failed to reject doctor',
      }
    );

    const res = await rejectionPromise;
    setIsRejecting(false);
    setIsRejectionModalOpen(false);

    if (res.success) {
      setDoctor({
        ...doctor,
        status: 'rejected',
        rejectionReason: rejectionReason,
      });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const getStatusBadgeClasses = (status: string) => {
    const s = status.toLowerCase();
    if (s === "approved") return "bg-green-100 text-green-700 border-green-200";
    if (s === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-yellow-100 text-yellow-700 border-yellow-200";
  };

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      {/* Sidebar - Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ type: "spring", damping: 30, stiffness: 450 }}
              className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl"
            >
              <Sidebar onMobileClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 -ml-2 mb-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Requests
              </Button>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-bold text-gray-800">Doctor Request Details</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Review and manage doctor registration request
                </p>
              </div>
            </div>

            {loading ? (
              <div className="space-y-6">
                {/* Doctor Profile Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Profile Info Skeleton */}
                    <div className="flex items-start gap-4 flex-1">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-6 w-48" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-56" />
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions Skeleton */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                      <div className="space-y-2 text-left lg:text-right">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-6 w-32" />
                      </div>
                      <Skeleton className="h-8 w-32 rounded-full" />
                      <Skeleton className="h-10 w-40 rounded-lg" />
                    </div>
                  </div>
                </div>

                {/* Information Card Skeleton */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <Skeleton className="h-6 w-48 mb-6" />

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full rounded-md" />
                      </div>
                    ))}
                  </div>

                  {/* Certificates Section Skeleton */}
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-40" />
                    <div className="flex gap-4">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="w-40 h-28 rounded-lg flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : !doctor ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <p className="text-gray-500">Doctor request not found</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Doctor Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    {/* Left: Profile Info */}
                    <div className="flex items-start gap-4">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={doctor.profileImage || undefined} alt={doctor.name} />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-teal-500 text-white text-xl font-bold">
                          {getInitials(doctor.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <p className="text-xs text-gray-500 mb-1">Request ID: {doctor.id}</p>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                          Dr. {doctor.name}
                        </h2>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{doctor.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{doctor.phone || "Not provided"}</span>
                          </div>
                          {doctor.address && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <span>{doctor.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Status & Actions */}
                    <div className="flex flex-col items-start lg:items-end gap-4">
                      <div className="space-y-2 text-left lg:text-right">
                        <p className="text-xs text-gray-500">Department</p>
                        <p className="text-lg font-semibold text-cyan-600">
                          {doctor.department}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {doctor.experienceYears || 3} Year{doctor.experienceYears !== 1 ? "s" : ""} Experience
                        </span>
                      </div>

                      <div
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${getStatusBadgeClasses(
                          doctor.status
                        )}`}
                      >
                        {doctor.status === "approved" && <CheckCircle className="inline h-4 w-4 mr-1" />}
                        {doctor.status === "rejected" && <XCircle className="inline h-4 w-4 mr-1" />}
                        {doctor.status.charAt(0).toUpperCase() + doctor.status.slice(1)}
                      </div>

                      {doctor.status === "pending" && (
                        <div className="flex gap-3">
                          <Button
                            onClick={handleAccept}
                            disabled={isApproving || isRejecting}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isApproving ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Approving...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleReject}
                            disabled={isApproving || isRejecting}
                            variant="destructive"
                          >
                            {isRejecting ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Rejecting...
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {doctor.status === "rejected" && doctor.rejectionReason && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-800 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-sm text-red-700">{doctor.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Information Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Professional Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div>
                      <Label className="text-gray-600 mb-2">Full Name</Label>
                      <Input value={doctor.name} readOnly className="bg-gray-50" />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2">Email Address</Label>
                      <Input value={doctor.email} readOnly className="bg-gray-50" />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2">Experience</Label>
                      <Input
                        value={`${doctor.experienceYears || 3} Years`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2">Speciality</Label>
                      <Input value={doctor.department || ""} readOnly className="bg-gray-50" />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2">Consultation Fees</Label>
                      <Input
                        value={`Chat: ₹${doctor.ChatFees} / Video: ₹${doctor.VideoFees}`}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>

                    <div>
                      <Label className="text-gray-600 mb-2">Address</Label>
                      <Input
                        value={doctor.address || "Not provided"}
                        readOnly
                        className="bg-gray-50"
                      />
                    </div>
                  </div>

                  {/* Certificates Section */}
                  <div>
                    <Label className="text-gray-600 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Certificates & Documents
                    </Label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                      {doctor.documents && doctor.documents.length > 0 ? (
                        doctor.documents.map((url, idx) => {
                          const isPdf = url.toLowerCase().endsWith(".pdf");
                          return (
                            <div
                              key={idx}
                              className="relative group cursor-pointer flex-shrink-0"
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
                                <div className="w-40 h-28 bg-red-50 border-2 border-red-200 rounded-lg flex flex-col items-center justify-center text-red-600 hover:border-red-400 transition-colors">
                                  <FileText className="h-8 w-8 mb-2" />
                                  <span className="text-xs font-medium">PDF Document</span>
                                </div>
                              ) : (
                                <img
                                  src={url}
                                  alt={`Certificate ${idx + 1}`}
                                  className="w-40 h-28 object-cover border-2 border-gray-200 rounded-lg hover:border-cyan-400 transition-colors"
                                />
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                <span className="text-white opacity-0 group-hover:opacity-100 font-medium text-sm bg-black/50 px-3 py-1 rounded">
                                  {isPdf ? "Open PDF" : "View"}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="w-40 h-28 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 text-xs gap-2">
                          <FileText className="h-8 w-8" />
                          <span>No documents</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Modal */}
      <ImageModal isOpen={isModalOpen} src={modalImgSrc} onClose={() => setIsModalOpen(false)} />

      {/* Rejection Dialog */}
      <Dialog open={isRejectionModalOpen} onOpenChange={setIsRejectionModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Doctor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting Dr. {doctor?.name}'s application. This will be
              visible to the doctor.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter rejection reason..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectionModalOpen(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={proceedWithRejection}
              disabled={!rejectionReason.trim() || isRejecting}
            >
              {isRejecting ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorRequestDetailPage;
