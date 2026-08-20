import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, Users, Activity, TrendingUp, 
  AlertCircle, ChevronRight, Bell
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/axios';

/**
 * Main Clinic Dashboard - Overview with key metrics and quick actions
 */
const ClinicDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    clinicStatus: 'open',
    currentSession: { start: '9:00 AM', end: '1:00 PM' },
    nextSession: { start: '4:00 PM', end: '8:00 PM' },
    todayAppointments: { upcoming: 12, completed: 6, total: 18 },
    queueStats: { waiting: 16, inConsultation: 8, total: 24 },
    avgWaitTime: { current: 22, yesterday: 19, change: 3 },
    doctorsAvailable: { available: 3, total: 5, onLeave: 1, unavailable: 1 },
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // const response = await api.get('/clinic/dashboard');
      // setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const StatusCard = ({ icon: Icon, title, value, subtitle, status, onClick }) => (
    <div 
      className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${
          status === 'open' ? 'bg-green-50' :
          status === 'closed' ? 'bg-red-50' :
          status === 'warning' ? 'bg-yellow-50' :
          'bg-blue-50'
        }`}>
          <Icon className={`w-6 h-6 ${
            status === 'open' ? 'text-green-600' :
            status === 'closed' ? 'text-red-600' :
            status === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          }`} />
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </div>
      
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-sm text-gray-500">{subtitle}</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Good morning, Clinic Owner 👋</h1>
              <p className="text-sm text-gray-600 mt-1">Here's what's happening at your clinic today.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Clinic Open</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>10:15 AM</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Sun, 17 Aug 2026</span>
              </div>
              <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatusCard
            icon={Activity}
            title="Clinic Status"
            value="Open Now"
            subtitle={`${dashboardData.currentSession.start} – ${dashboardData.currentSession.end}`}
            status="open"
            onClick={() => navigate('/clinic/schedule')}
          />
          
          <StatusCard
            icon={Calendar}
            title="Today's Appointments"
            value={dashboardData.todayAppointments.total}
            subtitle={`Upcoming: ${dashboardData.todayAppointments.upcoming} | Completed: ${dashboardData.todayAppointments.completed}`}
            status="info"
            onClick={() => navigate('/clinic/appointments')}
          />
          
          <StatusCard
            icon={Users}
            title="Patients in Queue"
            value={dashboardData.queueStats.total}
            subtitle={`Waiting: ${dashboardData.queueStats.waiting} | In Consultation: ${dashboardData.queueStats.inConsultation}`}
            status="info"
            onClick={() => navigate('/clinic/queue')}
          />
          
          <StatusCard
            icon={Clock}
            title="Avg. Wait Time"
            value={`${dashboardData.avgWaitTime.current} mins`}
            subtitle={`Yesterday: ${dashboardData.avgWaitTime.yesterday} mins | ${dashboardData.avgWaitTime.change > 0 ? '+' : ''}${dashboardData.avgWaitTime.change} mins`}
            status={dashboardData.avgWaitTime.change > 5 ? 'warning' : 'info'}
            onClick={() => navigate('/clinic/queue/report')}
          />
        </div>

        {/* Doctors Available Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Doctors Available</h3>
            <button 
              onClick={() => navigate('/clinic/doctors')}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              View Doctors
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-gray-900">
              {dashboardData.doctorsAvailable.available} <span className="text-gray-400">/ {dashboardData.doctorsAvailable.total}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>On Leave: {dashboardData.doctorsAvailable.onLeave}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                <span>Unavailable: {dashboardData.doctorsAvailable.unavailable}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Next Session Alert */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-4 mb-6">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">
              Next session: {dashboardData.nextSession.start} – {dashboardData.nextSession.end}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Clinic will close in 1 h 45 m
            </p>
          </div>
          <button 
            onClick={() => navigate('/clinic/schedule/temporary-closure')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Temporary Close
          </button>
        </div>

        {/* Today's Schedule Preview */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Today's Schedule (Sunday, 17 Aug 2026)</h3>
            <button 
              onClick={() => navigate('/clinic/schedule')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Edit Schedule
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Open</p>
                <p className="text-xs text-gray-600">9:00 AM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Morning Session</p>
                <p className="text-xs text-gray-600">9:00 AM – 1:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-orange-50 rounded-lg">
              <Clock className="w-4 h-4 text-orange-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Lunch Break</p>
                <p className="text-xs text-gray-600">1:00 PM – 4:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <Clock className="w-4 h-4 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Evening Session</p>
                <p className="text-xs text-gray-600">4:00 PM – 8:00 PM</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-red-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Close</p>
                <p className="text-xs text-gray-600">8:00 PM</p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-500">
              <AlertCircle className="w-3 h-3 inline mr-1" />
              Clinic will close in <span className="font-medium">9 h 45 m</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicDashboard;
