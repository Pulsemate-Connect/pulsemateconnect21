/**
 * Temporary Closure Section Component
 * Manage temporary clinic closures
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { AlertCircle, XCircle, CheckCircle } from 'lucide-react';
import * as scheduleApi from '../../../api/clinicSchedule.api';

const TemporaryClosureSection = ({ clinicId, temporaryClosure, onUpdate }) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClose = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('Please provide a reason for closure');
      return;
    }

    setLoading(true);
    try {
      await scheduleApi.createTemporaryClosure(clinicId, reason);
      toast.success('Clinic closed temporarily');
      setReason('');
      onUpdate();
    } catch (error) {
      console.error('Error closing clinic:', error);
      toast.error('Failed to close clinic');
    } finally {
      setLoading(false);
    }
  };

  const handleReopen = async () => {
    if (!window.confirm('Are you sure you want to reopen the clinic?')) return;

    setLoading(true);
    try {
      await scheduleApi.reopenClinic(clinicId);
      toast.success('Clinic reopened successfully');
      onUpdate();
    } catch (error) {
      console.error('Error reopening clinic:', error);
      toast.error('Failed to reopen clinic');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Temporary Closure</h3>
        <p className="text-sm text-gray-600 mt-1">
          Temporarily close your clinic for emergencies or other reasons
        </p>
      </div>

      {/* Current Status */}
      {temporaryClosure && temporaryClosure.isActive ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <XCircle className="w-6 h-6 text-red-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-red-900">
                Clinic is Currently Closed
              </h4>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-red-800">
                  <strong>Reason:</strong> {temporaryClosure.reason}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Closed Since:</strong> {formatDateTime(temporaryClosure.startTime)}
                </p>
                {temporaryClosure.creator && (
                  <p className="text-sm text-red-800">
                    <strong>Closed By:</strong> {temporaryClosure.creator.name}
                  </p>
                )}
              </div>
              
              <div className="mt-4">
                <button
                  onClick={handleReopen}
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {loading ? 'Reopening...' : 'Reopen Clinic Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-start">
            <CheckCircle className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-lg font-semibold text-green-900">
                No Active Temporary Closure
              </h4>
              <p className="mt-1 text-sm text-green-800">
                Your clinic is operating normally according to your schedule.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close Clinic Form */}
      {(!temporaryClosure || !temporaryClosure.isActive) && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <form onSubmit={handleClose} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Temporary Closure *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder="e.g., Emergency maintenance, Staff shortage, Weather conditions..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium">Important Notice:</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Patients will see the clinic as closed</li>
                    <li>No new appointments can be booked</li>
                    <li>Existing appointments should be rescheduled</li>
                    <li>You can reopen anytime</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5 mr-2" />
              {loading ? 'Closing Clinic...' : 'Close Clinic Temporarily'}
            </button>
          </form>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>When to use temporary closure:</strong> Use this feature for unexpected
          situations like emergencies, power outages, or staff unavailability. For planned
          closures, use the Holidays feature instead.
        </p>
      </div>
    </div>
  );
};

export default TemporaryClosureSection;
