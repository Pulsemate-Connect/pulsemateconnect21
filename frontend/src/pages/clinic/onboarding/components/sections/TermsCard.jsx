import React from 'react';
import * as LucideIcons from 'lucide-react';

const TermsCard = ({ register, watch, errors, setValue }) => {
  const confirmAuthorized = watch('confirmAuthorized') || false;
  const termsAccepted = watch('termsAccepted') || false;
  const confirmAccurate = watch('confirmAccurate') || false;
  const confirmCompliance = watch('confirmCompliance') || false;

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
        {/* Card Header */}
        <div className="border-b border-gray-100 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Partner Agreement
          </h2>
          <p className="text-sm text-gray-600">
            Please review the Partner Agreement before registering your clinic with PulseMate Connect
          </p>
        </div>

        {/* Agreement Summary Box */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            PulseMate Connect – Clinic Partner Terms & Conditions
          </h3>
          <p className="text-sm text-blue-800 mb-4">
            <strong>Last updated:</strong> August 13, 2026
          </p>
          
          <div className="space-y-3 text-sm text-blue-900">
            <div className="flex items-start gap-2">
              <LucideIcons.CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p><strong>Clinic responsibility:</strong> Maintain valid licenses and accurate clinic information</p>
            </div>
            <div className="flex items-start gap-2">
              <LucideIcons.CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p><strong>Patient data:</strong> Must be kept confidential and used only for healthcare services</p>
            </div>
            <div className="flex items-start gap-2">
              <LucideIcons.CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600" />
              <p><strong>Termination:</strong> 30 days' written notice, subject to immediate suspension for serious violations</p>
            </div>
          </div>
        </div>

        {/* Acceptance Checkboxes */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
            Acceptance
          </h3>

          {/* Checkbox 1 */}
          <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              id="confirmAuthorized"
              {...register('confirmAuthorized')}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="confirmAuthorized" className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">
                I confirm that I am authorized to register this clinic on behalf of the clinic.
              </span>
            </label>
          </div>
          {errors.confirmAuthorized && (
            <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
              <LucideIcons.AlertCircle className="w-4 h-4" />
              {errors.confirmAuthorized.message}
            </p>
          )}

          {/* Checkbox 2 */}
          <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              id="termsAccepted"
              {...register('termsAccepted')}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="termsAccepted" className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">
                I have read and agree to the PulseMate Connect Clinic Partner Terms & Conditions.
              </span>
            </label>
          </div>
          {errors.termsAccepted && (
            <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
              <LucideIcons.AlertCircle className="w-4 h-4" />
              {errors.termsAccepted.message}
            </p>
          )}

          {/* Checkbox 3 */}
          <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              id="confirmAccurate"
              {...register('confirmAccurate')}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="confirmAccurate" className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">
                I confirm that the information and documents submitted by me are accurate and complete.
              </span>
            </label>
          </div>
          {errors.confirmAccurate && (
            <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
              <LucideIcons.AlertCircle className="w-4 h-4" />
              {errors.confirmAccurate.message}
            </p>
          )}

          {/* Checkbox 4 */}
          <div className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
            <input
              type="checkbox"
              id="confirmCompliance"
              {...register('confirmCompliance')}
              className="w-5 h-5 mt-0.5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="confirmCompliance" className="flex-1 cursor-pointer">
              <span className="text-sm font-medium text-gray-900">
                I agree to comply with applicable healthcare, privacy, and data protection requirements.
              </span>
            </label>
          </div>
          {errors.confirmCompliance && (
            <p className="text-sm text-red-600 flex items-center gap-1 ml-8">
              <LucideIcons.AlertCircle className="w-4 h-4" />
              {errors.confirmCompliance.message}
            </p>
          )}
        </div>

        {/* Info Box */}
        <div className="p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <LucideIcons.CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 mb-1">
                What happens after submission?
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Your application will be reviewed by our team within 24-48 hours</li>
                <li>• You'll receive an email notification once your account is approved</li>
                <li>• After approval, you can start accepting patient bookings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TermsCard;
