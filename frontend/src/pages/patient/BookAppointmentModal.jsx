import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/ui/Modal';
import { getPatientProfile, getAvailableSlots, getClinicSessions, getFollowUpEligibility, bookFollowUp } from '../../api/patient.api';
import { initiatePayment, verifyPayment, getBookingStatus } from '../../api/payment.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ProfileSetupModal from './ProfileSetupModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
const isProfileComplete = (user) => {
  const p = user?.patientProfile;
  return !!(user?.name && p?.gender && (p?.dob || p?.age) && (p?.city || p?.address) && p?.emergencyContact);
};

const toMins = (t) => { if (!t) return 0; const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const fmt12 = (t) => {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:${String(m).padStart(2, '0')} ${ampm}`;
};

const loadRazorpay = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true);
  s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

// Build next 14 days
const buildDays = () => Array.from({ length: 14 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() + i);
  return {
    iso: d.toISOString().split('T')[0],
    weekday: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
    day: d.getDate(),
    month: d.toLocaleDateString('en-IN', { month: 'short' }),
  };
});

const FOR_WHOM = [
  { key: 'myself', label: 'Myself' },
  { key: 'family', label: 'Family' },
  { key: 'friend', label: 'Friend' },
  { key: 'others', label: 'Others' },
];

// ── Main Component ────────────────────────────────────────────────────────────
const BookAppointmentModal = ({ doctor, clinic, defaultType = 'OFFLINE', onClose, onSuccess }) => {
  const [stage, setStage] = useState('profile_check');
  const [patientData, setPatientData] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successIsFree, setSuccessIsFree] = useState(false);
  const [bookedAppt, setBookedAppt] = useState(null);
  const [bookedQueueInfo, setBookedQueueInfo] = useState(null);

  // Follow-up state
  const [followUpEligible, setFollowUpEligible] = useState([]);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [isBookingFollowUp, setIsBookingFollowUp] = useState(false);

  // Form state
  const [forWhom, setForWhom] = useState('myself');
  const [visitType, setVisitType] = useState(defaultType);
  const [date, setDate] = useState('');
  const [selectedSession, setSelectedSession] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');

  // Sessions + slots data
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const days = buildDays();
  const isFreeEligible = bookingStatus !== null && !bookingStatus.freeBookingUsed;

  // Stage 1 — check profile + booking status + follow-up eligibility
  useEffect(() => {
    const check = async () => {
      try {
        const [profileRes, statusRes, sessionsRes, followUpRes] = await Promise.all([
          getPatientProfile(),
          getBookingStatus().catch(() => null),
          getClinicSessions(clinic.id).catch(() => null),
          getFollowUpEligibility().catch(() => null),
        ]);
        const user = profileRes.data.data.user;
        setPatientData(user);
        setBookingStatus(statusRes?.data?.data ?? { freeBookingUsed: false, bookingFee: 0 });
        setSessions(sessionsRes?.data?.data?.sessions || []);

        // Only show follow-ups relevant to this doctor+clinic
        const allFollowUps = followUpRes?.data?.data?.followUps || [];
        const relevant = allFollowUps.filter(
          (f) => f.clinic.id === clinic.id && f.doctor.id === doctor.id
        );
        setFollowUpEligible(relevant);

        setStage(isProfileComplete(user) ? 'booking_form' : 'profile_setup');
      } catch {
        setBookingStatus({ freeBookingUsed: false, bookingFee: 0 });
        setStage('profile_setup');
      }
    };
    check();
  }, [clinic.id, doctor.id]);

  // Fetch slots when date changes
  useEffect(() => {
    if (!date || !doctor.id || !clinic.id) return;
    setSlotsLoading(true);
    setSlots([]);
    setSelectedSession('');
    setSelectedSlot('');
    getAvailableSlots(doctor.id, { clinicId: clinic.id, date })
      .then((r) => setSlots(r.data.data?.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [date, doctor.id, clinic.id]);

  const getSlotsForSession = useCallback((sess) => {
    if (!sess) return [];
    const start = toMins(sess.startTime);
    const end = toMins(sess.endTime);
    return slots.filter((s) => s.available && toMins(s.time) >= start && toMins(s.time) < end);
  }, [slots]);

  const handleSessionSelect = (sess) => {
    setSelectedSession(sess.id);
    const avail = getSlotsForSession(sess);
    setSelectedSlot(avail.length > 0 ? avail[0].time : '');
  };

  const handleProfileComplete = (data) => {
    setPatientData(data?.user || patientData);
    setStage('booking_form');
  };

  // Submit booking
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) return toast.error('Please select a date');
    if (sessions.length > 0 && !selectedSession) return toast.error('Please select a session');

    setIsProcessing(true);
    try {
      const payload = {
        doctorId: doctor.id,
        clinicId: clinic.id,
        appointmentType: visitType,
        appointmentDate: date,
        slotTime: selectedSlot || undefined,
        sessionId: selectedSession || undefined,
        symptoms: symptoms.trim() || undefined,
      };

      const res = await initiatePayment(payload);
      const data = res.data.data;

      if (data.isFree) {
        setSuccessIsFree(true);
        setBookedAppt(data.appointment);
        setBookedQueueInfo(data._queueInfo || null);
        setStage('success');
        toast.success('🎉 First booking confirmed for free!');
        setTimeout(() => onSuccess(data.appointment), 2200);
        return;
      }

      const { appointmentId, order, key, devMode, doctorName } = data;

      if (devMode) {
        await handleVerify({ appointmentId, razorpayOrderId: order.id, razorpayPaymentId: `pay_dev_${Date.now()}`, razorpaySignature: 'dev_sig' });
        return;
      }

      const loaded = await loadRazorpay();
      if (!loaded) { toast.error('Payment gateway unavailable. Check connection.'); setIsProcessing(false); return; }

      setStage('payment');

      const rzp = new window.Razorpay({
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'PulseMate',
        description: `Consultation — Dr. ${doctorName || doctor.user?.name}`,
        order_id: order.id,
        handler: async (response) => {
          await handleVerify({ appointmentId, razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature });
        },
        prefill: { name: patientData?.name || '', contact: patientData?.mobile || '' },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => { setStage('booking_form'); setIsProcessing(false); toast('Payment cancelled.', { icon: '⚠️' }); },
        },
      });
      rzp.on('payment.failed', () => { setStage('booking_form'); setIsProcessing(false); toast.error('Payment failed. Try again.'); });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Booking failed');
      setIsProcessing(false);
    }
  };

  const handleVerify = async ({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) => {
    try {
      const res = await verifyPayment({ appointmentId, razorpayOrderId, razorpayPaymentId, razorpaySignature });
      const appt = res.data.data.appointment;
      setSuccessIsFree(false);
      setBookedAppt(appt);
      setBookedQueueInfo(res.data.data._queueInfo || null);
      setStage('success');
      setTimeout(() => onSuccess(appt), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment verification failed');
      setStage('booking_form');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBookFollowUp = async (followUp, symptoms) => {
    setIsBookingFollowUp(true);
    try {
      const res = await bookFollowUp({
        originalAppointmentId: followUp.originalAppointmentId,
        symptoms: symptoms || '',
      });
      const appt = res.data.data.appointment;
      setBookedAppt(appt);
      setBookedQueueInfo(res.data.data);
      setSuccessIsFree(false);
      setSelectedFollowUp(null);
      setStage('success');
      toast.success('🔄 Follow-up booked with priority queue!');
      setTimeout(() => onSuccess(appt), 2200);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to book follow-up');
    } finally {
      setIsBookingFollowUp(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (stage === 'profile_check') {
    return (
      <Modal isOpen={true} onClose={onClose} title="Book Appointment">
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-text-muted">Checking your profile...</p>
        </div>
      </Modal>
    );
  }

  if (stage === 'profile_setup') {
    return <ProfileSetupModal onComplete={handleProfileComplete} onSkip={onClose} existingUser={patientData} />;
  }

  if (stage === 'payment') {
    return (
      <Modal isOpen={true} onClose={() => {}} title="Processing Payment">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">💳</span>
          </div>
          <p className="font-semibold text-gray-900">Opening payment gateway...</p>
          <p className="text-sm text-gray-500 text-center">Complete the payment in the Razorpay window.<br />Do not close this tab.</p>
          <LoadingSpinner size="sm" />
        </div>
      </Modal>
    );
  }

  if (stage === 'success') {
    return (
      <Modal isOpen={true} onClose={() => onSuccess(bookedAppt)} title="">
        <div className="flex flex-col items-center py-6 gap-4 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${successIsFree ? 'bg-emerald-100' : 'bg-green-100'}`}>
            <span className="text-4xl">{successIsFree ? '🎉' : '✅'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{successIsFree ? 'First Booking Free!' : 'Booking Confirmed!'}</h2>
            <p className="text-gray-500 mt-1 text-sm">{successIsFree ? 'Your appointment is confirmed at no charge.' : 'Payment successful. Appointment confirmed.'}</p>
          </div>
          <div className={`border rounded-xl p-4 w-full text-left text-sm space-y-1 ${successIsFree ? 'bg-emerald-50 border-emerald-200' : 'bg-green-50 border-green-200'}`}>
            <p className="font-semibold">🏥 {clinic.name}</p>
            <p>👨‍⚕️ Dr. {doctor.user?.name} — {doctor.specialization}</p>
            <p>📅 {date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Today'}</p>
            {selectedSlot && <p>🕐 {fmt12(selectedSlot)}</p>}
            {bookedAppt?.queueNumber && <p>🎫 Queue Token #{bookedAppt.queueNumber}</p>}
            {bookedQueueInfo?.position && <p>📍 Position #{bookedQueueInfo.position} in queue</p>}
            {bookedQueueInfo?.estimatedWaitMinutes > 0 && (
              <p>⏱ Estimated wait: ~{bookedQueueInfo.estimatedWaitMinutes} min</p>
            )}
            {bookedQueueInfo?.estimatedAppointmentTime && (
              <p>🕐 Estimated time: {fmt12(bookedQueueInfo.estimatedAppointmentTime)}</p>
            )}
            {successIsFree && <p className="text-xs text-emerald-600 font-semibold pt-1">🎁 First booking benefit applied</p>}
          </div>
          {bookedQueueInfo && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-left w-full">
              ⚡ Queue runs on live arrival basis. ETA is an estimate — please arrive 10–15 min early and track your token live.
            </p>
          )}
          <p className="text-xs text-gray-400">Redirecting to appointments...</p>
        </div>
      </Modal>
    );
  }

  // ── Booking form ──────────────────────────────────────────────────────────
  const p = patientData?.patientProfile;
  const age = p?.dob ? Math.floor((Date.now() - new Date(p.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : p?.age;
  const canSubmit = !!date && (sessions.length === 0 || !!selectedSession) && !isProcessing;

  return (
    <Modal isOpen={true} onClose={onClose} title="Book Appointment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Doctor banner */}
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-blue-700 font-bold text-xl">{doctor.user?.name?.charAt(0) || 'D'}</span>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Dr. {doctor.user?.name}</p>
            <p className="text-sm text-blue-600">{doctor.specialization}</p>
            <p className="text-xs text-gray-500 mt-0.5">📍 {clinic.name}{clinic.city ? `, ${clinic.city}` : ''}</p>
          </div>
          {isFreeEligible && (
            <span className="ml-auto flex-shrink-0 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">🎉 FREE</span>
          )}
        </div>

        {/* ── Follow-up section (only shown when eligible) ── */}
        {followUpEligible.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-bold text-orange-800 mb-3">🔄 Follow-up Available</p>
            {followUpEligible.map((fu) => (
              <div key={fu.originalAppointmentId} className="bg-white border border-orange-200 rounded-xl p-3 mb-2">
                <p className="text-sm font-semibold text-gray-800">Dr. {fu.doctor.name}</p>
                <p className="text-xs text-gray-500">{clinic.name}</p>
                <p className="text-xs text-gray-500">
                  Previous: {new Date(fu.appointmentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {fu.followUpDate && (
                  <p className="text-xs text-orange-600 font-medium mt-1">
                    Valid until: {new Date(fu.followUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
                <p className="text-xs text-green-600 font-medium mt-1">✅ Follow-up recommended by doctor</p>
                <button
                  type="button"
                  disabled={isBookingFollowUp}
                  onClick={() => {
                    setSelectedFollowUp(fu);
                    handleBookFollowUp(fu, symptoms);
                  }}
                  className="mt-2 w-full py-2 px-3 bg-orange-500 text-white rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isBookingFollowUp ? <LoadingSpinner size="sm" /> : '🔄 Book Follow-up (Priority Queue)'}
                </button>
              </div>
            ))}
            <p className="text-xs text-orange-600 mt-1">Follow-up patients get priority queue position.</p>
            <div className="mt-2 border-t border-orange-200 pt-2">
              <p className="text-xs text-gray-500">Or book a new appointment below ↓</p>
            </div>
          </div>
        )}

        {/* For whom */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Booking for</p>
          <div className="flex gap-2 flex-wrap">
            {FOR_WHOM.map((opt) => (
              <button key={opt.key} type="button"
                onClick={() => { if (opt.key !== 'myself') { toast('Coming soon'); return; } setForWhom(opt.key); }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${forWhom === opt.key ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visit type */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Visit type</p>
          <div className="grid grid-cols-2 gap-3">
            {[{ k: 'OFFLINE', label: '🏥 In-Person', sub: 'Visit the clinic' }, { k: 'ONLINE', label: '💻 Online', sub: 'Video consultation' }].map((vt) => (
              <button key={vt.k} type="button" onClick={() => setVisitType(vt.k)}
                className={`py-3 px-4 rounded-xl border-2 text-left transition-all ${visitType === vt.k ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <p className={`text-sm font-semibold ${visitType === vt.k ? 'text-blue-700' : 'text-gray-700'}`}>{vt.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{vt.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* 14-day date strip */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select date</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {days.map((d) => (
              <button key={d.iso} type="button" onClick={() => setDate(d.iso)}
                className={`flex-shrink-0 flex flex-col items-center w-14 py-2.5 rounded-xl border-2 text-center transition-all ${date === d.iso ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
              >
                <span className="text-xs font-semibold">{d.weekday}</span>
                <span className="text-xl font-bold leading-tight">{d.day}</span>
                <span className="text-xs">{d.month}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Session + slot picker */}
        {date && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select session</p>
            {slotsLoading ? (
              <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
                <LoadingSpinner size="sm" /> Checking availability...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-2xl mb-2">📅</p>
                <p className="text-sm font-medium text-gray-600">No sessions configured</p>
                <p className="text-xs text-gray-400 mt-1">Contact the clinic to book directly</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {sessions.map((sess) => {
                  const sessSlots = getSlotsForSession(sess);
                  const hasSlots = sessSlots.length > 0;
                  const active = selectedSession === sess.id;
                  const startH = sess.startTime ? parseInt(sess.startTime.split(':')[0]) : 0;
                  const icon = startH < 12 ? '🌅' : startH < 17 ? '☀️' : '🌙';
                  return (
                    <button key={sess.id} type="button"
                      onClick={() => hasSlots && handleSessionSelect(sess)}
                      disabled={!hasSlots}
                      className={`relative py-3 px-3 rounded-xl border-2 text-center transition-all ${active ? 'border-blue-600 bg-blue-50' : hasSlots ? 'border-gray-200 hover:border-blue-300 bg-white' : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'}`}
                    >
                      {active && <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center"><svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></span>}
                      <p className="text-xl mb-1">{icon}</p>
                      <p className={`text-xs font-semibold ${active ? 'text-blue-700' : 'text-gray-700'}`}>{sess.name || 'Session'}</p>
                      <p className="text-xs text-gray-400">{fmt12(sess.startTime)} – {fmt12(sess.endTime)}</p>
                      {hasSlots ? <p className="text-xs text-green-600 font-medium mt-1">{sessSlots.length} slots</p> : <p className="text-xs text-red-400 font-medium mt-1">Fully booked</p>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Slot time grid */}
            {selectedSession && getSlotsForSession(sessions.find(s => s.id === selectedSession)).length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select time slot</p>
                <div className="flex flex-wrap gap-2">
                  {getSlotsForSession(sessions.find(s => s.id === selectedSession)).map((sl) => (
                    <button key={sl.time} type="button" onClick={() => setSelectedSlot(sl.time)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${selectedSlot === sl.time ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'}`}
                    >
                      {fmt12(sl.time)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Patient details auto-fill */}
        <div className="bg-green-50 border border-green-100 rounded-xl p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            <span className="text-xs font-semibold text-green-700">Patient details auto-filled</span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600">
            <span className="text-gray-400">Name</span><span className="font-medium text-gray-800">{patientData?.name || '—'}</span>
            <span className="text-gray-400">Gender</span><span className="font-medium text-gray-800 capitalize">{p?.gender?.toLowerCase() || '—'}</span>
            {age && <><span className="text-gray-400">Age</span><span className="font-medium text-gray-800">{age} yrs</span></>}
            {(p?.city) && <><span className="text-gray-400">City</span><span className="font-medium text-gray-800">{p.city}</span></>}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide" htmlFor="bam-symptoms">
            Symptoms / Reason <span className="font-normal lowercase text-gray-400">(optional)</span>
          </label>
          <textarea id="bam-symptoms" className="mt-1.5 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            rows={2} maxLength={500} placeholder="Describe symptoms or reason for visit..."
            value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
        </div>

        {/* Payment summary */}
        <div className={`rounded-xl p-4 space-y-2 ${isFreeEligible ? 'bg-emerald-50 border border-emerald-200' : 'bg-gray-50 border border-gray-200'}`}>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Payment Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Platform Booking Fee</span>
            {isFreeEligible ? (
              <span className="flex items-center gap-1.5"><span className="line-through text-gray-300 text-xs">₹10</span><span className="font-bold text-emerald-700">FREE</span></span>
            ) : (
              <span className="font-semibold text-gray-800">₹10</span>
            )}
          </div>
          <div className={`border-t pt-2 flex justify-between font-bold text-base ${isFreeEligible ? 'border-emerald-200' : 'border-gray-200'}`}>
            <span>Pay Now</span>
            <span className={isFreeEligible ? 'text-emerald-700' : 'text-blue-600'}>{isFreeEligible ? '₹0' : '₹10'}</span>
          </div>
          {isFreeEligible && <p className="text-xs text-emerald-600 font-medium">🎁 First booking benefit applied automatically</p>}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={!canSubmit}
            className={`flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isFreeEligible ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center gap-2"><LoadingSpinner size="sm" /> Processing...</span>
            ) : !date ? 'Select a date' : sessions.length > 0 && !selectedSession ? 'Select a session' : isFreeEligible ? '✅ Confirm Free Booking' : '💳 Pay ₹10 & Confirm'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BookAppointmentModal;
