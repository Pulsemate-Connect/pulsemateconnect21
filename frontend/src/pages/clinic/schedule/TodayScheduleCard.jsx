/**
 * Today Schedule Card Component
 * Display today's schedule summary with real-time status
 */

import React from 'react';
import { Calendar, Clock, Users, Activity, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

const TodayScheduleCard = ({ clinicStatus, todaySchedule, onRefresh }) => {
  const formatTime = (time) => {
    if (!time) return '--';
    return time;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Calendar className="w-6 h-6 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Today's Schedule</h2>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
        
        <button
          onClick={onRefresh}
          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-white rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Clinic Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className={`p-4 rounded-lg ${
          clinicStatus?.isOpen
            ? 'bg-green-100 border border-green-300'
            : 'bg-red-100 border border-red-300'
        }`}>
          <div className="flex items-center mb-2">
            {clinicStatus?.isOpen ? (
              <CheckCircle className="w-5 h-5 text-green-700 mr-2" />
            ) : (
              <XCircle className="w-5 h-5 text-red-700 mr-2" />
            )}
            <span className={`font-semibold ${
              clinicStatus?.isOpen ? 'text-green-900' : 'text-red-900'
            }`}>
              {clinicStatus?.isOpen ? 'Clinic Open' : 'Clinic Closed'}
            </span>
          </div>
          
          {clinicStatus?.schedule && (
            <div className={`text-sm ${
              clinicStatus?.isOpen ? 'text-green-800' : 'text-red-800'
            }`}>
              {clinicStatus.schedule.morningSession && (
                <div>☀️ Morning: {clinicStatus.schedule.morningSession}</div>
              )}
              {clinicStatus.schedule.eveningSession && (
                <div>🌙 Evening: {clinicStatus.schedule.eveningSession}</div>
              )}
            </div>
          )}
          
          {clinicStatus?.nextOpening && !clinicStatus?.isOpen && (
            <div className="mt-2 text-xs text-red-700">
              Opens at: {clinicStatus.nextOpening}
            </div>
          )}
        </div>

        <div className="p-4 bg-white rounded-lg border border-gray-200">
          <div className="flex items-center mb-2">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold text-gray-900">Current Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {todaySchedule && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Appointments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todaySchedule.stats?.appointmentsToday || 0}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">In Queue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todaySchedule.stats?.patientsInQueue || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-orange-600 opacity-50" />
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600 mb-1">Doctors</p>
                <p className="text-2xl font-bold text-gray-900">
                  {todaySchedule.doctors?.filter(d => d.availability?.isAvailable).length || 0}
                  <span className="text-sm text-gray-500">
                    /{todaySchedule.doctors?.length || 0}
                  </span>
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Break Info */}
      {todaySchedule?.currentBreak && (
        <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
          <div className="flex items-center">
            <Clock className="w-4 h-4 text-yellow-700 mr-2" />
            <span className="text-sm text-yellow-800">
              <strong>Currently on {todaySchedule.currentBreak.name}:</strong>{' '}
              {todaySchedule.currentBreak.startTime} – {todaySchedule.currentBreak.endTime}
            </span>
          </div>
        </div>
      )}

      {/* Temporary Closure Warning */}
      {clinicStatus?.temporaryClosure?.isActive && (
        <div className="mt-4 bg-red-50 border border-red-300 rounded-lg p-3">
          <div className="flex items-start">
            <XCircle className="w-5 h-5 text-red-700 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-900">Temporary Closure Active</p>
              <p className="text-xs text-red-700 mt-1">
                {clinicStatus.temporaryClosure.reason}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayScheduleCard;
