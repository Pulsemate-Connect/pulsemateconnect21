import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User, Calendar, Phone, Image, Stethoscope, GraduationCap,
  FileText, Award, MessageSquare, DollarSign, CheckCircle,
  ChevronRight, ChevronLeft, Loader2, Upload, X
} from 'lucide-react';
import {
  MEDICAL_SYSTEMS,
  getSpecializationsForSystem,
  getRegistrationAuthoritiesForSystem,
  validateMedicalSystemAndSpecialization
} from '../../constants/medicalSystems';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LANGUAGES = [
  'English', 'Hindi', 'Bengali', 'Telugu', 'Marathi', 'Tamil', 'Urdu',
  'Gujarati', 'Malayalam', 'Kannada', 'Odia', 'Punjabi', 'Assamese'
];

const DoctorProfileComplete = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [invitation, setInvitation] = useState(null);
  const [profile, setProfile] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    fullLegalName: '',
    dateOfBirth: '',
    gender: '',
    profilePhotoUrl: '',
    
    // Step 2: Professional Information
    medicalSystem: '',
    customMedicalSystem: '',
    qualification: '',
    specialization: '',
    customSpecialization: '',
    medicalRegistrationNumber: '',
    registrationAuthority: '',
    customRegistrationAuthority: '',
    registrationYear: '',
    
    // Step 3: Professional Documents
    documents: [],
    
    // Step 4: Professional Profile
    experienceYears: 0,
    languagesKnown: [],
    bio: '',
    consultationFee: '',
    areasOfExpertise: []
  });

  const [errors, setErrors] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState(false);

  useEffect(() => {
    fetchInvitationAndProfile();
  }, [token]);

  const fetchInvitationAndProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/doctor/profile/by-token/${token}`);
      const { invitation: invData, profile: profData } = response.data.data;
      
      setInvitation(invData);
      setProfile(profData);

      // Prefill form with existing data
      if (profData) {
        setFormData({
          ...formData,
          ...profData,
          languagesKnown: profData.languagesKnown || [],
          areasOfExpertise: profData.areasOfExpertise || []
        });
      } else {
        // Prefill from invitation
        setFormData(prev => ({
          ...prev,
          fullLegalName: invData.doctorName || '',
          specialization: invData.specialization || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleMedicalSystemChange = (e) => {
    const system = e.target.value;
    setFormData(prev => ({
      ...prev,
      medicalSystem: system,
      specialization: '', // Reset specialization when system changes
      registrationAuthority: ''
    }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => ({
      ...prev,
      languagesKnown: prev.languagesKnown.includes(lang)
        ? prev.languagesKnown.filter(l => l !== lang)
        : [...prev.languagesKnown, lang]
    }));
  };

  const handleFileUpload = async (e, documentType) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPG, PNG, and PDF files are allowed');
      return;
    }

    try {
      setUploadingDoc(true);
      
      // Handle profile photo upload separately
      if (documentType === 'profile_photo') {
        const formDataUpload = new FormData();
        formDataUpload.append('photo', file);
        formDataUpload.append('invitationToken', token);

        const response = await axios.post(
          `${API_URL}/api/upload/doctor-profile-photo`,
          formDataUpload,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const fileUrl = response.data.data.url;
        
        setFormData(prev => ({
          ...prev,
          profilePhotoUrl: fileUrl
        }));

        toast.success('Profile photo uploaded successfully');
        return;
      }

      // Handle document uploads
      const formDataUpload = new FormData();
      formDataUpload.append('document', file);
      formDataUpload.append('invitationToken', token);
      formDataUpload.append('documentType', documentType);

      const response = await axios.post(
        `${API_URL}/api/upload/doctor-document`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const fileUrl = response.data.data.url;
      
      setFormData(prev => ({
        ...prev,
        documents: [
          ...prev.documents,
          {
            type: documentType,
            url: fileUrl,
            fileName: file.name,
            fileSize: file.size
          }
        ]
      }));

      toast.success('Document uploaded successfully');
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.error(err.response?.data?.message || 'Failed to upload file');
    } finally {
      setUploadingDoc(false);
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.fullLegalName.trim()) newErrors.fullLegalName = 'Full name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (step === 2) {
      if (!formData.medicalSystem) newErrors.medicalSystem = 'Medical system is required';
      if (!formData.qualification.trim()) newErrors.qualification = 'Qualification is required';
      if (!formData.specialization) newErrors.specialization = 'Specialization is required';
      if (!formData.medicalRegistrationNumber.trim()) newErrors.medicalRegistrationNumber = 'Registration number is required';
      if (!formData.registrationAuthority) newErrors.registrationAuthority = 'Registration authority is required';
      if (!formData.registrationYear) newErrors.registrationYear = 'Registration year is required';

      // Validate medical system and specialization
      const validation = validateMedicalSystemAndSpecialization({
        medicalSystem: formData.medicalSystem,
        specialization: formData.specialization,
        customSpecialization: formData.customSpecialization
      });
      if (!validation.valid) {
        newErrors.specialization = validation.error;
      }
    }

    if (step === 3) {
      // Check for required documents
      const hasRegistrationCert = formData.documents.some(d => d.type === 'registration_certificate');
      const hasQualificationCert = formData.documents.some(d => d.type === 'qualification_certificate');
      
      if (!hasRegistrationCert) newErrors.documents = 'Medical registration certificate is required';
      else if (!hasQualificationCert) newErrors.documents = 'Qualification certificate is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveProfileData = async () => {
    try {
      setSaving(true);
      
      // Prepare data - only send fields that are filled to avoid unique constraint issues
      const dataToSave = { ...formData };
      
      // Don't send empty medical registration number to avoid unique constraint issues
      if (!dataToSave.medicalRegistrationNumber || dataToSave.medicalRegistrationNumber.trim() === '') {
        delete dataToSave.medicalRegistrationNumber;
      }
      
      // Call the update profile API
      await axios.put(
        `${API_URL}/doctor/profile/${token}`,
        dataToSave
      );
      
      toast.success('Progress saved');
      return true;
    } catch (err) {
      console.error('Error saving profile:', err);
      const errorMessage = err.response?.data?.message || 'Failed to save progress';
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // Save current step data before proceeding
      const saved = await saveProfileData();
      
      if (saved) {
        setCurrentStep(prev => Math.min(prev + 1, 4));
        window.scrollTo(0, 0);
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setSubmitting(true);
      
      // First save the final step data
      await axios.put(
        `${API_URL}/doctor/profile/${token}`,
        formData
      );
      
      // Then submit for verification
      await axios.post(
        `${API_URL}/doctor/profile/${token}/submit`,
        {}
      );

      toast.success('Profile submitted for verification!');
      
      // Redirect to a success page or show pending verification message
      navigate('/doctor/profile/pending', { 
        state: { message: 'Your profile has been submitted for admin verification.' }
      });
    } catch (err) {
      console.error('Error submitting profile:', err);
      toast.error(err.response?.data?.message || 'Failed to submit profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className="flex items-center flex-1">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full font-semibold
              ${currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}
            `}>
              {step}
            </div>
            {step < 4 && (
              <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-600">
        <span>Personal</span>
        <span>Professional</span>
        <span>Documents</span>
        <span>Profile</span>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Legal Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="fullLegalName"
          value={formData.fullLegalName}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.fullLegalName ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Enter your full legal name"
        />
        {errors.fullLegalName && <p className="text-red-500 text-sm mt-1">{errors.fullLegalName}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Date of Birth <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="dateOfBirth"
          value={formData.dateOfBirth}
          onChange={handleInputChange}
          max={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'}`}
        />
        {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Gender <span className="text-red-500">*</span>
        </label>
        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}
        >
          <option value="">Select gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mobile Number
        </label>
        <input
          type="text"
          value={invitation?.doctorMobile || ''}
          disabled
          className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
        />
        <p className="text-xs text-gray-500 mt-1">Mobile number from invitation</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        <div className="flex items-center gap-4">
          {formData.profilePhotoUrl ? (
            <img src={formData.profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-blue-500" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
          )}
          <button
            type="button"
            onClick={() => document.getElementById('profilePhoto').click()}
            disabled={uploadingDoc}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadingDoc ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </button>
          <input
            id="profilePhoto"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, 'profile_photo')}
            disabled={uploadingDoc}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">Recommended: Square image, at least 400x400px</p>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const specializations = getSpecializationsForSystem(formData.medicalSystem);
    const authorities = getRegistrationAuthoritiesForSystem(formData.medicalSystem);
    
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Information</h2>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical System / Category <span className="text-red-500">*</span>
          </label>
          <select
            name="medicalSystem"
            value={formData.medicalSystem}
            onChange={handleMedicalSystemChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.medicalSystem ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select medical system</option>
            {MEDICAL_SYSTEMS.map(system => (
              <option key={system} value={system}>{system}</option>
            ))}
          </select>
          {errors.medicalSystem && <p className="text-red-500 text-sm mt-1">{errors.medicalSystem}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualification <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="qualification"
            value={formData.qualification}
            onChange={handleInputChange}
            placeholder="e.g., MBBS, MD, BDS, BAMS, BHMS"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.qualification ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.qualification && <p className="text-red-500 text-sm mt-1">{errors.qualification}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Specialization <span className="text-red-500">*</span>
          </label>
          <select
            name="specialization"
            value={formData.specialization}
            onChange={handleInputChange}
            disabled={!formData.medicalSystem}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.specialization ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select specialization</option>
            {specializations.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
          </select>
          {errors.specialization && <p className="text-red-500 text-sm mt-1">{errors.specialization}</p>}
          
          {formData.specialization === 'Other / Not Listed' && (
            <input
              type="text"
              name="customSpecialization"
              value={formData.customSpecialization}
              onChange={handleInputChange}
              placeholder="Enter your specialization"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Medical Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="medicalRegistrationNumber"
            value={formData.medicalRegistrationNumber}
            onChange={handleInputChange}
            placeholder="Enter your registration number"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.medicalRegistrationNumber ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.medicalRegistrationNumber && <p className="text-red-500 text-sm mt-1">{errors.medicalRegistrationNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Authority / Council <span className="text-red-500">*</span>
          </label>
          <select
            name="registrationAuthority"
            value={formData.registrationAuthority}
            onChange={handleInputChange}
            disabled={!formData.medicalSystem}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.registrationAuthority ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">Select registration authority</option>
            {authorities.map(auth => (
              <option key={auth} value={auth}>{auth}</option>
            ))}
          </select>
          {errors.registrationAuthority && <p className="text-red-500 text-sm mt-1">{errors.registrationAuthority}</p>}
          
          {formData.registrationAuthority === 'Other / Not Listed' && (
            <input
              type="text"
              name="customRegistrationAuthority"
              value={formData.customRegistrationAuthority}
              onChange={handleInputChange}
              placeholder="Enter registration authority"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg mt-2"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Year <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="registrationYear"
            value={formData.registrationYear}
            onChange={handleInputChange}
            min="1950"
            max={new Date().getFullYear()}
            placeholder="e.g., 2020"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.registrationYear ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.registrationYear && <p className="text-red-500 text-sm mt-1">{errors.registrationYear}</p>}
        </div>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Documents</h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>Required Documents:</strong> Medical registration certificate and qualification certificate are mandatory for verification.
        </p>
      </div>

      {/* Medical Registration Certificate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical Registration Certificate <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileUpload(e, 'registration_certificate')}
          className="hidden"
          id="registration_cert"
        />
        <button
          type="button"
          onClick={() => document.getElementById('registration_cert').click()}
          disabled={uploadingDoc}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <Upload className="w-5 h-5" />
          Upload Registration Certificate
        </button>
      </div>

      {/* Qualification Certificate */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Qualification Certificate <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileUpload(e, 'qualification_certificate')}
          className="hidden"
          id="qualification_cert"
        />
        <button
          type="button"
          onClick={() => document.getElementById('qualification_cert').click()}
          disabled={uploadingDoc}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <Upload className="w-5 h-5" />
          Upload Qualification Certificate
        </button>
      </div>

      {/* Additional Documents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Certificates (Optional)
        </label>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => handleFileUpload(e, 'additional_certificate')}
          className="hidden"
          id="additional_cert"
        />
        <button
          type="button"
          onClick={() => document.getElementById('additional_cert').click()}
          disabled={uploadingDoc}
          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600"
        >
          <Upload className="w-5 h-5" />
          Upload Additional Certificate
        </button>
      </div>

      {errors.documents && <p className="text-red-500 text-sm">{errors.documents}</p>}

      {/* Uploaded Documents List */}
      {formData.documents.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-3">Uploaded Documents:</h3>
          <div className="space-y-2">
            {formData.documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                    <p className="text-xs text-gray-500">{doc.type.replace(/_/g, ' ').toUpperCase()}</p>
                    {doc.fileSize && <p className="text-xs text-gray-400">{(doc.fileSize / 1024).toFixed(2)} KB</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 underline"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
                    className="p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Professional Profile</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience (Post-Registration)
        </label>
        <input
          type="number"
          name="experienceYears"
          value={formData.experienceYears}
          onChange={handleInputChange}
          min="0"
          max="60"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">Enter 0 for newly registered doctors</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Languages Spoken
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              type="button"
              onClick={() => handleLanguageToggle(lang)}
              className={`px-4 py-2 rounded-lg border transition-colors ${
                formData.languagesKnown.includes(lang)
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About / Bio
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          rows="4"
          placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">{formData.bio.length} / 500 characters</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Consultation Fee (₹)
        </label>
        <input
          type="number"
          name="consultationFee"
          value={formData.consultationFee}
          onChange={handleInputChange}
          min="0"
          placeholder="e.g., 500"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Areas of Expertise (Comma-separated)
        </label>
        <input
          type="text"
          name="areasOfExpertise"
          value={formData.areasOfExpertise.join(', ')}
          onChange={(e) => setFormData(prev => ({ 
            ...prev, 
            areasOfExpertise: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
          }))}
          placeholder="e.g., Diabetes Management, Hypertension, Preventive Care"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Fill in your professional details for verification</p>
          </div>

          {renderProgressBar()}

          <form onSubmit={(e) => e.preventDefault()}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <div className="flex justify-between mt-8 pt-6 border-t">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={saving}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit for Verification
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfileComplete;
