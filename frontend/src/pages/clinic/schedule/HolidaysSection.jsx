/**
 * Holidays Section Component
 * Manage clinic holidays and special closures
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Calendar, AlertCircle } from 'lucide-react';
import * as scheduleApi from '../../../api/clinicSchedule.api';

const HolidaysSection = ({ clinicId, holidays, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    type: 'PUBLIC_HOLIDAY',
    reason: '',
    isRecurring: false,
  });

  const holidayTypes = [
    { value: 'PUBLIC_HOLIDAY', label: 'Public Holiday', color: 'blue' },
    { value: 'CLINIC_HOLIDAY', label: 'Clinic Holiday', color: 'green' },
    { value: 'DOCTOR_UNAVAILABLE', label: 'Doctor Unavailable', color: 'yellow' },
    { value: 'EMERGENCY_CLOSURE', label: 'Emergency Closure', color: 'red' },
    { value: 'CUSTOM', label: 'Custom', color: 'gray' },
  ];

  const handleAdd = () => {
    setEditingHoliday(null);
    setFormData({
      date: '',
      name: '',
      type: 'PUBLIC_HOLIDAY',
      reason: '',
      isRecurring: false,
    });
    setShowModal(true);
  };

  const handleEdit = (holiday) => {
    setEditingHoliday(holiday);
    setFormData({
      date: holiday.date.split('T')[0],
      name: holiday.name,
      type: holiday.type,
      reason: holiday.reason || '',
      isRecurring: holiday.isRecurring,
    });
    setShowModal(true);
  };

  const handleDelete = async (holidayId) => {
    if (!window.confirm('Are you sure you want to delete this holiday?')) return;

    try {
      await scheduleApi.deleteHoliday(clinicId, holidayId);
      toast.success('Holiday deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast.error('Failed to delete holiday');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingHoliday) {
        await scheduleApi.updateHoliday(clinicId, editingHoliday.id, formData);
        toast.success('Holiday updated successfully');
      } else {
        await scheduleApi.createHoliday(clinicId, formData);
        toast.success('Holiday created successfully');
      }
      setShowModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving holiday:', error);
      toast.error('Failed to save holiday');
    }
  };

  const getTypeConfig = (type) => {
    return holidayTypes.find((t) => t.value === type) || holidayTypes[0];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const sortedHolidays = [...holidays].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Holidays & Special Closures</h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage public holidays, clinic holidays, and special closures
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Holiday
        </button>
      </div>

      {/* Holidays List */}
      {sortedHolidays.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No holidays configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add public holidays and clinic closures.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedHolidays.map((holiday) => {
            const typeConfig = getTypeConfig(holiday.type);
            return (
              <div
                key={holiday.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <Calendar className={`w-5 h-5 text-${typeConfig.color}-600 mr-2`} />
                      <h4 className="text-sm font-semibold text-gray-900">
                        {holiday.name}
                      </h4>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-${typeConfig.color}-100 text-${typeConfig.color}-800`}
                      >
                        {typeConfig.label}
                      </span>
                      {holiday.isRecurring && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          Recurring
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      📅 {formatDate(holiday.date)}
                    </div>
                    
                    {holiday.reason && (
                      <div className="mt-2 text-sm text-gray-500">
                        {holiday.reason}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(holiday)}
                      className="p-1 text-gray-400 hover:text-indigo-600"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(holiday.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Holiday Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Independence Day"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    {holidayTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    rows={2}
                    placeholder="Additional details..."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Is Recurring */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) =>
                      setFormData({ ...formData, isRecurring: e.target.checked })
                    }
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700">
                    This holiday recurs annually
                  </label>
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                >
                  {editingHoliday ? 'Update' : 'Create'} Holiday
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HolidaysSection;
