/**
 * Clinic Schedule & Timings Page
 * Complete schedule management system for clinic owners
 * 
 * Features:
 * - Weekly working hours management
 * - Breaks configuration
 * - Holidays & special closures
 * - Special hours override
 * - Temporary closure
 * - Today's schedule view with doctor availability
 * - Real-time clinic status
 */

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  Edit2,
  Plus,
  Copy,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Coffee,
  Sun,
  Moon,
  Info,
  Users,
  Activity,
  TrendingUp,
} from 'lucide-react';
import * as scheduleApi from '../../api/clinicSchedule.api';

// Import sub-components
import WorkingHoursSection from './schedule/WorkingHoursSection';
import BreaksSection from './schedule/BreaksSection';
import HolidaysSection from './schedule/HolidaysSection';
import SpecialHoursSection from './schedule/SpecialHoursSection';
import TemporaryClosureSection from './schedule/TemporaryClosureSection';
import TodayScheduleCard from './schedule/TodayScheduleCard';
import DoctorScheduleCard from './schedule/DoctorScheduleCard';

const ClinicSchedulePage = () => {
  const { clinicId } = useParams();
  
  // State management
  const [activeTab, setActiveTab] = useState('working-hours');
  const [loading, setLoading] = useState(true);
  const [clinicStatus, setClinicStatus] = useState(null);
  const [todaySchedule, setTodaySchedule] = useState(null);
  const [workingHours, setWorkingHours] = useState([]);
  const [breaks, setBreaks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [specialHours, setSpecialHours] = useState([]);
  const [temporaryClosure, setTemporaryClosure] = useState(null);

  // Days of week mapping
  const daysOfWeek = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  // Load all data on mount
  useEffect(() => {
    if (clinicId) {
      loadAllData();
      // Refresh clinic status every minute
      const interval = setInterval(loadClinicStatus, 60000);
      return () => clearInterval(interval);
    }
  }, [clinicId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadClinicStatus(),
        loadTodaySchedule(),
        loadWorkingHours(),
        loadBreaks(),
        loadHolidays(),
        loadSpecialHours(),
        loadTemporaryClosure(),
      ]);
    } catch (error) {
      console.error('Error loading schedule data:', error);
      toast.error('Failed to load schedule data');
    } finally {
      setLoading(false);
    }
  };

  const loadClinicStatus = async () => {
    try {
      const response = await scheduleApi.getClinicStatus(clinicId);
      setClinicStatus(response.data);
    } catch (error) {
      console.error('Error loading clinic status:', error);
    }
  };

  const loadTodaySchedule = async () => {
    try {
      const response = await scheduleApi.getTodaySchedule(clinicId);
      setTodaySchedule(response.data);
    } catch (error) {
      console.error('Error loading today schedule:', error);
    }
  };

  const loadWorkingHours = async () => {
    try {
      const response = await scheduleApi.getWorkingHours(clinicId);
      setWorkingHours(response.data);
    } catch (error) {
      console.error('Error loading working hours:', error);
    }
  };

  const loadBreaks = async () => {
    try {
      const response = await scheduleApi.getBreaks(clinicId);
      setBreaks(response.data);
    } catch (error) {
      console.error('Error loading breaks:', error);
    }
  };

  const loadHolidays = async () => {
    try {
      const today = new Date();
      const threeMonthsLater = new Date();
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
      
      const response = await scheduleApi.getHolidays(clinicId, {
        startDate: today.toISOString().split('T')[0],
        endDate: threeMonthsLater.toISOString().split('T')[0],
      });
      setHolidays(response.data);
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const loadSpecialHours = async () => {
    try {
      const today = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      
      const response = await scheduleApi.getSpecialHours(clinicId, {
        startDate: today.toISOString().split('T')[0],
        endDate: oneMonthLater.toISOString().split('T')[0],
      });
      setSpecialHours(response.data);
    } catch (error) {
      console.error('Error loading special hours:', error);
    }
  };

  const loadTemporaryClosure = async () => {
    try {
      const response = await scheduleApi.getTemporaryClosure(clinicId);
      setTemporaryClosure(response.data);
    } catch (error) {
      console.error('Error loading temporary closure:', error);
    }
  };

  // Tab configuration
  const tabs = [
    { id: 'working-hours', label: 'Working Hours', icon: Clock },
    { id: 'breaks', label: 'Breaks', icon: Coffee },
    { id: 'holidays', label: 'Holidays', icon: Calendar },
    { id: 'special-hours', label: 'Special Hours', icon: Sun },
    { id: 'temporary-closure', label: 'Temporary Closure', icon: AlertCircle },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Clinic Schedule & Timings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your clinic's operating hours, breaks, and holidays
              </p>
            </div>
            
            {/* Clinic Status Badge */}
            {clinicStatus && (
              <div className="flex items-center space-x-3">
                <div className={`flex items-center px-4 py-2 rounded-lg ${
                  clinicStatus.isOpen
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {clinicStatus.isOpen ? (
                    <CheckCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 mr-2" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {clinicStatus.isOpen ? 'Open Now' : 'Closed'}
                    </div>
                    {clinicStatus.schedule && (
                      <div className="text-xs">
                        {clinicStatus.schedule.morningSession || 
                         clinicStatus.schedule.eveningSession}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule Card */}
            <TodayScheduleCard
              clinicStatus={clinicStatus}
              todaySchedule={todaySchedule}
              onRefresh={loadTodaySchedule}
            />

            {/* Tabs Navigation */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                          activeTab === tab.id
                            ? 'border-indigo-600 text-indigo-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {tab.label}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'working-hours' && (
                  <WorkingHoursSection
                    clinicId={clinicId}
                    workingHours={workingHours}
                    onUpdate={loadWorkingHours}
                    daysOfWeek={daysOfWeek}
                  />
                )}

                {activeTab === 'breaks' && (
                  <BreaksSection
                    clinicId={clinicId}
                    breaks={breaks}
                    onUpdate={loadBreaks}
                    daysOfWeek={daysOfWeek}
                  />
                )}

                {activeTab === 'holidays' && (
                  <HolidaysSection
                    clinicId={clinicId}
                    holidays={holidays}
                    onUpdate={loadHolidays}
                  />
                )}

                {activeTab === 'special-hours' && (
                  <SpecialHoursSection
                    clinicId={clinicId}
                    specialHours={specialHours}
                    onUpdate={loadSpecialHours}
                  />
                )}

                {activeTab === 'temporary-closure' && (
                  <TemporaryClosureSection
                    clinicId={clinicId}
                    temporaryClosure={temporaryClosure}
                    onUpdate={() => {
                      loadTemporaryClosure();
                      loadClinicStatus();
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Doctor Schedules & Quick Stats */}
          <div className="space-y-6">
            {/* Doctors Today's Schedule */}
            <DoctorScheduleCard
              clinicId={clinicId}
              doctors={todaySchedule?.doctors || []}
            />

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Stats
              </h3>
              
              <div className="space-y-4">
                {/* Appointments Today */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                    <span className="text-sm text-gray-700">Appointments Today</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {todaySchedule?.stats?.appointmentsToday || 0}
                  </span>
                </div>

                {/* Patients in Queue */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-orange-600 mr-3" />
                    <span className="text-sm text-gray-700">Patients in Queue</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {todaySchedule?.stats?.patientsInQueue || 0}
                  </span>
                </div>

                {/* Doctors Available */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Activity className="w-5 h-5 text-green-600 mr-3" />
                    <span className="text-sm text-gray-700">Doctors Available</span>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {todaySchedule?.doctors?.filter(d => d.availability?.isAvailable).length || 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Next Closing Info */}
            {clinicStatus?.nextOpening && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Next Opening
                    </p>
                    <p className="text-sm text-blue-700 mt-1">
                      Clinic will reopen at {clinicStatus.nextOpening}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Helpful Tips */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                💡 Pro Tips
              </h4>
              <ul className="text-xs text-gray-600 space-y-2">
                <li>• Use "Copy Monday to All" to quickly set up your week</li>
                <li>• Set breaks to prevent appointment overlaps</li>
                <li>• Add public holidays in advance</li>
                <li>• Use special hours for extended days</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicSchedulePage;
