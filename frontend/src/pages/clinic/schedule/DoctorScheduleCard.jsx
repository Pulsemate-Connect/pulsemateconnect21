/**
 * Doctor Schedule Card Component
 * Display doctor availability for today
 */

import React from 'react';
import { Users, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const DoctorScheduleCard = ({ clinicId, doctors }) => {
  if (!doctors || doctors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Doctors Today</h3>
        </div>
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No doctor schedules available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Users className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">Doctors Today</h3>
        </div>
        <span className="text-sm text-gray-600">
          {doctors.filter(d => d.availability?.isAvailable).length} Available
        </span>
      </div>

      <div className="space-y-3">
        {doctors.map((doctor) => {
          const isAvailable = doctor.availability?.isAvailable;
          const schedule = doctor.availability?.schedule;

          return (
            <div
              key={doctor.id}
              className={`p-4 rounded-lg border ${
                isAvailable
                  ? 'bg-green-50 border-green-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    {isAvailable ? (
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                    )}
                    <h4 className="text-sm font-semibold text-gray-900">
                      {doctor.name}
                    </h4>
                  </div>
                  
                  {doctor.specialization && (
                    <p className="text-xs text-gray-600 mt-1 ml-6">
                      {doctor.specialization}
                    </p>
                  )}
                  
                  {schedule && (
                    <div className="mt-2 ml-6 space-y-1">
                      {schedule.morning && (
                        <div className="flex items-center text-xs text-gray-700">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Morning: {schedule.morning}</span>
                        </div>
                      )}
                      {schedule.evening && (
                        <div className="flex items-center text-xs text-gray-700">
                          <Clock className="w-3 h-3 mr-1" />
                          <span>Evening: {schedule.evening}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!isAvailable && doctor.availability?.reason && (
                    <div className="mt-2 ml-6 flex items-center text-xs text-gray-600">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      <span>{doctor.availability.reason}</span>
                    </div>
                  )}
                </div>
                
                <span
                  className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isAvailable
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>

              {/* Additional Stats */}
              {doctor.stats && isAvailable && (
                <div className="mt-3 pt-3 border-t border-green-200 grid grid-cols-2 gap-2">
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Appointments</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {doctor.stats.appointmentsToday || 0}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-gray-600">Patients Seen</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {doctor.stats.patientsSeen || 0}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-600">Total</p>
            <p className="text-lg font-bold text-gray-900">{doctors.length}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Available</p>
            <p className="text-lg font-bold text-green-600">
              {doctors.filter(d => d.availability?.isAvailable).length}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Off</p>
            <p className="text-lg font-bold text-gray-600">
              {doctors.filter(d => !d.availability?.isAvailable).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorScheduleCard;
