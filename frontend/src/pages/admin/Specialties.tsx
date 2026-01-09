import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import TopNav from "../../components/admin/TopNav";
import Sidebar from "../../components/admin/Sidebar";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaToggleOn, FaToggleOff, FaEye } from 'react-icons/fa';
import { specialtyService } from '../../services/specialtyService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

interface Specialty {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SpecialtyFormData {
  name: string;
  description?: string;
}

const AdminSpecialties: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);
  const [formData, setFormData] = useState<SpecialtyFormData>({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState<{ name?: string; description?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, search]);

  useEffect(() => {
    fetchSpecialties();
  }, [fetchSpecialties]);

  const validateForm = (data: SpecialtyFormData): boolean => {
    const errors: { name?: string; description?: string } = {};
    
    if (!data.name || data.name.trim().length === 0) {
      errors.name = "Specialty name is required";
    } else if (data.name.length > 100) {
      errors.name = "Name must be less than 100 characters";
    }
    
    if (data.description && data.description.length > 500) {
      errors.description = "Description must be less than 500 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm(formData)) return;
    
    setSubmitting(true);
    try {
      const response = await specialtyService.createSpecialty(formData);
      if (response.success) {
        setShowCreateModal(false);
        setFormData({ name: '', description: '' });
        fetchSpecialties();
      }
    } catch (error) {
      console.error("Error creating specialty:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedSpecialty || !validateForm(formData)) return;
    
    setSubmitting(true);
    try {
      const response = await specialtyService.updateSpecialty(selectedSpecialty._id, formData);
      if (response.success) {
        setShowEditModal(false);
        setSelectedSpecialty(null);
        setFormData({ name: '', description: '' });
        fetchSpecialties();
      }
    } catch (error) {
      console.error("Error updating specialty:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedSpecialty) return;
    
    setSubmitting(true);
    try {
      const response = await specialtyService.deleteSpecialty(selectedSpecialty._id);
      if (response.success) {
        setShowDeleteModal(false);
        setSelectedSpecialty(null);
        fetchSpecialties();
      }
    } catch (error) {
      console.error("Error deleting specialty:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (specialty: Specialty) => {
    try {
      await specialtyService.toggleSpecialtyStatus(specialty._id);
      fetchSpecialties();
    } catch (error) {
      console.error("Error toggling specialty status:", error);
    }
  };

  const openEditModal = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setFormData({ name: specialty.name, description: specialty.description || '' });
    setShowEditModal(true);
    setFormErrors({});
  };

  const openDeleteModal = (specialty: Specialty) => {
    setSelectedSpecialty(specialty);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
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
            <div className="bg-primary/10 rounded-lg py-6 sm:py-8 md:py-10 mb-6 text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">Specialties Management</h1>
              <p className="text-gray-500 mt-2">Manage medical specialties for the platform</p>
            </div>

            <div className="space-y-6">
              {/* Header Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3 flex-1 max-w-md">
                  <div className="relative flex-1">
                    <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search specialties..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setFormData({ name: '', description: '' });
                    setFormErrors({});
                    setShowCreateModal(true);
                  }}
                  className="flex items-center gap-2"
                >
                  <FaPlus /> Add Specialty
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Specialties</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FaEye className="text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Active</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        {specialties.filter(s => s.isActive).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <FaToggleOn className="text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Inactive</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        {specialties.filter(s => !s.isActive).length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <FaToggleOff className="text-red-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Specialties Table */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            Loading specialties...
                          </td>
                        </tr>
                      ) : specialties.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No specialties found
                          </td>
                        </tr>
                      ) : (
                        specialties.map((specialty) => (
                          <tr key={specialty._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="text-sm font-medium text-gray-900">{specialty.name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-500 max-w-xs truncate">
                                {specialty.description || 'No description'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  specialty.isActive
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {specialty.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatDate(specialty.createdAt)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleToggleStatus(specialty)}
                                  className={`p-2 rounded-lg transition-colors ${
                                    specialty.isActive
                                      ? 'text-red-600 hover:bg-red-50'
                                      : 'text-green-600 hover:bg-green-50'
                                  }`}
                                  title={specialty.isActive ? 'Deactivate' : 'Activate'}
                                >
                                  {specialty.isActive ? <FaToggleOff /> : <FaToggleOn />}
                                </button>
                                <button
                                  onClick={() => openEditModal(specialty)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Edit"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => openDeleteModal(specialty)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, total)} of {total} results
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modals */}
            {/* Create Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowCreateModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Specialty</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter specialty name"
                          className={formErrors.name ? 'border-red-500' : ''}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter description (optional)"
                          rows={3}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.description ? 'border-red-500' : ''
                          }`}
                        />
                        {formErrors.description && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleCreate}
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Creating...' : 'Create'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Specialty</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter specialty name"
                          className={formErrors.name ? 'border-red-500' : ''}
                        />
                        {formErrors.name && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          placeholder="Enter description (optional)"
                          rows={3}
                          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            formErrors.description ? 'border-red-500' : ''
                          }`}
                        />
                        {formErrors.description && (
                          <p className="text-red-500 text-xs mt-1">{formErrors.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-6">
                      <Button
                        onClick={handleUpdate}
                        disabled={submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Updating...' : 'Update'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowEditModal(false)}
                        className="flex-1 border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && selectedSpecialty && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="fixed inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
                <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Specialty</h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete "{selectedSpecialty.name}"? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={handleDelete}
                        disabled={submitting}
                        className="flex-1 bg-[#00A1B0] hover:bg-[#008f9c]"
                      >
                        {submitting ? 'Deleting...' : 'Delete'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteModal(false)}
                        className="flex-1 border-[#00A1B0] text-[#00A1B0] hover:bg-[#00A1B0] hover:text-white"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSpecialties;
