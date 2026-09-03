import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { resetDatabase } from '../../api/admin.api';
import toast from 'react-hot-toast';
import { Trash2, AlertTriangle, Database, RefreshCw } from 'lucide-react';
import Modal from '../../components/ui/Modal';

const AdminSettings = () => {
  const navigate = useNavigate();
  
  // ✅ SECURITY FIX: Only show reset in development
  const isDevelopment = import.meta.env.MODE === 'development' || 
                        import.meta.env.DEV === true ||
                        window.location.hostname === 'localhost' ||
                        window.location.hostname === '127.0.0.1';
  
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleResetDatabase = async () => {
    // Require exact confirmation text
    if (confirmationText !== 'RESET DATABASE') {
      toast.error('Please type "RESET DATABASE" to confirm');
      return;
    }

    try {
      setIsResetting(true);
      
      const response = await resetDatabase();
      
      toast.success('Database reset successfully! Logging out...');
      
      // Clear local storage and redirect to login after 2 seconds
      setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/auth';
      }, 2000);
    } catch (err) {
      console.error('Reset database error:', err);
      toast.error(err.response?.data?.message || 'Failed to reset database');
      setIsResetting(false);
    }
  };

  const openResetModal = () => {
    setConfirmationText('');
    setIsResetModalOpen(true);
  };

  const closeResetModal = () => {
    if (!isResetting) {
      setIsResetModalOpen(false);
      setConfirmationText('');
    }
  };

  return (
    <DashboardLayout>
      <div className="page-container">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary">Admin Settings</h1>
          <p className="mt-1 text-text-muted">
            Manage system settings and perform administrative tasks
          </p>
        </div>

        {/* Danger Zone (Development Only) */}
        {isDevelopment && (
          <div className="card border-2 border-red-200 bg-red-50">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900 mb-2">
                  Danger Zone (Development Only)
                </h2>
                <p className="text-sm text-red-700 mb-4">
                  These actions are irreversible and will affect the entire system. Proceed with extreme caution.
                  <strong className="block mt-1">⚠️ This section is hidden in production environments.</strong>
                </p>
              </div>
            </div>

          {/* Reset Database Section */}
          <div className="mt-6 pt-6 border-t border-red-300">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-semibold text-red-900">
                    Reset Database
                  </h3>
                </div>
                <p className="text-sm text-red-700 mb-2">
                  This will permanently delete all data from the database and recreate the root admin account.
                </p>
                <div className="bg-red-100 rounded-lg p-3 mt-3">
                  <p className="text-xs font-semibold text-red-900 mb-1">
                    ⚠️ This action will delete:
                  </p>
                  <ul className="text-xs text-red-800 space-y-0.5 ml-4 list-disc">
                    <li>All users (patients, doctors, clinic owners, staff)</li>
                    <li>All clinics and doctor profiles</li>
                    <li>All appointments and prescriptions</li>
                    <li>All payments and transactions</li>
                    <li>All audit logs and notifications</li>
                    <li>All sessions and authentication tokens</li>
                  </ul>
                  <p className="text-xs font-semibold text-red-900 mt-2">
                    ✓ A new root admin account will be created with credentials from environment variables
                  </p>
                </div>
              </div>

              <button
                onClick={openResetModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" />
                Reset Database
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {/* System Info */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">
                System Information
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-muted">Database Provider:</span>
                <span className="font-medium text-text-primary">PostgreSQL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">ORM:</span>
                <span className="font-medium text-text-primary">Prisma</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Environment:</span>
                <span className="font-medium text-text-primary">
                  {import.meta.env.MODE || 'Development'}
                </span>
              </div>
            </div>
          </div>

          {/* Backup Reminder */}
          <div className="card bg-yellow-50 border border-yellow-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="text-base font-semibold text-yellow-900">
                Backup Reminder
              </h3>
            </div>
            <p className="text-sm text-yellow-800">
              Before performing any destructive operations, ensure you have a recent backup of your database.
              Supabase provides automatic daily backups for all databases.
            </p>
            <a
              href="https://app.supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-3 text-sm font-medium text-yellow-700 hover:text-yellow-900 underline"
            >
              Open Supabase Dashboard →
            </a>
          </div>
        </div>

        {/* Reset Confirmation Modal */}
        <Modal
          isOpen={isResetModalOpen}
          onClose={closeResetModal}
          title="⚠️ Reset Database - Confirmation Required"
          size="md"
        >
          <div className="space-y-4">
            {/* Warning Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-900 mb-1">
                    This is an extremely dangerous operation!
                  </p>
                  <p className="text-xs text-red-800">
                    This action will permanently delete ALL data from your database. This includes all users,
                    clinics, doctors, appointments, payments, and every other record. This action CANNOT be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* What will happen */}
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                What will happen:
              </p>
              <ol className="text-sm text-gray-700 space-y-1.5 list-decimal list-inside">
                <li>All database tables will be truncated (data deleted)</li>
                <li>A new root admin account will be created</li>
                <li>You will be logged out immediately</li>
                <li>You'll need to log in with the new admin credentials</li>
                <li>All other users will need to re-register</li>
              </ol>
            </div>

            {/* Confirmation Input */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Type <span className="font-bold text-red-600">"RESET DATABASE"</span> to confirm:
              </label>
              <input
                type="text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="RESET DATABASE"
                disabled={isResetting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                This must match exactly (case-sensitive)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={closeResetModal}
                disabled={isResetting}
                className="flex-1 px-4 py-2.5 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDatabase}
                disabled={confirmationText !== 'RESET DATABASE' || isResetting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Yes, Reset Database
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default AdminSettings;
