// ─────────────────────────────────────────────────────────────────────────────
//  FilterBar — matches screenshot: search + State dropdown + City input + Type
//  Logic unchanged — only UI
// ─────────────────────────────────────────────────────────────────────────────
import { useRef } from 'react';

const CLINIC_TYPES = [
  'General', 'Multi-Specialty', 'Dental', 'Eye', 'Skin & Cosmetology',
  'Orthopedic', 'Pediatric', 'Gynecology', 'Neurology', 'Cardiology',
  'Psychiatry', 'Ayurvedic', 'Homeopathy', 'Physiotherapy', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands',
  'Chandigarh','Dadra & Nagar Haveli','Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

// Shared input/select class — matches the screenshot's clean rounded-lg look
const inputCls = `
  h-10 text-sm bg-white border border-gray-200 rounded-lg text-gray-700
  focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400
  transition-colors placeholder-gray-400
`.trim();

const selectCls = `${inputCls} appearance-none cursor-pointer pr-8 pl-3`;

const ChevronDown = () => (
  <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const FilterBar = ({ filters, onFilterChange, onClearAll }) => {
  const searchRef = useRef(null);
  const hasActiveFilters = filters.search || filters.state || filters.city || filters.clinicType;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">

      {/* Search — wide, with icon inside */}
      <div className="relative flex-1 min-w-[260px]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          ref={searchRef}
          type="text"
          placeholder="Search by clinic name, owner, mobile, email, or reg. number..."
          value={filters.search}
          onChange={(e) => onFilterChange('search', e.target.value)}
          className={`w-full pl-9 pr-4 ${inputCls}`}
        />
      </div>

      {/* State dropdown */}
      <div className="relative">
        <select
          value={filters.state}
          onChange={(e) => onFilterChange('state', e.target.value)}
          className={`${selectCls} min-w-[140px]`}
        >
          <option value="">All States</option>
          {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <ChevronDown />
      </div>

      {/* City input */}
      <div className="relative">
        <input
          type="text"
          placeholder="City"
          value={filters.city}
          onChange={(e) => onFilterChange('city', e.target.value)}
          className={`pl-3 pr-3 w-28 ${inputCls}`}
        />
        <ChevronDown />
      </div>

      {/* Clinic Type dropdown */}
      <div className="relative">
        <select
          value={filters.clinicType}
          onChange={(e) => onFilterChange('clinicType', e.target.value)}
          className={`${selectCls} min-w-[130px]`}
        >
          <option value="">All Types</option>
          {CLINIC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <ChevronDown />
      </div>

      {/* Clear — only when filters active */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearAll}
          className="h-10 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-gray-500
                     border border-gray-200 rounded-lg bg-white whitespace-nowrap
                     hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;
