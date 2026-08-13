import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClinicAuthModal from '../../components/modals/ClinicAuthModal';
import useAuthStore from '../../store/authStore';

const ClinicPartnerPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('register'); // 'login' | 'register'
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  // Scroll detection
  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleApplyClick = () => {
    setAuthMode('register');
    setShowAuthModal(true);
  };

  const handleLoginClick = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  const handleDashboard = () => {
    if (user?.role === 'CLINIC_OWNER') {
      navigate('/clinic/dashboard');
    }
    setShowProfileMenu(false);
  };

  const clinicTypes = [
    'Physiotherapy Clinics',
    'Orthopedic Clinics',
    'Eye Clinics',
    'Dental Clinics',
    'Multispecialty Clinics',
    'Rehabilitation Centres',
    'Other Healthcare Clinics',
  ];

  const faqs = [
    {
      question: 'What is PulseMate Connect?',
      answer:
        'PulseMate Connect is a comprehensive clinic management platform that helps clinics manage appointments, doctors, patient queues and patient connections from one unified platform.',
    },
    {
      question: 'Who can register their clinic?',
      answer:
        'Any licensed healthcare clinic or medical facility can register. This includes physiotherapy clinics, orthopedic clinics, multispecialty clinics, rehabilitation centres and other healthcare providers.',
    },
    {
      question: 'How long does verification take?',
      answer:
        'Once you submit all required documents, our team typically completes the verification process within 2-3 business days. You will receive email notifications about your verification status.',
    },
    {
      question: 'What documents are required?',
      answer:
        'You will need to provide clinic registration documents, owner identification, clinic address proof, and any relevant medical licenses. The exact requirements will be shown during the onboarding process.',
    },
    {
      question: 'Is there a fee to register?',
      answer:
        'Registration on PulseMate Connect is completely free. There are no upfront fees or hidden charges to create your clinic profile and start using the platform.',
    },
    {
      question: 'How can I get support during onboarding?',
      answer:
        'Our support team is available to help you through the onboarding process. You can reach us via email at support@pulsemateconnect.in or through the help section in your dashboard.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar - Fixed at top */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-sm' : 'bg-transparent shadow-none'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="flex flex-col">
                <span className="text-xl font-bold">
                  <span className={`transition-colors duration-300 ${isScrolled ? 'text-blue-600' : 'text-white'}`}>
                    PulseMate{' '}
                  </span>
                  <span className={`transition-colors duration-300 ${isScrolled ? 'text-green-600' : 'text-white'}`}>
                    Connect
                  </span>
                </span>
                <span
                  className={`text-xs text-center -mt-1 transition-colors duration-300 ${
                    isScrolled ? 'text-gray-500' : 'text-white/80'
                  }`}
                >
                  — Clinic Partner —
                </span>
              </div>
            </div>

            {/* Right Section - Login/Profile */}
            <div className="flex items-center">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                      isScrolled ? 'hover:bg-gray-100' : 'hover:bg-white/10'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold transition-colors duration-300 ${
                        isScrolled ? 'bg-blue-600 text-white' : 'bg-white text-blue-600'
                      }`}
                    >
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span
                      className={`font-medium hidden sm:block transition-colors duration-300 ${
                        isScrolled ? 'text-gray-700' : 'text-white'
                      }`}
                    >
                      {user.name}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-all duration-300 ${
                        isScrolled ? 'text-gray-500' : 'text-white/80'
                      } ${showProfileMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email || user.mobile}</p>
                      </div>
                      {user.role === 'CLINIC_OWNER' && (
                        <button
                          onClick={handleDashboard}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
                        >
                          Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleLoginClick}
                  className={`px-6 py-2 font-semibold border-2 rounded-lg transition-all duration-300 ${
                    isScrolled
                      ? 'text-blue-600 border-blue-600 hover:bg-blue-50'
                      : 'text-white border-white hover:bg-white hover:text-blue-600'
                  }`}
                >
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Add 10% padding left and right */}
      <section className="relative text-white overflow-hidden min-h-screen flex items-center bg-white px-[10vw]">
        {/* Background Image - Optimized loading */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url("/images/clinic-hero.jpg")',
            backgroundPosition: 'center calc(50% - 80px)',
            clipPath: 'inset(0 0 38px 0)',
          }}
          role="img"
          aria-label="Modern clinic interior"
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/30" style={{ clipPath: 'inset(0 0 38px 0)' }} />
        
        {/* Content with padding for fixed nav */}
        <div className="relative max-w-6xl mx-auto text-center z-10 w-full px-4 -mt-32">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 leading-tight md:leading-tight max-w-6xl mx-auto">
            <span className="block sm:inline">Partner with PulseMate Connect and</span><br className="hidden sm:block" />
            <span className="block sm:inline">Grow your clinic</span>
          </h1>
          <div className="flex justify-center">
            <button
              onClick={handleApplyClick}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
            >
              Register your clinic
            </button>
          </div>
        </div>
      </section>

      {/* Floating Onboarding Card - Overlaps Hero */}
      <div className="relative -mt-48 mb-12 px-4 sm:px-8 lg:px-[10vw] z-20">
        <div className="w-full md:w-[85%] lg:w-[75%] xl:w-[65%] mx-auto bg-white rounded-3xl shadow-2xl p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Content - 2 columns */}
            <div className="lg:col-span-2">
              <h2 
                className="font-bold text-left mb-1.5"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '28px',
                  fontWeight: 700,
                  lineHeight: '36px',
                  letterSpacing: '-0.3px',
                  color: '#111111'
                }}
              >
                Get started: It only takes 10 minutes
              </h2>
              <p 
                className="text-left mb-8"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '18px',
                  fontWeight: 400,
                  lineHeight: '26px',
                  letterSpacing: '0px',
                  color: '#8A8A8A'
                }}
              >
                Please keep these documents and details ready for a smooth sign-up
              </p>

              {/* 2-Column Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Clinic registration details</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Clinic PAN / business details</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">GST number, if applicable</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Clinic photos & logo</span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-600 rounded-full flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-gray-700">Clinic license</span>
                </div>
              </div>
            </div>

            {/* Right Content - Video Card */}
            <div className="lg:col-span-1 flex flex-col justify-center">
              <button
                onClick={() => setShowVideoModal(true)}
                className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl overflow-hidden relative aspect-video group cursor-pointer hover:shadow-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Watch clinic registration guide video"
              >
                {/* Video Thumbnail Background */}
                <div className="absolute inset-0 bg-blue-800 opacity-50"></div>
                
                {/* Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <svg className="w-6 sm:w-8 h-6 sm:h-8 text-blue-600 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                    </svg>
                  </div>
                </div>

                {/* Overlay Text */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-white font-semibold text-xs sm:text-sm">How to register your clinic</p>
                </div>
              </button>
              
              <button 
                onClick={() => setShowVideoModal(true)}
                className="mt-4 text-blue-600 font-medium flex items-center justify-center gap-2 hover:text-blue-700 transition focus:outline-none focus:underline"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section - Redesigned */}
      <section className="bg-white py-16">
        <div className="max-w-[1250px] mx-auto px-4 sm:px-8 lg:px-[10vw]">
          {/* Heading with Dividers */}
          <div className="flex items-center justify-center mb-14">
            <div className="flex-1 h-[1px] bg-[#B8BEC8]"></div>
            <h2 
              className="px-6 text-center whitespace-nowrap"
              style={{
                fontFamily: 'Roboto, sans-serif',
                fontSize: '40px',
                fontWeight: 700,
                lineHeight: '48px',
                color: '#111111'
              }}
            >
              Why should you partner with PulseMate Connect?
            </h2>
            <div className="flex-1 h-[1px] bg-[#B8BEC8]"></div>
          </div>

          {/* Three Benefit Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mt-14">
            {/* Column 1: Reach more patients */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <svg 
                className="mb-11" 
                width="52" 
                height="52" 
                viewBox="0 0 52 52" 
                fill="none" 
                stroke="#2F73E8" 
                strokeWidth="2.5"
              >
                <circle cx="26" cy="16" r="8" />
                <path d="M10 42c0-8.837 7.163-16 16-16s16 7.163 16 16" />
                <circle cx="40" cy="14" r="6" />
                <path d="M46 38c0-6.627-5.373-12-12-12" />
                <circle cx="12" cy="14" r="6" />
                <path d="M6 38c0-6.627 5.373-12 12-12" />
              </svg>
              
              <h3 
                className="mb-4.5"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '30px',
                  fontWeight: 600,
                  lineHeight: '38px',
                  color: '#304A70'
                }}
              >
                Reach more patients
              </h3>
              
              <p 
                className="max-w-[300px]"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '19px',
                  fontWeight: 400,
                  lineHeight: '30px',
                  color: '#667A9A'
                }}
              >
                Connect your clinic with patients searching for the right healthcare services in your area.
              </p>
            </div>

            {/* Column 2: Simplify clinic management */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <svg 
                className="mb-11" 
                width="52" 
                height="52" 
                viewBox="0 0 52 52" 
                fill="none" 
                stroke="#2F73E8" 
                strokeWidth="2.5"
              >
                <rect x="8" y="12" width="36" height="32" rx="2" />
                <path d="M8 22h36M20 12v-4M32 12v-4M18 30h8M18 36h16" />
                <circle cx="38" cy="33" r="2" fill="#2F73E8" />
              </svg>
              
              <h3 
                className="mb-4.5"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '30px',
                  fontWeight: 600,
                  lineHeight: '38px',
                  color: '#304A70'
                }}
              >
                Simplify clinic management
              </h3>
              
              <p 
                className="max-w-[300px]"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '19px',
                  fontWeight: 400,
                  lineHeight: '30px',
                  color: '#667A9A'
                }}
              >
                Manage appointments, doctors, and your live patient queue from one place.
              </p>
            </div>

            {/* Column 3: Grow your clinic */}
            <div className="flex flex-col items-center text-center">
              {/* Icon */}
              <svg 
                className="mb-11" 
                width="52" 
                height="52" 
                viewBox="0 0 52 52" 
                fill="none" 
                stroke="#2F73E8" 
                strokeWidth="2.5"
              >
                <path d="M10 42V28M18 42V22M26 42V16M34 42V26M42 42V20" />
                <path d="M8 20l8-8 8 8 8-12 12 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              <h3 
                className="mb-4.5"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '30px',
                  fontWeight: 600,
                  lineHeight: '38px',
                  color: '#304A70'
                }}
              >
                Grow your clinic
              </h3>
              
              <p 
                className="max-w-[300px]"
                style={{
                  fontFamily: 'Roboto, sans-serif',
                  fontSize: '19px',
                  fontWeight: 400,
                  lineHeight: '30px',
                  color: '#667A9A'
                }}
              >
                Build your digital presence and make it easier for patients to discover and book your clinic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - What our clinic partners say */}
      <section className="py-20 px-4 sm:px-8 lg:px-[10vw]" style={{ backgroundColor: '#EEF4FF' }}>
        <div className="max-w-[1250px] mx-auto">
          {/* Heading */}
          <h2 
            className="text-center mb-16"
            style={{
              fontFamily: 'Roboto, sans-serif',
              fontSize: '40px',
              fontWeight: 700,
              lineHeight: '48px',
              color: '#111111'
            }}
          >
            What our clinic partners say
          </h2>

          {/* Testimonial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Arjun */}
            <div 
              className="bg-white rounded-2xl p-6 flex flex-col justify-between"
              style={{ 
                borderRadius: '18px',
                minHeight: '300px'
              }}
            >
              <div>
                <p 
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 400,
                    lineHeight: '25px',
                    color: '#566B4A',
                    marginBottom: '35px'
                  }}
                >
                  "PulseMate Connect makes it easier for our patients to find the clinic and book appointments. The appointment and queue management features help us organize our daily consultations more efficiently."
                </p>
              </div>

              <div>
                <div style={{ height: '1px', backgroundColor: '#E5E9EF', marginBottom: '25px' }}></div>
                
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div 
                    className="flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center"
                    style={{ width: '56px', height: '56px' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F73E8" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  
                  <div>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '19px',
                        fontWeight: 600,
                        color: '#27344A',
                        marginBottom: '2px'
                      }}
                    >
                      Arjun
                    </p>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '15px',
                        fontWeight: 400,
                        color: '#8A94A6'
                      }}
                    >
                      Physiotherapist · Spine Clinic
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Pooja Nayak */}
            <div 
              className="bg-white rounded-2xl p-6 flex flex-col justify-between"
              style={{ 
                borderRadius: '18px',
                minHeight: '300px'
              }}
            >
              <div>
                <p 
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 400,
                    lineHeight: '25px',
                    color: '#566B4A',
                    marginBottom: '35px'
                  }}
                >
                  "PulseMate Connect gives us a simple way to manage patient appointments and improve the overall clinic experience. It helps reduce confusion around scheduling and makes the process more convenient for both patients and our team."
                </p>
              </div>

              <div>
                <div style={{ height: '1px', backgroundColor: '#E5E9EF', marginBottom: '25px' }}></div>
                
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div 
                    className="flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center"
                    style={{ width: '56px', height: '56px' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F73E8" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  
                  <div>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '19px',
                        fontWeight: 600,
                        color: '#27344A',
                        marginBottom: '2px'
                      }}
                    >
                      Pooja Nayak
                    </p>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '15px',
                        fontWeight: 400,
                        color: '#8A94A6'
                      }}
                    >
                      Physiotherapist · Pain Clinic
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Dr. Ananya Kulkarni */}
            <div 
              className="bg-white rounded-2xl p-6 flex flex-col justify-between"
              style={{ 
                borderRadius: '18px',
                minHeight: '300px'
              }}
            >
              <div>
                <p 
                  style={{
                    fontFamily: 'Roboto, sans-serif',
                    fontSize: '17px',
                    fontWeight: 400,
                    lineHeight: '25px',
                    color: '#566B4A',
                    marginBottom: '35px'
                  }}
                >
                  "PulseMate Connect gives our clinic a simple way to manage appointments and keep track of our daily patient queue. It makes the booking experience more convenient for patients and helps our team stay organized."
                </p>
              </div>

              <div>
                <div style={{ height: '1px', backgroundColor: '#E5E9EF', marginBottom: '25px' }}></div>
                
                <div className="flex items-center gap-3">
                  {/* Avatar Placeholder */}
                  <div 
                    className="flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center"
                    style={{ width: '56px', height: '56px' }}
                  >
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2F73E8" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  
                  <div>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '19px',
                        fontWeight: 600,
                        color: '#27344A',
                        marginBottom: '2px'
                      }}
                    >
                      Dr. Ananya Kulkarni
                    </p>
                    <p 
                      style={{
                        fontFamily: 'Roboto, sans-serif',
                        fontSize: '15px',
                        fontWeight: 400,
                        color: '#8A94A6'
                      }}
                    >
                      Dentist · SmileCare Dental Clinic
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who Is This For Section */}
      <section className="py-20 px-4 sm:px-8 lg:px-[10vw] bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Who Is PulseMate For?
          </h2>
          <div className="flex flex-wrap justify-center gap-4">
            {clinicTypes.map((type, index) => (
              <div
                key={index}
                className="bg-blue-50 px-6 py-4 rounded-lg border border-blue-200 text-blue-800 font-medium text-lg"
              >
                {type}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 px-4 sm:px-8 lg:px-[10vw]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-gray-900">
            Built for Modern Clinic Operations
          </h2>
          <p className="text-xl text-gray-600">
            One platform for appointments, doctors, patient queues and clinic management.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-8 lg:px-[10vw] bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12 text-gray-900">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition"
                >
                  <span className="text-lg font-semibold text-gray-900">{faq.question}</span>
                  <svg
                    className={`w-6 h-6 text-gray-500 transition-transform ${
                      expandedFaq === index ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedFaq === index && (
                  <div className="p-6 pt-0 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-8 lg:px-[10vw]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <span className="text-xl font-bold text-blue-400">PulseMate </span>
                <span className="text-xl font-bold text-green-400">Connect</span>
              </div>
              <p className="text-gray-400 text-sm mb-3">
                Empowering clinics with modern appointment management and patient engagement solutions.
              </p>
              <a 
                href="mailto:contact@pulsemateconnect.com" 
                className="text-gray-400 hover:text-white transition text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                contact@pulsemateconnect.com
              </a>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-gray-400 hover:text-white transition text-sm">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-gray-400 hover:text-white transition text-sm">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-gray-400 hover:text-white transition text-sm">
                    Careers
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/privacy" className="text-gray-400 hover:text-white transition text-sm">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/terms" className="text-gray-400 hover:text-white transition text-sm">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-gray-400 hover:text-white transition text-sm">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">Social Links</h3>
              <div className="flex gap-4 mb-6">
                {/* Facebook */}
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>

                {/* Twitter/X */}
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-700 transition"
                  aria-label="LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                  </svg>
                </a>
              </div>

              {/* Google Play Badge */}
              <a
                href="https://play.google.com/store"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block"
              >
                <img
                  src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
                  alt="Get it on Google Play"
                  className="h-12 w-auto hover:opacity-80 transition"
                  loading="lazy"
                />
              </a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400 text-sm">
            <p>© {new Date().getFullYear()} PulseMate Connect. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Video Modal */}
      {showVideoModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setShowVideoModal(false)}
        >
          <div 
            className="relative w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition shadow-lg"
              aria-label="Close video"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Content - Replace with actual video URL */}
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white p-8">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2">How to Register Your Clinic</p>
                <p className="text-sm text-gray-400 mb-4">Step-by-step guide to get started with PulseMate Connect</p>
                <p className="text-xs text-gray-500">Video content will be available soon</p>
              </div>
              
              {/* Uncomment when you have a video URL */}
              {/* <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
                title="How to register your clinic"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe> */}
            </div>

            <div className="p-6 bg-gray-50">
              <h3 className="font-semibold text-gray-900 mb-2">What you'll learn:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Creating your clinic account
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Uploading required documents
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Setting up your clinic profile
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Going live with appointments
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <ClinicAuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      )}
    </div>
  );
};

export default ClinicPartnerPage;
