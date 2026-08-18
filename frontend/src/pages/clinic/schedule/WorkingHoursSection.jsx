/**
 * Working Hours Section Component
 * Manage weekly clinic working hours with morning and evening sessions
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Edit2, Save, X, Copy, CheckCircle, XCircle } from 'lucide-react';
import * as scheduleApi from '../../../api/clinicSchedule.api';

const WorkingHoursSection = ({ clinicId, workingHours, onUpdate, daysOfWeek }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedHours, setEditedHours] = useState([]);
  const [saving, setSaving] = useState(false);

  const handleEdit = () => {
    setEditedHours(JSON.parse(JSON.stringify(workingHours)));
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedHours([]);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await scheduleApi.updateWorkingHours(clinicId, editedHours);
      toast.success('Working hours updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating working hours:', error);
      toast.error('Failed to update working hours');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyMonday = async () => {
    try {
      const targetDays = [2, 3, 4, 5, 6]; // Tuesday to Saturday
      await scheduleApi.copyMondayToAll(clinicId, targetDays);
      toast.success('Monday schedule copied to other days');
      onUpdate();
    } catch (error) {
      console.error('Error copying schedule:', error);
      toast.error('Failed to copy schedule');
    }
  };

  const updateDaySchedule = (dayOfWeek, field, value) => {
    const updated = editedHours.map((day) =>
      day.dayOfWeek === dayOfWeek ? { ...day, [field]: value } : day
    );
    setEditedHours(updated);
  };

  const getDayData = (dayOfWeek) => {
    const data = isEditing
      ? editedHours.find((h) => h.dayOfWeek === dayOfWeek)
      : workingHours.find((h) => h.dayOfWeek === dayOfWeek);
    
    return data || {
      dayOfWeek,
      isOpen: false,
      morningStartTime: '',
      morningEndTime: '',
      eveningStartTime: '',
      eveningEndTime: '',
    };
  };

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Weekly Working Hours
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Set your regular clinic working hours for each day
          </p>
        </div>
        
        <div className="flex space-x-3">
          {!isEditing ? (
            <>
              <button
                onClick={handleCopyMonday}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Monday to All
              </button>
              <button
                onClick={handleEdit}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Schedule
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Schedule Table */}
      <div className="overflow-hidden border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Day
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Morning Session
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Evening Session
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              {isEditing && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {daysOfWeek.map((day) => {
              const dayData = getDayData(day.value);
              
              return (
                <tr key={day.value} className={!dayData.isOpen ? 'bg-gray-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {day.label}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <input
                          type="time"
                          value={dayData.morningStartTime || ''}
                          onChange={(e) =>
                            updateDaySchedule(day.value, 'morningStartTime', e.target.value)
                          }
                          className="block w-28 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={!dayData.isOpen}
                        />
                        <span className="text-gray-500">–</span>
                        <input
                          type="time"
                          value={dayData.morningEndTime || ''}
                          onChange={(e) =>
                            updateDaySchedule(day.value, 'morningEndTime', e.target.value)
                          }
                          className="block w-28 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={!dayData.isOpen}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {dayData.morningStartTime && dayData.morningEndTime
                          ? `${dayData.morningStartTime} – ${dayData.morningEndTime}`
                          : '—'}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <div className="flex space-x-2">
                        <input
                          type="time"
                          value={dayData.eveningStartTime || ''}
                          onChange={(e) =>
                            updateDaySchedule(day.value, 'eveningStartTime', e.target.value)
                          }
                          className="block w-28 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={!dayData.isOpen}
                        />
                        <span className="text-gray-500">–</span>
                        <input
                          type="time"
                          value={dayData.eveningEndTime || ''}
                          onChange={(e) =>
                            updateDaySchedule(day.value, 'eveningEndTime', e.target.value)
                          }
                          className="block w-28 text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                          disabled={!dayData.isOpen}
                        />
                      </div>
                    ) : (
                      <div className="text-sm text-gray-900">
                        {dayData.eveningStartTime && dayData.eveningEndTime
                          ? `${dayData.eveningStartTime} – ${dayData.eveningEndTime}`
                          : '—'}
                      </div>
                    )}
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    {isEditing ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={dayData.isOpen}
                          onChange={(e) =>
                            updateDaySchedule(day.value, 'isOpen', e.target.checked)
                          }
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {dayData.isOpen ? 'Open' : 'Closed'}
                        </span>
                      </label>
                    ) : (
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          dayData.isOpen
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {dayData.isOpen ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Open
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Closed
                          </>
                        )}
                      </span>
                    )}
                  </td>
                  
                  {isEditing && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {day.value === 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const mondayData = getDayData(1);
                            const targetDays = [2, 3, 4, 5, 6];
                            const updated = editedHours.map((h) =>
                              targetDays.includes(h.dayOfWeek)
                                ? {
                                    ...h,
                                    isOpen: mondayData.isOpen,
                                    morningStartTime: mondayData.morningStartTime,
                                    morningEndTime: mondayData.morningEndTime,
                                    eveningStartTime: mondayData.eveningStartTime,
                                    eveningEndTime: mondayData.eveningEndTime,
                                  }
                                : h
                            );
                            setEditedHours(updated);
                            toast.success('Copied to Tue-Sat');
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Copy to all →
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Doctor availability must be within the clinic's working hours.
          Make sure to coordinate with your doctors when changing clinic timings.
        </p>
      </div>
    </div>
  );
};

export default WorkingHoursSection;
