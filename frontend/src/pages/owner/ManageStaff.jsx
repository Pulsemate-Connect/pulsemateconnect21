import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, getStaff, getDoctorInvites, addStaff, updateStaffStatus, inviteDoctor, getPendingInvitations } from '../../api/clinic.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import StatusBadge from '../../components/ui/StatusBadge';
import ClinicNotVerifiedGuard from '../../components/ui/ClinicNotVerifiedGuard';
import toast from 'react-hot-toast';

const ManageStaff = ({ staffRole = 'DOCTOR' }) => {
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ mobile: '', name: '', email: '', specialization: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [doctorInvites, setDoctorInvites] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const res = await getMyClinics();
        const clinicList = res.data.data.clinics || [];
        setClinics(clinicList);
        if (clinicList.length > 0) setSelectedClinic(clinicList[0]);
      } catch (err) {
        toast.error('Failed to load clinics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) fetchStaff();
  }, [selectedClinic]);

  useEffect(() => {
    if (selectedClinic && staffRole === 'DOCTOR') {
      fetchDoctorInvites();
      fetchPendingInvitations();
    }
  }, [selectedClinic, staffRole]);

  const fetchPendingInvitations = async () => {
    if (!selectedClinic || staffRole !== 'DOCTOR') return;
    try {
      const res = await getPendingInvitations(selectedClinic.id);
      setPendingInvitations(res.data.data?.invitations || []);
    } catch (_) {
      // Silently fail - not critical
    }
  };

  const fetchStaff = async () => {
    if (!selectedClinic) return;
    try {
      const res = await getStaff(selectedClinic.id);
      const allStaff = res.data.data.staff || [];
      setStaff(allStaff.filter((s) => s.role === staffRole));
    } catch (err) {
      toast.error('Failed to load staff');
    }
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      if (staffRole === 'DOCTOR') {
        // ✅ NEW WORKFLOW: Send invitation only (minimal info)
        const formattedMobile = addForm.mobile.startsWith('+91') 
          ? addForm.mobile 
          : `+91${addForm.mobile}`;
        
        await inviteDoctor(selectedClinic.id, { 
          name: addForm.name,
          mobile: formattedMobile,
          email: addForm.email, // Now required
          specialization: addForm.specialization || undefined,
        });
        
        toast.success('Doctor invitation sent! They will receive an SMS/notification to accept.');
        setShowAddModal(false);
        setAddForm({ mobile: '', name: '', email: '', specialization: '' });
        
        // Reload invitations lists
        fetchDoctorInvites();
        fetchPendingInvitations();
      } else {
        // RECEPTIONIST: Keep old workflow (direct add with credentials)
        const formattedMobile = addForm.mobile.startsWith('+91') 
          ? addForm.mobile 
          : `+91${addForm.mobile}`;
        
        await addStaff(selectedClinic.id, { 
          ...addForm, 
          mobile: formattedMobile,
          role: staffRole 
        });
        toast.success('Receptionist added!');
        setShowAddModal(false);
        setAddForm({ mobile: '', name: '', email: '', specialization: '' });
        fetchStaff();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add staff');
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleStatus = async (staffId, currentStatus) => {
    try {
      await updateStaffStatus(selectedClinic.id, staffId, !currentStatus);
      toast.success('Status updated');
      fetchStaff();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const fetchDoctorInvites = async () => {
    if (!selectedClinic || staffRole !== 'DOCTOR') return;
    try {
      const res = await getDoctorInvites(selectedClinic.id);
      setDoctorInvites(res.data.data?.invites || []);
    } catch (_) {
      toast.error('Failed to load doctor invites');
    }
  };

  const title = staffRole === 'DOCTOR' ? 'Doctors' : 'Receptionists';
  const connectedDoctorUserIds = new Set(staff.map((member) => member.user?.id).filter(Boolean));

  return (
    <DashboardLayout>
      <ClinicNotVerifiedGuard>
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Manage {title}</h1>
          {selectedClinic && (
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              + Add {staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
            </button>
          )}
        </div>

        {/* Clinic selector */}
        {clinics.length > 1 && (
          <div className="mb-4">
            <select
              className="input max-w-xs"
              value={selectedClinic?.id || ''}
              onChange={(e) => setSelectedClinic(clinics.find((c) => c.id === e.target.value))}
            >
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><LoadingSpinner /></div>
        ) : staff.length === 0 ? (
          <EmptyState
            icon={staffRole === 'DOCTOR' ? '👨‍⚕️' : '👩‍💼'}
            title={`No ${title.toLowerCase()} yet`}
            description={`Add ${title.toLowerCase()} to your clinic`}
            action={
              selectedClinic && (
                <button onClick={() => setShowAddModal(true)} className="btn-primary">
                  Add {staffRole === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {staff.map((s) => (
                <div key={s.id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-bold">
                          {s.user?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-text-primary">{s.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-text-muted">{s.user?.mobile}</p>
                        {s.user?.doctorProfile?.specialization && (
                          <p className="text-xs text-primary-600">{s.user.doctorProfile.specialization}</p>
                        )}
                        {s.inviteStatus && staffRole === 'DOCTOR' && (
                          <div className="mt-1"><StatusBadge status={s.inviteStatus} /></div>
                        )}
                      </div>
                    </div>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-error'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex justify-end">
                    <button
                      onClick={() => handleToggleStatus(s.id, s.isActive)}
                      className={`text-sm ${s.isActive ? 'text-error hover:text-red-700' : 'text-secondary-600 hover:text-secondary-700'}`}
                    >
                      {s.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {staffRole === 'DOCTOR' && doctorInvites.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Invite Activity</h2>
                  <span className="badge badge-info text-xs">{doctorInvites.length} invites</span>
                </div>
                <div className="space-y-3">
                  {doctorInvites.map((invite) => (
                    <div key={invite.id} className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{invite.doctor?.user?.name || 'Doctor'}</p>
                          <StatusBadge status={invite.inviteStatus} />
                        </div>
                        <p className="mt-1 text-sm text-text-muted">
                          {invite.doctor?.specialization || 'Specialization not set'}
                          {invite.doctor?.user?.mobile ? ` · ${invite.doctor.user.mobile}` : ''}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {invite.joinedAt ? `Joined ${new Date(invite.joinedAt).toLocaleDateString('en-IN')}` : ''}
                          {invite.removedAt ? ` · Removed ${new Date(invite.removedAt).toLocaleDateString('en-IN')}` : ''}
                        </p>
                      </div>
                      <div className="text-xs text-text-muted">
                        Sent {new Date(invite.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* ✅ NEW: Show pending invitations from DoctorInvitation table */}
            {staffRole === 'DOCTOR' && pendingInvitations.length > 0 && (
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-text-primary">Pending Invitations</h2>
                  <span className="badge badge-warning text-xs">{pendingInvitations.length} pending</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  These doctors have been invited but haven't accepted yet. They will receive SMS/email notifications.
                </p>
                <div className="space-y-3">
                  {pendingInvitations.map((invitation) => (
                    <div key={invitation.id} className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-text-primary">{invitation.name}</p>
                          <StatusBadge status={invitation.status} />
                        </div>
                        <p className="mt-1 text-sm text-text-muted">
                          {invitation.mobile}
                          {invitation.email ? ` · ${invitation.email}` : ''}
                        </p>
                        {invitation.specialization && (
                          <p className="text-xs text-gray-600 mt-1">
                            Specialization: {invitation.specialization}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-text-muted">
                        Sent {new Date(invitation.createdAt).toLocaleDateString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`${staffRole === 'DOCTOR' ? 'Invite Doctor' : 'Add Receptionist'}`}
      >
        <form onSubmit={handleAddStaff} className="space-y-4">
          {staffRole === 'DOCTOR' ? (
            <>
              {/* ✅ NEW: Doctor Invitation Form (Minimal Info) */}
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📨 Invitation Workflow:</strong> Enter the doctor's name and mobile number. 
                  They will receive an invitation to join your clinic and will complete their own 
                  professional profile for PulseMate admin verification.
                </p>
              </div>
              
              <div>
                <label className="label">Doctor Full Name *</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Dr. John Doe"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Full legal name of the doctor</p>
              </div>
              
              <div>
                <label className="label">Mobile Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+91</span>
                  <input
                    type="tel"
                    className="input pl-12"
                    value={addForm.mobile}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddForm({ ...addForm, mobile: cleaned });
                    }}
                    placeholder="9876543210"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Invitation will be sent to this mobile number & email</p>
              </div>
              
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="input"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="doctor@example.com"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Invitation will be sent to mobile number & this email</p>
              </div>
              
              <div>
                <label className="label">Specialization (Optional)</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.specialization}
                  onChange={(e) => setAddForm({ ...addForm, specialization: e.target.value })}
                  placeholder="e.g., General Physician, Cardiologist"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Helps identify the doctor</p>
              </div>
            </>
          ) : (
            <>
              {/* RECEPTIONIST: Keep old form (requires all details) */}
              <div>
                <label className="label">Mobile Number *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">+91</span>
                  <input
                    type="tel"
                    className="input pl-12"
                    value={addForm.mobile}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddForm({ ...addForm, mobile: cleaned });
                    }}
                    placeholder="9876543210"
                    maxLength="10"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 10-digit mobile number</p>
              </div>
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  className="input"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  type="email"
                  className="input"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="receptionist@example.com"
                />
              </div>
              <div>
                <label className="label">Password (for staff login)</label>
                <input
                  type="password"
                  className="input"
                  value={addForm.password}
                  onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={isAdding}>
              {isAdding ? <LoadingSpinner size="sm" className="mx-auto" /> : staffRole === 'DOCTOR' ? 'Send Invitation' : 'Add Staff'}
            </button>
          </div>
        </form>
      </Modal>
      </ClinicNotVerifiedGuard>
    </DashboardLayout>
  );
};

export default ManageStaff;
