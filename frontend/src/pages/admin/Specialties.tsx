import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "../../components/admin/TopNav";
import Sidebar from "../../components/admin/Sidebar";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaToggleOn, FaToggleOff, FaTimes } from 'react-icons/fa';
import { specialtyService } from '../../services/specialtyService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { toast } from 'sonner';
import AlertDialog from '../../components/common/AlertDialog';

interface Specialty {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const AdminSpecialties: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Alert State
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [specialtyToDelete, setSpecialtyToDelete] = useState<{ id: string; name: string } | null>(null);

  const fetchSpecialties = useCallback(async () => {
    setLoading(true);
    try {
      const response = await specialtyService.getAllSpecialties(currentPage, limit, search);
      if (response.success) {
        setSpecialties(response.data.specialties);
        setTotal(response.data.total);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error("Error fetching specialties:", error);
      toast.error("Failed to fetch specialties");
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const handleToggleStatus = async (specialty: Specialty) => {
    try {
      const res = await specialtyService.toggleSpecialtyStatus(specialty._id);
      if (res.success) {
        toast.success(`Specialty ${res.data.isActive ? 'activated' : 'deactivated'}`);
        fetchSpecialties();
      }
    } catch (error: unknown) {
      const err = error as any;
      toast.error(err.response?.data?.message || "Error toggling specialty status");
    }
  };

  const handleDeleteClick = (id: string, name: string) => {
    setSpecialtyToDelete({ id, name });
    setDeleteAlertOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!specialtyToDelete) return;

    try {
      const res = await specialtyService.deleteSpecialty(specialtyToDelete.id);
      if (res.success) {
        toast.success("Specialty deleted successfully");
        fetchSpecialties();
      }
    } catch (error: unknown) {
      const err = error as any;
      toast.error(err.response?.data?.message || "Failed to delete specialty");
    } finally {
      setSpecialtyToDelete(null);
    }
  };

  const handleOpenModal = (mode: 'add' | 'edit', specialty?: Specialty) => {
    setModalMode(mode);
    if (mode === 'edit' && specialty) {
      setSelectedSpecialty(specialty);
      setFormData({ name: specialty.name, description: specialty.description || '' });
    } else {
      setSelectedSpecialty(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Specialty name is required");
      return;
    }

    setIsSubmitting(true);
    try {
      let res;
      if (modalMode === 'add') {
        res = await specialtyService.createSpecialty(formData);
      } else {
        res = await specialtyService.updateSpecialty(selectedSpecialty!._id, formData);
      }

      if (res.success) {
        toast.success(`Specialty ${modalMode === 'add' ? 'created' : 'updated'} successfully`);
        setIsModalOpen(false);
        fetchSpecialties();
      }
    } catch (error: unknown) {
      const err = error as any;
      toast.error(err.response?.data?.message || `Failed to ${modalMode} specialty`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex min-h-screen bg-gray-50 no-scrollbar">
      <div className="hidden lg:block w-64 fixed inset-y-0 left-0 z-50">
        <Sidebar />
      </div>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-[60] lg:hidden">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
            <motion.div initial={{ x: -256 }} animate={{ x: 0 }} exit={{ x: -256 }} transition={{ type: "spring", damping: 30, stiffness: 450 }} className="absolute left-0 top-0 h-full w-64 bg-white shadow-2xl">
              <Sidebar onMobileClose={() => setSidebarOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopNav onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6">
          <div className="w-full max-w-7xl mx-auto">
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Specialties Management</h1>
              <p className="text-gray-500 mt-2">Manage medical specialties for the platform</p>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input type="text" placeholder="Search specialties..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                  </div>
                </div>
                <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90" onClick={() => handleOpenModal('add')}>
                  <FaPlus /> Add Specialty
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-500">{i === 1 ? 'Total' : i === 2 ? 'Active' : 'Inactive'}</p>
                        {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold text-gray-900 mt-1">{i === 1 ? total : i === 2 ? specialties.filter(s => s.isActive).length : specialties.filter(s => !s.isActive).length}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-6 w-16 rounded-full" /></td>
                            <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                            <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-24 ml-auto" /></td>
                          </tr>
                        ))
                      ) : specialties.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No specialties found</td></tr>
                      ) : (
                        specialties.map((specialty) => (
                          <tr key={specialty._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{specialty.name}</div></td>
                            <td className="px-6 py-4"><div className="text-sm text-gray-500 max-w-xs truncate" title={specialty.description}>{specialty.description || 'No description'}</div></td>
                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${specialty.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{specialty.isActive ? 'Active' : 'Inactive'}</span></td>
                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(specialty.createdAt)}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleToggleStatus(specialty)} className={`p-2 rounded-lg transition-colors ${specialty.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`} title={specialty.isActive ? 'Deactivate' : 'Activate'}>{specialty.isActive ? <FaToggleOff /> : <FaToggleOn />}</button>
                                <button onClick={() => handleOpenModal('edit', specialty)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Specialty"><FaEdit /></button>
                                <button onClick={() => handleDeleteClick(specialty._id, specialty.name)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete Specialty"><FaTrash /></button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} results</div>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
                      <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
                      <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Alert */}
      <AlertDialog
        open={deleteAlertOpen}
        onOpenChange={setDeleteAlertOpen}
        title="Delete Specialty"
        description={`Are you sure you want to delete "${specialtyToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        variant="destructive"
      />

      {/* Specialty Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">
                  {modalMode === 'add' ? 'Add New Specialty' : 'Edit Specialty'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                  <FaTimes size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Specialty Name</label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Cardiology"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Enter description..."
                      className="w-full h-32 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none text-sm"
                    />
                  </div>
                </div>

                <div className="p-6 bg-slate-50 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2 text-slate-600 font-semibold hover:text-slate-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      modalMode === 'add' ? 'Create Specialty' : 'Update Specialty'
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminSpecialties;
