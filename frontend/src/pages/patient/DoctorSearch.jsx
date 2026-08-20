import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import { searchDoctors } from '../../api/patient.api';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

// ── Spec config ───────────────────────────────────────────────────────────────
const SPECS = [
  { key: 'All',               label: 'All',           icon: '🔬', color: '#2563EB', bg: '#EFF6FF' },
  { key: 'General Physician', label: 'General',       icon: '🩺', color: '#6366F1', bg: '#EEF2FF' },
  { key: 'Cardiologist',      label: 'Cardiology',    icon: '❤️', color: '#EF4444', bg: '#FEE2E2' },
  { key: 'Dermatologist',     label: 'Skin',          icon: '✨', color: '#F59E0B', bg: '#FEF3C7' },
  { key: 'Orthopedic',        label: 'Ortho',         icon: '🦴', color: '#10B981', bg: '#D1FAE5' },
  { key: 'Pediatrician',      label: 'Pediatrics',    icon: '👶', color: '#EC4899', bg: '#FCE7F3' },
  { key: 'Neurologist',       label: 'Neurology',     icon: '🧠', color: '#8B5CF6', bg: '#EDE9FE' },
  { key: 'ENT',               label: 'ENT',           icon: '👂', color: '#06B6D4', bg: '#CFFAFE' },
  { key: 'Gynecologist',      label: 'Gynecology',    icon: '🌸', color: '#EC4899', bg: '#FCE7F3' },
  { key: 'Psychiatrist',      label: 'Psychiatry',    icon: '🧘', color: '#7C3AED', bg: '#EDE9FE' },
];

const CITIES = ['All Cities', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur'];
const SORT_OPTS = ['Relevance', 'Experience ↓', 'Fee ↓'];

// ── Doctor Card ───────────────────────────────────────────────────────────────
const DoctorCard = ({ doc }) => {
  const spec    = doc.specialization || 'General Physician';
  const cfg     = SPECS.find((s) => s.key === spec) || SPECS[1];
  const clinic  = doc.doctorClinics?.[0]?.clinic;
  const langs   = doc.languagesKnown?.slice(0, 2).join(', ') || 'English';
  const exp     = doc.experienceYears || 0;
  const qual    = doc.qualification || 'MBBS';
  const avgMins = doc.avgConsultationMins || 15;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all overflow-hidden group">
      {/* Accent top strip */}
      <div className="h-1" style={{ backgroundColor: cfg.color }} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-xl font-bold"
            style={{ backgroundColor: cfg.bg, color: cfg.color }}>
            {doc.user?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-gray-900 text-sm truncate">Dr. {doc.user?.name}</p>
              <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            </div>
            <span className="inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1"
              style={{ backgroundColor: cfg.bg, color: cfg.color }}>
              {spec}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <span>{qual}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>{exp > 0 ? `${exp} yrs exp` : 'New'}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
            <span>{langs}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span>~{avgMins} min/patient</span>
          </div>
        </div>

        {/* Clinic location */}
        {clinic && (
          <p className="text-xs text-gray-400 mb-3 truncate">
            📍 {clinic.name}{clinic.city ? `, ${clinic.city}` : ''}
          </p>
        )}

        {/* Availability badges + action */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {doc.offlineAvailable && (
              <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-lg">🏥 Clinic</span>
            )}
            {doc.onlineAvailable && (
              <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-lg">💻 Online</span>
            )}
          </div>
          <Link to={`/patient/doctors/${doc.id}`}
            className="text-xs font-semibold text-white px-3 py-1.5 rounded-lg transition-colors"
            style={{ backgroundColor: cfg.color }}>
            Book →
          </Link>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const DoctorSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [doctors, setDoctors]   = useState([]);
  const [isLoading, setLoading] = useState(false);
  const [total, setTotal]       = useState(0);
  const [query, setQuery]       = useState(searchParams.get('name') || '');
  const [spec, setSpec]         = useState(searchParams.get('specialization') || 'All');
  const [city, setCity]         = useState('All Cities');
  const [avail, setAvail]       = useState('Any');
  const [sort, setSort]         = useState('Relevance');
  const [showFilter, setShowFilter] = useState(false);
  const inputRef = useRef(null);

  const doSearch = useCallback(async (overrides = {}) => {
    setLoading(true);
    const q    = overrides.query ?? query;
    const s    = overrides.spec  ?? spec;
    const c    = overrides.city  ?? city;
    const av   = overrides.avail ?? avail;
    const so   = overrides.sort  ?? sort;

    const params = {};
    if (q.trim()) params.name = q.trim();
    if (s && s !== 'All') params.specialization = s;
    if (c && c !== 'All Cities') params.city = c;
    if (av === 'Available Today') params.available = 'true';

    try {
      const res = await searchDoctors(params);
      let data = res.data.data?.doctors || res.data.data || [];
      if (so === 'Experience ↓') data = [...data].sort((a, b) => (b.experienceYears || 0) - (a.experienceYears || 0));
      if (so === 'Fee ↓') data = [...data].sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
      setDoctors(data);
      setTotal(data.length);
    } catch {
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [query, spec, city, avail, sort]);

  useEffect(() => { doSearch(); }, []);

  // Sync from URL params (e.g. from dashboard speciality chips)
  useEffect(() => {
    const urlSpec = searchParams.get('specialization');
    if (urlSpec && urlSpec !== spec) {
      setSpec(urlSpec);
      doSearch({ spec: urlSpec });
    }
  }, [searchParams]);

  const handleSpec = (key) => {
    setSpec(key);
    doSearch({ spec: key });
  };

  const activeFilters = [city !== 'All Cities', avail !== 'Any', sort !== 'Relevance'].filter(Boolean).length;

  return (
    <DashboardLayout>
      <div className="page-container">

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-900">Find a Doctor</h1>
          <p className="text-gray-400 text-sm mt-0.5">{isLoading ? 'Searching...' : `${total} doctor${total !== 1 ? 's' : ''} found`}</p>
        </div>

        {/* Search bar */}
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input ref={inputRef} type="text" className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 bg-white"
              placeholder="Search by name, speciality..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && doSearch()} />
            {query && (
              <button onClick={() => { setQuery(''); doSearch({ query: '' }); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            )}
          </div>
          <button onClick={() => doSearch()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors">
            Search
          </button>
          <button onClick={() => setShowFilter(true)} className={`relative px-3 py-2.5 border rounded-xl transition-colors ${activeFilters > 0 ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            {activeFilters > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold">{activeFilters}</span>
            )}
          </button>
        </div>

        {/* Speciality chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {SPECS.map((s) => {
            const active = spec === s.key;
            return (
              <button key={s.key} onClick={() => handleSpec(s.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-all"
                style={active ? { backgroundColor: s.color, borderColor: s.color, color: '#fff' } : { backgroundColor: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }}>
                <span>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Active filter chips */}
        {activeFilters > 0 && (
          <div className="flex gap-2 flex-wrap mb-4">
            {city !== 'All Cities' && (
              <span className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                📍 {city}
                <button onClick={() => { setCity('All Cities'); doSearch({ city: 'All Cities' }); }} className="text-blue-400 hover:text-blue-600">×</button>
              </span>
            )}
            {avail !== 'Any' && (
              <span className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                🕐 {avail}
                <button onClick={() => { setAvail('Any'); doSearch({ avail: 'Any' }); }} className="text-blue-400 hover:text-blue-600">×</button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-gray-400">Finding the best doctors...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-4">🔍</p>
            <p className="font-semibold text-gray-700 text-lg">No doctors found</p>
            <p className="text-gray-400 text-sm mt-1 mb-5">Try different name, speciality or city</p>
            <button onClick={() => { setQuery(''); setSpec('All'); setCity('All Cities'); doSearch({ query: '', spec: 'All', city: 'All Cities' }); }}
              className="bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors">
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map((doc) => <DoctorCard key={doc.id} doc={doc} />)}
          </div>
        )}
      </div>

      {/* Filter drawer */}
      {showFilter && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setShowFilter(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-3xl p-6 space-y-5 max-h-[70vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              <button onClick={() => { setCity('All Cities'); setAvail('Any'); setSort('Relevance'); }} className="text-sm font-semibold text-blue-600">Reset all</button>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">City</p>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c} onClick={() => setCity(c)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${city === c ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>{c}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Availability</p>
              <div className="flex flex-wrap gap-2">
                {['Any', 'Available Today', 'Online Only'].map((a) => (
                  <button key={a} onClick={() => setAvail(a)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${avail === a ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>{a}</button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTS.map((s) => (
                  <button key={s} onClick={() => setSort(s)} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${sort === s ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'}`}>{s}</button>
                ))}
              </div>
            </div>

            <button onClick={() => { setShowFilter(false); doSearch({ city, avail, sort }); }}
              className="w-full bg-blue-600 text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorSearch;
