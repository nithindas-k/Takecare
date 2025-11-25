import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Sidebar from "../../components/admin/Sidebar";
import TopNav from "../../components/admin/TopNav";
import adminService from "../../services/adminService";

interface Patient {
    id: string;
    name: string;
    email: string;
    phone: string;
    profileImage: string | null;
    gender: string;
    dob: string | null;
    createdAt: string;
    isActive: boolean;
}

const PatientsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);
    const limit = 10;

    const fetchPatients = async (currentPage: number) => {
        setLoading(true);
        try {
            const res = await adminService.getAllPatients(currentPage, limit);
            if (res.success && res.data) {
                setPatients(res.data.patients);
                setTotalPages(res.data.totalPages);
                setTotalPatients(res.data.total);
            } else {
                toast.error(res.message || "Failed to fetch patients");
            }
        } catch (e: any) {
            toast.error(e.message || "Error fetching patients");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchPatients(page);
    }, [page]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    };

    const dummyAvatar = (name: string) => (
        <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-white font-bold uppercase text-sm">
            {name ? name.split(" ").map((s) => s[0]).join("").slice(0, 2) : "??"}
        </div>
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Toaster position="top-center" />
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopNav />
                <div className="flex-1 overflow-y-auto p-8">
                    {/* Header */}
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-8 flex justify-between items-center border border-gray-100">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">All Patients</h1>
                            <p className="text-gray-500 text-sm mt-1">Manage all registered patients</p>
                        </div>
                        <div className="bg-cyan-50 text-cyan-700 px-4 py-2 rounded-lg font-medium text-sm">
                            Total: {totalPatients}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-gray-500">Loading patients...</div>
                        ) : patients.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">No patients found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold">
                                            <th className="px-6 py-4">Patient</th>
                                            <th className="px-6 py-4">Phone</th>
                                            <th className="px-6 py-4">Gender</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Joined</th>
                                            <th className="px-6 py-4 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {patients.map((patient) => (
                                            <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {patient.profileImage ? (
                                                            <img
                                                                src={patient.profileImage}
                                                                alt={patient.name}
                                                                className="w-10 h-10 rounded-full object-cover border border-gray-200"
                                                            />
                                                        ) : (
                                                            dummyAvatar(patient.name)
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-800">{patient.name}</div>
                                                            <div className="text-xs text-gray-500">{patient.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{patient.phone}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 capitalize">{patient.gender}</td>
                                                <td className="px-6 py-4">
                                                    {patient.isActive ? (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                            Active
                                                        </span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                            Blocked
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {new Date(patient.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => navigate(`/admin/patients/${patient.id}`)}
                                                        className="text-cyan-600 hover:text-cyan-800 text-sm font-medium hover:underline"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {!loading && patients.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <div className="text-sm text-gray-500">
                                    Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(page - 1)}
                                        disabled={page === 1}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"}`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => handlePageChange(page + 1)}
                                        disabled={page === totalPages}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm"}`}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientsListPage;
