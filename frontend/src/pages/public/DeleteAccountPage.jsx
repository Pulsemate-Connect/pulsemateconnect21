import { useState } from 'react';
import { Link } from 'react-router-dom';
import PulsemateLogo from '../../components/PulsemateLogo';
import toast from 'react-hot-toast';
import api from '../../api/axios';

export default function DeleteAccountPage() {
  const [step, setStep] = useState(1); // 1=form, 2=confirm, 3=done
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { toast.error('Please enter your phone number'); return; }
    setStep(2);
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await api.post('/auth/request-account-deletion', {
        phone: phone.trim().replace(/\D/g, ''),
        reason: reason.trim() || 'User requested deletion',
      });
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Request failed. Please email support@pulsemateconnect.in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/"><PulsemateLogo size="md" theme="light" /></Link>
          <Link to="/" className="text-sm text-blue-600 hover:underline">← Back to Home</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {step === 1 && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-2xl">🗑️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Delete Your Account</h1>
                  <p className="text-slate-500 text-sm">This action is permanent and cannot be undone.</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-amber-800 font-semibold mb-2">⚠️ What will be deleted:</p>
                <ul className="text-sm text-amber-700 space-y-1 list-disc pl-4">
                  <li>Your name, phone number, and email</li>
                  <li>All active appointments (will be cancelled)</li>
                  <li>Your profile and health information</li>
                  <li>Push notification tokens</li>
                  <li>Login sessions on all devices</li>
                </ul>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Registered Phone Number *
                  </label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 text-sm font-semibold text-gray-700 flex-shrink-0">
                      🇮🇳 +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210"
                      maxLength={10}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Reason for deletion <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve — tell us why you're leaving"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  Continue to Delete Account
                </button>

                <p className="text-center text-xs text-slate-400">
                  Changed your mind?{' '}
                  <Link to="/" className="text-blue-600 hover:underline">Go back to PulseMate</Link>
                </p>
              </form>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Confirm Deletion</h2>
              <p className="text-slate-600 mb-6">
                You are requesting to permanently delete the account associated with{' '}
                <strong>+91 {phone}</strong>.
                This cannot be undone. Your data will be anonymised within 30 days.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Yes, Delete My Account'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Request Received</h2>
              <p className="text-slate-600 mb-4">
                Your account deletion request has been submitted. Your personal data will be permanently
                anonymised within 15 days. You will receive a confirmation via SMS.
              </p>
              <p className="text-sm text-slate-400">
                Questions? Email{' '}
                <a href="mailto:support@pulsemateconnect.in" className="text-blue-600 hover:underline">
                  support@pulsemateconnect.in
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
