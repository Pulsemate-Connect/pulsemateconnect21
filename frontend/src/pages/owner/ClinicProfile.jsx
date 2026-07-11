import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { getMyClinics, createClinic, updateClinic } from '../../api/clinic.api';
import api from '../../api/axios';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const ClinicProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(!!id);
  const [isSaving, setIsSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    openingTime: '09:00',
    closingTime: '18:00',
    description: '',
  });

  useEffect(() => {
    if (id) {
      const fetchClinic = async () => {
        try {
          const res = await getMyClinics();
          const clinic = res.data.data.clinics?.find((c) => c.id === id);
          if (clinic) {
            setLogoUrl(clinic.clinicLogoUrl || '');
            setFormData({
              name: clinic.name || '',
              phone: clinic.phone || '',
              address: clinic.address || '',
              city: clinic.city || '',
              openingTime: clinic.openingTime || '09:00',
              closingTime: clinic.closingTime || '18:00',
              description: clinic.description || '',
            });
          }
        } catch (err) {
          toast.error('Failed to load clinic');
        } finally {
          setIsLoading(false);
        }
      };
      fetchClinic();
    }
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (id) {
        await updateClinic(id, formData);
        toast.success('Clinic updated!');
      } else {
        const res = await createClinic(formData);
        toast.success('Clinic created!');
        navigate(`/owner/clinic/${res.data.data.clinic.id}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save clinic');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-64"><LoadingSpinner size="lg" /></div>
      </DashboardLayout>
    );
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    if (id) formData.append('clinicId', id);
    try {
      const res = await api.post('/upload/clinic-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setLogoUrl(res.data.data.url);
      toast.success('Logo uploaded!');
    } catch {
      toast.error('Upload failed');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/owner')} className="text-text-muted hover:text-text-primary text-sm">
            ← Back
          </button>
          <h1 className="text-2xl font-bold text-text-primary">
            {id ? 'Edit Clinic' : 'Create Clinic'}
          </h1>
        </div>

        <div className="card">
          {/* Clinic Logo */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
            <div className="relative">
              {logoUrl ? (
                <img src={logoUrl} alt="Clinic Logo" className="w-16 h-16 rounded-2xl object-cover border border-border" />
              ) : (
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-border">
                  <span className="text-2xl font-bold text-blue-600">
                    {formData.name?.charAt(0)?.toUpperCase() || '🏥'}
                  </span>
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700">
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-text-primary">Clinic Logo</p>
              <p className="text-xs text-text-muted mt-0.5">JPEG, PNG or WebP · Max 5MB</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Clinic Name *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                placeholder="e.g. City Health Clinic"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 8000000000"
                />
              </div>
              <div>
                <label className="label">City</label>
                <input
                  type="text"
                  className="input"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Bangalore"
                />
              </div>
            </div>

            <div>
              <label className="label">Address</label>
              <textarea
                className="input resize-none"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full clinic address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Opening Time</label>
                <input
                  type="time"
                  className="input"
                  value={formData.openingTime}
                  onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Closing Time</label>
                <input
                  type="time"
                  className="input"
                  value={formData.closingTime}
                  onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="label">Description</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of your clinic..."
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3" disabled={isSaving}>
              {isSaving ? <LoadingSpinner size="sm" className="mx-auto" /> : (id ? 'Update Clinic' : 'Create Clinic')}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ClinicProfile;
