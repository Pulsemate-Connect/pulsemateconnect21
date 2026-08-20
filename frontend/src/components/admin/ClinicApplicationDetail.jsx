import React, { useState } from 'react';
import { X, MapPin, Clock, FileText, Building, Phone, Mail, Globe, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * ClinicApplicationDetail Component
 * 
 * Displays complete clinic onboarding data from the 4-step registration process
 * Shows: Clinic Info, Services & Operations, Documents, Partner Agreement
 */
const ClinicApplicationDetail = ({ clinic, onClose, onApprove, onReject, onSuspend, isLoading }) => {
  const [activeTab, setActiveTab] = useState('info');

  if (!clinic) return null;

  const onboardingData = clinic.clinicOnboardingData || {};
  const owner = clinic.owner || {};

  const tabs = [
    { id: 'info', label: 'Clinic Info', icon: Building },
    { id: 'services', label: 'Services & Operations', icon: Clock },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'agreement', label: 'Agreement', icon: CheckCircle },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-6xl rounded-2xl bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{clinic.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                Application submitted by {owner.name} • {owner.email || owner.mobile}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <div className="flex gap-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto p-6">
            {activeTab === 'info' && <ClinicInfoTab clinic={clinic} onboardingData={onboardingData} />}
            {activeTab === 'services' && <ServicesTab onboardingData={onboardingData} />}
            {activeTab === 'documents' && <DocumentsTab clinic={clinic} onboardingData={onboardingData} />}
            {activeTab === 'agreement' && <AgreementTab onboardingData={onboardingData} />}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Close
            </button>
            <button
              onClick={onSuspend}
              className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              disabled={isLoading}
            >
              Suspend
            </button>
            <button
              onClick={onReject}
              className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={onApprove}
              className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== TAB COMPONENTS ====================

const ClinicInfoTab = ({ clinic, onboardingData }) => {
  const step1 = onboardingData.step1 || {};
  
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Section title="Basic Information">
        <InfoGrid>
          <InfoItem label="Clinic Name" value={clinic.name || step1.clinicName} />
          <InfoItem label="Clinic Type" value={step1.clinicType} />
          <InfoItem label="Registration Number" value={step1.clinicRegistrationNumber} />
          <InfoItem label="Phone" value={step1.phone || clinic.phone} />
          <InfoItem label="Email" value={step1.email || clinic.email} />
          <InfoItem label="Website" value={step1.website} />
        </InfoGrid>
      </Section>

      {/* Owner Details */}
      <Section title="Owner/Primary Contact">
        <InfoGrid>
          <InfoItem label="Owner Name" value={step1.ownerName} />
          <InfoItem label="Owner Mobile" value={step1.mobile} />
          <InfoItem label="Owner Email" value={step1.ownerEmail} />
        </InfoGrid>
      </Section>

      {/* Address */}
      <Section title="Clinic Address">
        <div className="space-y-3">
          <InfoItem label="Street Address" value={step1.address} fullWidth />
          <InfoGrid>
            <InfoItem label="Area/Locality" value={step1.area} />
            <InfoItem label="Landmark" value={step1.landmark} />
            <InfoItem label="City" value={step1.city} />
            <InfoItem label="District" value={step1.district} />
            <InfoItem label="State" value={step1.state} />
            <InfoItem label="PIN Code" value={step1.pincode} />
          </InfoGrid>
        </div>
      </Section>

      {/* Location Coordinates */}
      <Section title="Map Location">
        <InfoGrid>
          <InfoItem label="Latitude" value={step1.latitude} />
          <InfoItem label="Longitude" value={step1.longitude} />
          <InfoItem 
            label="Google Maps" 
            value={
              step1.googleMapsLocation ? (
                <a 
                  href={step1.googleMapsLocation}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Globe className="h-4 w-4" />
                  Open in Maps
                </a>
              ) : 'Not provided'
            }
          />
        </InfoGrid>
        {(step1.latitude && step1.longitude) && (
          <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden">
            <iframe
              title="Clinic Location"
              width="100%"
              height="300"
              frameBorder="0"
              style={{ border: 0 }}
              src={`https://www.google.com/maps?q=${step1.latitude},${step1.longitude}&output=embed`}
              allowFullScreen
            />
          </div>
        )}
      </Section>
    </div>
  );
};

const ServicesTab = ({ onboardingData }) => {
  const step2 = onboardingData.step2 || {};
  
  return (
    <div className="space-y-6">
      {/* Services */}
      <Section title="Services Offered">
        <div className="flex flex-wrap gap-2">
          {step2.services?.length ? (
            step2.services.map((service, idx) => (
              <span key={idx} className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                {service}
              </span>
            ))
          ) : (
            <p className="text-gray-500">No services specified</p>
          )}
        </div>
      </Section>

      {/* Operating Hours */}
      <Section title="Operating Hours">
        <div className="space-y-3">
          {step2.operatingHours ? (
            Object.entries(step2.operatingHours).map(([day, hours]) => (
              <div key={day} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                <span className="font-medium text-gray-700 capitalize">{day}</span>
                <span className="text-gray-600">
                  {hours.isOpen ? `${hours.from} - ${hours.to}` : 'Closed'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Operating hours not specified</p>
          )}
        </div>
      </Section>

      {/* Appointment Settings */}
      <Section title="Appointment Configuration">
        <InfoGrid>
          <InfoItem label="Appointment Modes" value={step2.appointmentModes?.join(', ')} />
          <InfoItem label="Walk-in Enabled" value={step2.walkInEnabled ? 'Yes' : 'No'} />
          <InfoItem label="Emergency Services" value={step2.emergencyServices ? 'Yes' : 'No'} />
        </InfoGrid>
      </Section>

      {/* Additional Information */}
      <Section title="Additional Information">
        <InfoGrid>
          <InfoItem label="Languages Spoken" value={step2.languages?.join(', ')} />
          <InfoItem label="Facilities" value={step2.facilities?.join(', ')} />
          <InfoItem label="Specializations" value={step2.specializations?.join(', ')} />
        </InfoGrid>
        {step2.additionalInfo && (
          <div className="mt-4">
            <InfoItem label="Additional Notes" value={step2.additionalInfo} fullWidth />
          </div>
        )}
      </Section>
    </div>
  );
};

const DocumentsTab = ({ clinic, onboardingData }) => {
  const step3 = onboardingData.step3 || {};
  
  const documents = [
    { label: 'Clinic License', url: step3.clinicLicense || clinic.licenseDocumentUrl },
    { label: 'Medical Establishment Certificate', url: step3.medicalCertificate || clinic.medicalEstablishmentCertificateUrl },
    { label: 'GST Certificate', url: step3.gstCertificate || clinic.gstCertificateUrl },
    { label: 'PAN Card', url: step3.panCard || clinic.panCardUrl },
    { label: 'Clinic Photos', url: step3.clinicPhotos, multiple: true },
    { label: 'Clinic Logo', url: step3.clinicLogo },
  ].filter(doc => doc.url);

  return (
    <div className="space-y-6">
      <Section title="Uploaded Documents">
        {documents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((doc, idx) => (
              <DocumentCard key={idx} {...doc} />
            ))}
          </div>
        ) : (
          <EmptyState message="No documents uploaded yet" />
        )}
      </Section>

      {/* Business Information */}
      <Section title="Business Information">
        <InfoGrid>
          <InfoItem label="GST Number" value={step3.gstNumber || clinic.gstNumber} />
          <InfoItem label="PAN Number" value={step3.panNumber || clinic.panNumber} />
        </InfoGrid>
      </Section>
    </div>
  );
};

const AgreementTab = ({ onboardingData }) => {
  const step4 = onboardingData.step4 || {};
  
  return (
    <div className="space-y-6">
      <Section title="Partner Agreement">
        <div className="space-y-4">
          <AgreementItem
            label="Terms and Conditions"
            accepted={step4.agreedToTerms}
            date={step4.agreedToTermsDate}
          />
          <AgreementItem
            label="Privacy Policy"
            accepted={step4.agreedToPrivacy}
            date={step4.agreedToPrivacyDate}
          />
          <AgreementItem
            label="Data Sharing Agreement"
            accepted={step4.agreedToDataSharing}
            date={step4.agreedToDataSharingDate}
          />
        </div>
      </Section>

      {step4.additionalNotes && (
        <Section title="Additional Notes from Applicant">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-gray-700">{step4.additionalNotes}</p>
          </div>
        </Section>
      )}

      <Section title="Submission Details">
        <InfoGrid>
          <InfoItem 
            label="Submitted On" 
            value={step4.submittedAt ? new Date(step4.submittedAt).toLocaleString() : 'Not available'} 
          />
          <InfoItem label="Application Status" value={step4.status || 'PENDING'} />
        </InfoGrid>
      </Section>
    </div>
  );
};

// ==================== HELPER COMPONENTS ====================

const Section = ({ title, children }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6">
    <h3 className="mb-4 text-lg font-semibold text-gray-900">{title}</h3>
    {children}
  </div>
);

const InfoGrid = ({ children }) => (
  <div className="grid gap-4 md:grid-cols-2">
    {children}
  </div>
);

const InfoItem = ({ label, value, fullWidth }) => (
  <div className={fullWidth ? 'md:col-span-2' : ''}>
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900">
      {value || <span className="text-gray-400">Not provided</span>}
    </dd>
  </div>
);

const DocumentCard = ({ label, url, multiple }) => {
  if (multiple && Array.isArray(url)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        <div className="space-y-2">
          {url.map((fileUrl, idx) => (
            <a
              key={idx}
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm text-blue-600 hover:underline"
            >
              View file {idx + 1}
            </a>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-700">{label}</span>
        </div>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            View
          </a>
        )}
      </div>
    </div>
  );
};

const AgreementItem = ({ label, accepted, date }) => (
  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
    <div className="flex items-center gap-3">
      {accepted ? (
        <CheckCircle className="h-5 w-5 text-green-600" />
      ) : (
        <AlertCircle className="h-5 w-5 text-gray-400" />
      )}
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {date && <p className="text-xs text-gray-500">Accepted on {new Date(date).toLocaleDateString()}</p>}
      </div>
    </div>
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
      accepted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
    }`}>
      {accepted ? 'Accepted' : 'Not Accepted'}
    </span>
  </div>
);

const EmptyState = ({ message }) => (
  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
    <FileText className="h-12 w-12 mb-3 opacity-20" />
    <p>{message}</p>
  </div>
);

export default ClinicApplicationDetail;
