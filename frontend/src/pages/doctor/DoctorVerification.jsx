import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, Loader2, Mail, Smartphone } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorVerification = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState({
    mobileVerified: false,
    emailVerified: false,
    requiresEmailVerification: false,
    allVerified: false,
  });
  
  // Mobile OTP state
  const [mobileOtp, setMobileOtp] = useState('');
  const [sendingMobileOtp, setSendingMobileOtp] = useState(false);
  const [verifyingMobileOtp, setVerifyingMobileOtp] = useState(false);
  const [mobileOtpSent, setMobileOtpSent] = useState(false);
  
  // Email OTP state
  const [emailOtp, setEmailOtp] = useState('');
  const [sendingEmailOtp, setSendingEmailOtp] = useState(false);
  const [verifyingEmailOtp, setVerifyingEmailOtp] = useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);

  useEffect(() => {
    fetchInvitationAndStatus();
  }, [token]);

  const fetchInvitationAndStatus = async () => {
    try {
      setLoading(true);
      const [inviteRes, statusRes] = await Promise.all([
        axios.get(`${API_URL}/doctor/invitation/${token}`),
        axios.get(`${API_URL}/doctor/invitation/${token}/verification-status`),
      ]);
      
      setInvitation(inviteRes.data.data.invitation);
      setVerificationStatus(statusRes.data.data);
      
      // If already verified, redirect to profile completion
      if (statusRes.data.data.allVerified) {
        toast.success('Verification complete! Redirecting to profile completion...');
        setTimeout(() => {
          navigate(`/doctor/profile/complete/${token}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error(err.response?.data?.message || 'Failed to load verification page');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMobileOtp = async () => {
    try {
      setSendingMobileOtp(true);
      await axios.post(`${API_URL}/doctor/invitation/${token}/send-mobile-otp`);
      setMobileOtpSent(true);
      toast.success('OTP sent to your mobile number');
    } catch (err) {
      console.error('Error sending mobile OTP:', err);
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingMobileOtp(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    if (mobileOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingMobileOtp(true);
      await axios.post(`${API_URL}/doctor/invitation/${token}/verify-mobile-otp`, { otp: mobileOtp });
      toast.success('Mobile number verified successfully!');
      
      // Refresh verification status
      await fetchInvitationAndStatus();
      setMobileOtp('');
    } catch (err) {
      console.error('Error verifying mobile OTP:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingMobileOtp(false);
    }
  };

  const handleSendEmailOtp = async () => {
    try {
      setSendingEmailOtp(true);
      await axios.post(`${API_URL}/doctor/invitation/${token}/send-email-otp`);
      setEmailOtpSent(true);
      toast.success('OTP sent to your email address');
    } catch (err) {
      console.error('Error sending email OTP:', err);
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setSendingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    if (emailOtp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setVerifyingEmailOtp(true);
      await axios.post(`${API_URL}/doctor/invitation/${token}/verify-email-otp`, { otp: emailOtp });
      toast.success('Email verified successfully!');
      
      // Refresh verification status
      await fetchInvitationAndStatus();
      setEmailOtp('');
    } catch (err) {
      console.error('Error verifying email OTP:', err);
      toast.error(err.response?.data?.message || 'Invalid or expired OTP');
    } finally {
      setVerifyingEmailOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading verification page...</p>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <p className="text-red-600 mb-4">Invalid invitation link</p>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">📱 Verify Your Contact Details</h1>
            <p className="text-blue-100">Hello, Dr. {invitation.doctorName}!</p>
          </div>

          <div className="p-8">
            <p className="text-gray-600 mb-8">
              Please verify your mobile number{verificationStatus.requiresEmailVerification ? ' and email address' : ''} to continue with your profile completion.
            </p>

            {/* Mobile Verification */}
            <div className={`border-2 rounded-xl p-6 mb-6 ${verificationStatus.mobileVerified ? 'border-green-500 bg-green-50' : 'border-blue-300 bg-blue-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Smartphone className={`w-6 h-6 ${verificationStatus.mobileVerified ? 'text-green-600' : 'text-blue-600'}`} />
                  <div>
                    <h3 className="font-semibold text-gray-900">Mobile Verification</h3>
                    <p className="text-sm text-gray-600">{invitation.doctorMobile}</p>
                  </div>
                </div>
                {verificationStatus.mobileVerified && (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
              </div>

              {!verificationStatus.mobileVerified && (
                <>
                  {!mobileOtpSent ? (
                    <button
                      onClick={handleSendMobileOtp}
                      disabled={sendingMobileOtp}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendingMobileOtp ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending OTP...
                        </>
                      ) : (
                        'Send OTP to Mobile'
                      )}
                    </button>
                  ) : (
                    <form onSubmit={handleVerifyMobileOtp} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter 6-digit OTP
                        </label>
                        <input
                          type="text"
                          value={mobileOtp}
                          onChange={(e) => setMobileOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest"
                          maxLength="6"
                          required
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={handleSendMobileOtp}
                          disabled={sendingMobileOtp}
                          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                        >
                          Resend OTP
                        </button>
                        <button
                          type="submit"
                          disabled={verifyingMobileOtp || mobileOtp.length !== 6}
                          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {verifyingMobileOtp ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            'Verify OTP'
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}

              {verificationStatus.mobileVerified && (
                <p className="text-green-700 font-medium text-center">✓ Mobile number verified</p>
              )}
            </div>

            {/* Email Verification (if required) */}
            {verificationStatus.requiresEmailVerification && (
              <div className={`border-2 rounded-xl p-6 mb-6 ${verificationStatus.emailVerified ? 'border-green-500 bg-green-50' : verificationStatus.mobileVerified ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-100'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Mail className={`w-6 h-6 ${verificationStatus.emailVerified ? 'text-green-600' : verificationStatus.mobileVerified ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Verification</h3>
                      <p className="text-sm text-gray-600">{invitation.doctorEmail}</p>
                    </div>
                  </div>
                  {verificationStatus.emailVerified && (
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  )}
                </div>

                {!verificationStatus.mobileVerified && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    Please verify your mobile number first
                  </p>
                )}

                {verificationStatus.mobileVerified && !verificationStatus.emailVerified && (
                  <>
                    {!emailOtpSent ? (
                      <button
                        onClick={handleSendEmailOtp}
                        disabled={sendingEmailOtp}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {sendingEmailOtp ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Sending OTP...
                          </>
                        ) : (
                          'Send OTP to Email'
                        )}
                      </button>
                    ) : (
                      <form onSubmit={handleVerifyEmailOtp} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter 6-digit OTP
                          </label>
                          <input
                            type="text"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest"
                            maxLength="6"
                            required
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleSendEmailOtp}
                            disabled={sendingEmailOtp}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                          >
                            Resend OTP
                          </button>
                          <button
                            type="submit"
                            disabled={verifyingEmailOtp || emailOtp.length !== 6}
                            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {verifyingEmailOtp ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verifying...
                              </>
                            ) : (
                              'Verify OTP'
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </>
                )}

                {verificationStatus.emailVerified && (
                  <p className="text-green-700 font-medium text-center">✓ Email verified</p>
                )}
              </div>
            )}

            {/* Continue Button (shown when all verified) */}
            {verificationStatus.allVerified && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => navigate(`/doctor/profile/complete/${token}`)}
                  className="bg-green-600 text-white py-4 px-8 rounded-xl hover:bg-green-700 font-semibold text-lg shadow-lg flex items-center justify-center gap-2 mx-auto"
                >
                  <CheckCircle className="w-6 h-6" />
                  Continue to Profile Completion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorVerification;
