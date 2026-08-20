/**
 * Breaks Section Component
 * Manage clinic breaks (lunch, tea breaks, etc.)
 */

import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Plus, Edit2, Trash2, Coffee, Clock } from 'lucide-react';
import * as scheduleApi from '../../../api/clinicSchedule.api';

const BreaksSection = ({ clinicId, breaks, onUpdate, daysOfWeek }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingBreak, setEditingBreak] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    applicableDays: [1, 2, 3, 4, 5, 6],
  });

  const handleAdd = () => {
    setEditingBreak(null);
    setFormData({
      name: '',
      startTime: '',
      endTime: '',
      applicableDays: [1, 2, 3, 4, 5, 6],
    });
    setShowModal(true);
  };

  const handleEdit = (breakItem) => {
    setEditingBreak(breakItem);
    setFormData({
      name: breakItem.name,
      startTime: breakItem.startTime,
      endTime: breakItem.endTime,
      applicableDays: breakItem.applicableDays,
    });
    setShowModal(true);
  };

  const handleDelete = async (breakId) => {
    if (!window.confirm('Are you sure you want to delete this break?')) return;

    try {
      await scheduleApi.deleteBreak(clinicId, breakId);
      toast.success('Break deleted successfully');
      onUpdate();
    } catch (error) {
      console.error('Error deleting break:', error);
      toast.error('Failed to delete break');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingBreak) {
        await scheduleApi.updateBreak(clinicId, editingBreak.id, formData);
        toast.success('Break updated successfully');
      } else {
        await scheduleApi.createBreak(clinicId, formData);
        toast.success('Break created successfully');
      }
      setShowModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error saving break:', error);
      toast.error('Failed to save break');
    }
  };

  const toggleDay = (dayValue) => {
    const newDays = formData.applicableDays.includes(dayValue)
      ? formData.applicableDays.filter((d) => d !== dayValue)
      : [...formData.applicableDays, dayValue];
    setFormData({ ...formData, applicableDays: newDays });
  };

  const getDayLabel = (dayValue) => {
    return daysOfWeek.find((d) => d.value === dayValue)?.label || '';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Breaks</h3>
          <p className="text-sm text-gray-600 mt-1">
            Set lunch breaks, tea breaks, or other daily breaks
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Break
        </button>
      </div>

      {/* Breaks List */}
      {breaks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <Coffee className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No breaks configured</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding your first break.
          </p>
          <div className="mt-6">
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Break
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {breaks.map((breakItem) => (
            <div
              key={breakItem.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Coffee className="w-5 h-5 text-orange-600 mr-2" />
                    <h4 className="text-sm font-semibold text-gray-900">
                      {breakItem.name}
                    </h4>
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        breakItem.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {breakItem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    {breakItem.startTime} – {breakItem.endTime}
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">Applicable on:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {breakItem.applicableDays.map((day) => (
                        <span
                          key={day}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {getDayLabel(day).substring(0, 3)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(breakItem)}
                    className="p-1 text-gray-400 hover:text-indigo-600"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(breakItem.id)}
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
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingBreak ? 'Edit Break' : 'Add New Break'}
                </h3>
              </div>

              <div className="px-6 py-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Break Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Lunch Break"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Applicable Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Applicable Days *
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => toggleDay(day.value)}
                        className={`py-2 px-1 text-xs font-medium rounded-md border ${
                          formData.applicableDays.includes(day.value)
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {day.label.substring(0, 3)}
                      </button>
                    ))}
                  </div>
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
                  {editingBreak ? 'Update' : 'Create'} Break
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreaksSection;
