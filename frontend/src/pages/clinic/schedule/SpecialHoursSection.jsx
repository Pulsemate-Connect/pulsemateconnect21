/**
 * Special Hours Section Component
 * Override regular schedule for specific dates
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Sun, Clock } from 'lucide-react';
import * as scheduleApi from '../../../api/clinicSchedule.api';

const SpecialHoursSection = ({ clinicId, specialHours, onUpdate }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingSpecialHour, setEditingSpecialHour] = useState(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    morningStartTime: '',
    morningEndTime: '',
    eveningStartTime: '',
    eveningEndTime: '',
    isClosed: false,
  });

  const handleAdd = () => {
    setEditingSpecialHour(null);
    setFormData({
      date: '',
      name: '',
      morningStartTime: '',
      morningEndTime: '',
      eveningStartTime: '',
      eveningEndTime: '',
      isClosed: false,
    });
    setShowModal(true);
  };

  const handleEdit = (specialHour) => {
    setEditingSpecialHour(specialHour);
    setFormData({
      date: specialHour.date.split('T')[0],
      name: specialHour.name || '',
      morningStartTime: specialHour.morningStartTime || '',
      morningEndTime: specialHour.morningEndTime || '',
      eveningStartTime: specialHour.eveningStartTime || '',
      eveningEndTime: specialHour.eveningEndTime || '',
      isClosed: specialHour.isClosed,
    });
    setShowModal(true);
  };

  const handleDelete = async (specialHourId) => {
    if (!window.confirm('Are you sure you want to delete this special hour?')) return;

    try {
      await scheduleApi.deleteSpecialHours(clinicId, specialHourId);
      toast.success('Special hours deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting special hours:', error);
      toast.error('Failed to delete special hours');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.isClosed) {
      const hasMorning = formData.morningStartTime && formData.morningEndTime;
      const hasEvening = formData.eveningStartTime && formData.eveningEndTime;
      
      if (!hasMorning && !hasEvening) {
        toast.error('Please specify at least morning or evening hours, or mark as closed');
        return;
      }
    }

    try {
      if (editingSpecialHour) {
        await scheduleApi.updateSpecialHours(clinicId, editingSpecialHour.id, formData);
        toast.success('Special hours updated successfully');
      } else {
        await scheduleApi.createSpecialHours(clinicId, formData);
        toast.success('Special hours created successfully');
      }
      setShowModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving special hours:', error);
      toast.error('Failed to save special hours');
    }
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

  const sortedSpecialHours = [...specialHours].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Special Hours</h3>
          <p className="text-sm text-gray-600 mt-1">
            Override regular schedule for specific dates
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Special Hours
        </button>
      </div>

      {/* Special Hours List */}
      {sortedSpecialHours.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Sun className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No special hours configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Add special hours for extended days or modified schedules.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSpecialHours.map((specialHour) => (
            <div
              key={specialHour.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Sun className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      {formatDate(specialHour.date)}
                    </h4>
                    {specialHour.isClosed && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                        Closed
                      </span>
                    )}
                  </div>
                  
                  {specialHour.name && (
                    <div className="mt-2 text-sm text-gray-600">
                      {specialHour.name}
                    </div>
                  )}
                  
                  {!specialHour.isClosed && (
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      {specialHour.morningStartTime && specialHour.morningEndTime && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="font-medium">Morning:</span>
                          <span className="ml-1">
                            {specialHour.morningStartTime} – {specialHour.morningEndTime}
                          </span>
                        </div>
                      )}
                      {specialHour.eveningStartTime && specialHour.eveningEndTime && (
                        <div className="flex items-center text-sm text-gray-700">
                          <Clock className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="font-medium">Evening:</span>
                          <span className="ml-1">
                            {specialHour.eveningStartTime} – {specialHour.eveningEndTime}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(specialHour)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(specialHour.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingSpecialHour ? 'Edit Special Hours' : 'Add Special Hours'}
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

                {/* Name/Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Extended hours for special event"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Is Closed Checkbox */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isClosed"
                    checked={formData.isClosed}
                    onChange={(e) =>
                      setFormData({ ...formData, isClosed: e.target.checked })
                    }
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <label htmlFor="isClosed" className="ml-2 text-sm text-gray-700">
                    Clinic will be closed on this date
                  </label>
                </div>

                {/* Morning Session */}
                {!formData.isClosed && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Morning Session
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={formData.morningStartTime}
                            onChange={(e) =>
                              setFormData({ ...formData, morningStartTime: e.target.value })
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Time</label>
                          <input
                            type="time"
                            value={formData.morningEndTime}
                            onChange={(e) =>
                              setFormData({ ...formData, morningEndTime: e.target.value })
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Evening Session */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Evening Session
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                          <input
                            type="time"
                            value={formData.eveningStartTime}
                            onChange={(e) =>
                              setFormData({ ...formData, eveningStartTime: e.target.value })
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">End Time</label>
                          <input
                            type="time"
                            value={formData.eveningEndTime}
                            onChange={(e) =>
                              setFormData({ ...formData, eveningEndTime: e.target.value })
                            }
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Info Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Note:</strong> Special hours override your regular weekly schedule for the selected date only.
                  </p>
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
                  {editingSpecialHour ? 'Update' : 'Create'} Special Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialHoursSection;
