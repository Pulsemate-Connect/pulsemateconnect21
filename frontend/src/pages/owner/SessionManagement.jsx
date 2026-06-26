// ─────────────────────────────────────────────────────────────────────────────
//  Session Management — PulseMate Connect  |  Clinic Owner
//  Manage clinic appointment sessions (Morning, Evening, etc.)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import DashboardLayout from '../../layouts/DashboardLayout';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

export default function SessionManagement() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [clinics, setClinics] = useState([]);
  const [selectedClinic, setSelectedClinic] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    maxPatients: 30,
    enabled: true,
    sortOrder: 0,
  });

  useEffect(() => {
    fetchClinics();
  }, []);

  useEffect(() => {
    if (selectedClinic) {
      fetchSessions();
    }
  }, [selectedClinic]);

  const fetchClinics = async () => {
    try {
      const res = await api.get('/clinic/my');
      const clinicList = res.data.data.clinics || [];
      setClinics(clinicList);
      if (clinicList.length > 0) {
        setSelectedClinic(clinicList[0].id);
      }
    } catch (error) {
      toast.error('Failed to fetch clinics');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    if (!selectedClinic) return;
    try {
      setLoading(true);
      const res = await api.get(`/clinics/${selectedClinic}/sessions`);
      setSessions(res.data.data.sessions || []);
    } catch (error) {
      toast.error('Failed to fetch sessions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (session = null) => {
    if (session) {
      setEditingSession(session);
      setFormData({
        name: session.name,
        startTime: session.startTime,
        endTime: session.endTime,
        maxPatients: session.maxPatients,
        enabled: session.enabled,
        sortOrder: session.sortOrder,
      });
    } else {
      setEditingSession(null);
      setFormData({
        name: '',
        startTime: '',
        endTime: '',
        maxPatients: 30,
        enabled: true,
        sortOrder: sessions.length,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSession(null);
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      maxPatients: 30,
      enabled: true,
      sortOrder: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.startTime || !formData.endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      if (editingSession) {
        // Update existing session
        await api.put(`/clinic/sessions/${editingSession.id}`, formData);
        toast.success('Session updated successfully');
      } else {
        // Create new session
        await api.post(`/clinic/${selectedClinic}/sessions`, formData);
        toast.success('Session created successfully');
      }
      handleCloseModal();
      fetchSessions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to save session';
      toast.error(message);
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return;
    }

    try {
      await api.delete(`/clinic/sessions/${sessionId}`);
      toast.success('Session deleted successfully');
      fetchSessions();
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete session';
      toast.error(message);
      console.error(error);
    }
  };

  const handleToggleEnabled = async (session) => {
    try {
      await api.put(`/clinic/sessions/${session.id}`, {
        enabled: !session.enabled,
      });
      toast.success(session.enabled ? 'Session disabled' : 'Session enabled');
      fetchSessions();
    } catch (error) {
      toast.error('Failed to update session status');
      console.error(error);
    }
  };

  if (loading && !selectedClinic) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Session Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Configure appointment sessions for your clinic (e.g., Morning, Evening, Night)
          </p>
        </div>

        {/* Clinic Selector */}
        {clinics.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Clinic
            </label>
            <select
              value={selectedClinic || ''}
              onChange={(e) => setSelectedClinic(e.target.value)}
              className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {clinics.map((clinic) => (
                <option key={clinic.id} value={clinic.id}>
                  {clinic.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-gray-600">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} configured
          </p>
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Session
          </button>
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No sessions configured</h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first appointment session.
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`bg-white rounded-lg border ${
                  session.enabled ? 'border-gray-200' : 'border-gray-300 opacity-60'
                } p-6 shadow-sm hover:shadow-md transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{session.name}</h3>
                      {!session.enabled && (
                        <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded">
                          Disabled
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Time:</span>{' '}
                        <span className="font-medium text-gray-900">
                          {formatTime(session.startTime)} – {formatTime(session.endTime)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Patients:</span>{' '}
                        <span className="font-medium text-gray-900">{session.maxPatients}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Sort Order:</span>{' '}
                        <span className="font-medium text-gray-900">{session.sortOrder}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleToggleEnabled(session)}
                      className={`px-3 py-1 text-sm rounded ${
                        session.enabled
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      } transition-colors`}
                    >
                      {session.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      onClick={() => handleOpenModal(session)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(session.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingSession ? 'Edit Session' : 'Create Session'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Session Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Morning Session"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time *
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Patients
                  </label>
                  <input
                    type="number"
                    value={formData.maxPatients}
                    onChange={(e) => setFormData({ ...formData, maxPatients: parseInt(e.target.value, 10) })}
                    min="1"
                    max="200"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value, 10) })}
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enabled"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enabled" className="ml-2 block text-sm text-gray-700">
                    Enabled (patients can book this session)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Saving...' : editingSession ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Helper Functions ──────────────────────────────────────────────────────────
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}
