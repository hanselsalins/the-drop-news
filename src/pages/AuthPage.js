import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from '../components/F7Icon';
import { AvatarCircle } from '../components/AvatarCircle';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const inputStyle = {
  background: 'var(--light-gray)',
  border: 'none',
  borderRadius: 14,
  color: 'var(--title-color)',
  fontFamily: 'var(--font)',
  height: 52,
  fontSize: 16,
};
const inputClass = "w-full px-4 py-3 text-base outline-none";
const btnPrimary = "w-full flex items-center justify-center gap-2 cursor-pointer";

const slideIn = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
  transition: { duration: 0.3 },
};

const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];

function Wordmark() {
  return (
    <p style={{
      fontFamily: 'var(--font)', fontSize: 13, fontWeight: 700,
      letterSpacing: '0.25em', textTransform: 'uppercase',
      color: '#CCFF00',
    }}>
      THE DROP
    </p>
  );
}

function ProgressDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full" style={{
          background: i < current ? '#FF6B00' : 'var(--light-gray)',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  );
}

function ToggleButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button key={opt} type="button" onClick={() => onChange(opt)}
          className="py-3 px-5 text-sm font-medium cursor-pointer"
          style={{
            fontFamily: 'var(--font)', borderRadius: 28,
            background: value === opt ? '#FF6B00' : 'var(--light-gray)',
            color: value === opt ? '#FFFFFF' : 'var(--title-color)',
            border: 'none', minHeight: 48,
          }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

function CountryDropdown({ countries, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = countries.find(c => c.country_code === value);
  const filtered = search
    ? countries.filter(c => c.country_name.toLowerCase().includes(search.toLowerCase()))
    : countries;

  return (
    <div className="relative">
      <button type="button"
        onClick={() => setOpen(!open)}
        className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
        style={{ ...inputStyle }}>
        <span style={{ opacity: selected ? 1 : 0.4, color: selected ? 'var(--title-color)' : 'var(--text-color)' }}>
          {selected ? `${selected.flag_emoji} ${selected.country_name}` : 'Select country'}
        </span>
        <F7Icon name="chevron_down" size={16} color="var(--text-color)" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 overflow-hidden z-20"
          style={{ background: 'var(--surface)', border: '1px solid var(--light-gray)', borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
          <div className="p-2">
            <input type="text" placeholder="Search country..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ ...inputStyle, height: 40, borderRadius: 10 }} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.country_code}
                onClick={() => { onChange(c.country_code); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: 'var(--font)', color: c.country_code === value ? '#FF6B00' : 'var(--title-color)', background: 'none', border: 'none' }}>
                <span>{c.flag_emoji}</span><span>{c.country_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ErrorBanner({ error }) {
  if (!error) return null;
  return (
    <div className="mb-4 px-4 py-3 text-sm" style={{
      background: 'rgba(255,59,48,0.1)', borderRadius: 14,
      color: '#FF3B30', fontFamily: 'var(--font)',
    }}>
      {error}
    </div>
  );
}

// ━━━━━━━━━━━ MAIN AUTH PAGE ━━━━━━━━━━━

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const addProfile = location.state?.addProfile || false;
  const invitedBy = location.state?.invitedBy || '';
  const { setToken, setParentToken, setUserData, token, parentToken, fetchLinkedProfiles } = useTheme();
  const [phase, setPhase] = useState(addProfile ? 'childModal' : 'ageGate');
  const [error, setError] = useState('');
  const [enteredAge, setEnteredAge] = useState('');
  const [parentCountry, setParentCountry] = useState('');
  const [parentTokenLocal, setParentTokenLocal] = useState(parentToken || token || '');

  const connectWithInviter = async (tkn) => {
    if (!invitedBy) return;
    try {
      await axios.post(`${BACKEND_URL}/api/invite/connect/${invitedBy}`, {}, {
        headers: { Authorization: `Bearer ${tkn}` },
      });
    } catch {}
  };

  return (
    <div data-testid="auth-page" className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}>
      <div className="relative z-10 flex-1 flex flex-col" style={{ padding: '24px 20px' }}>
        <AnimatePresence mode="wait">
          {phase === 'ageGate' && (
            <AgeGateScreen key="ageGate" setPhase={setPhase} enteredAge={enteredAge}
              setEnteredAge={setEnteredAge} setError={setError} />
          )}
          {phase === 'selfSignup' && (
            <SelfSignupScreen key="selfSignup" setPhase={setPhase} age={enteredAge}
              setToken={setToken} setUserData={setUserData} navigate={navigate}
              error={error} setError={setError} connectWithInviter={connectWithInviter}
              fetchLinkedProfiles={fetchLinkedProfiles} />
          )}
          {phase === 'parentHandoff' && (
            <ParentHandoffScreen key="parentHandoff" setPhase={setPhase} />
          )}
          {phase === 'parentDetails' && (
            <ParentDetailsScreen key="parentDetails" setPhase={setPhase}
              setToken={setToken} setParentToken={setParentToken} setUserData={setUserData}
              error={error} setError={setError} setParentCountry={setParentCountry}
              setParentTokenLocal={setParentTokenLocal} />
          )}
          {phase === 'childModal' && (
          <ChildProfileModal key="childModal"
              parentTokenLocal={addProfile ? (parentToken || token) : parentTokenLocal}
              childAge={enteredAge} parentCountry={parentCountry}
              setToken={setToken} setUserData={setUserData} navigate={navigate}
              fetchLinkedProfiles={fetchLinkedProfiles}
              connectWithInviter={connectWithInviter} />
          )}
          {phase === 'login' && (
            <LoginScreen key="login" setPhase={setPhase} setToken={setToken}
              setParentToken={setParentToken} setUserData={setUserData} navigate={navigate}
              error={error} setError={setError} fetchLinkedProfiles={fetchLinkedProfiles} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━ SCREEN 1: AGE GATE ━━━━━━━━━━━

function AgeGateScreen({ setPhase, enteredAge, setEnteredAge, setError }) {
  const canContinue = enteredAge && parseInt(enteredAge) >= 5 && parseInt(enteredAge) <= 99;

  const handleContinue = () => {
    const age = parseInt(enteredAge);
    if (age >= 14) {
      setPhase('selfSignup');
    } else {
      setPhase('parentHandoff');
    }
    setError('');
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="mb-10 mt-4">
        <Wordmark />
      </div>

      <div className="flex-1 flex flex-col justify-center" style={{ marginTop: -60 }}>
        <h1 style={{
          fontFamily: 'var(--font)', fontSize: 36, fontWeight: 700,
          color: '#ffffff', marginBottom: 12, lineHeight: 1.15,
        }}>
          How old are you?
        </h1>
        <p style={{
          fontFamily: 'var(--font)', fontSize: 16, color: 'rgba(255,255,255,0.6)',
          marginBottom: 40, lineHeight: 1.6,
        }}>
          We'll set up the right experience for your age.
        </p>

        <input
          type="number"
          min="5"
          max="99"
          placeholder="Enter your age"
          value={enteredAge}
          onChange={e => setEnteredAge(e.target.value)}
          className={inputClass}
          style={{
            ...inputStyle,
            background: 'rgba(255,255,255,0.08)',
            color: '#ffffff',
            height: 60,
            fontSize: 20,
            textAlign: 'center',
            borderRadius: 16,
            marginBottom: 20,
          }}
        />

        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className={btnPrimary}
          style={{
            fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
            height: 56, borderRadius: 28,
            background: canContinue ? '#FF6B00' : 'rgba(255,255,255,0.1)',
            color: canContinue ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            border: 'none',
          }}>
          Continue →
        </button>
      </div>

      <div className="mt-auto pt-6 text-center">
        <button onClick={() => setPhase('login')}
          className="text-sm cursor-pointer"
          style={{
            fontFamily: 'var(--font)', background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.5)',
          }}>
          Already have an account? <span style={{ color: '#FF6B00', fontWeight: 600 }}>Log in</span>
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━ SCREEN 2A: SELF SIGNUP (14+) ━━━━━━━━━━━

function SelfSignupScreen({ setPhase, age, setToken, setUserData, navigate, error, setError, connectWithInviter, fetchLinkedProfiles }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', gender: '', city: '', country_code: '' });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);

  const canSubmit = form.full_name && form.email && form.password.length >= 8 && form.gender && form.country_code;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        age: parseInt(age),
        gender: form.gender,
        country_code: form.country_code,
        city: form.city || '',
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      };
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-self`, payload);
      setToken(res.data.token);
      setUserData(res.data.user);
      await connectWithInviter(res.data.token);
      fetchLinkedProfiles(res.data.token);
      navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Registration failed'));
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setPhase('ageGate')} className="p-2 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <Wordmark />
      </div>
      <ProgressDots current={1} total={1} />

      <h2 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
        Create your profile
      </h2>
      <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
        Set up your personalised news experience.
      </p>

      <ErrorBanner error={error} />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Full Name</label>
          <input placeholder="Your full name" value={form.full_name} onChange={e => u('full_name', e.target.value)}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Email</label>
          <input type="email" placeholder="you@example.com" value={form.email} onChange={e => u('email', e.target.value)}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password}
              onChange={e => u('password', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', paddingRight: '3rem' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ background: 'none', border: 'none' }}>
              <F7Icon name={showPass ? 'eye_slash' : 'eye'} size={18} color="rgba(255,255,255,0.4)" />
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Gender</label>
          <ToggleButtons options={GENDER_OPTIONS} value={form.gender} onChange={v => u('gender', v)} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Country</label>
          <CountryDropdown countries={countries} value={form.country_code} onChange={v => u('country_code', v)} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>City <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <input placeholder="Your city" value={form.city} onChange={e => u('city', e.target.value)}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
      </div>

      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading} className={btnPrimary}
          style={{
            fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
            height: 56, borderRadius: 28,
            background: canSubmit ? '#FF6B00' : 'rgba(255,255,255,0.1)',
            color: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            border: 'none',
          }}>
          {loading ? 'Creating...' : 'Create Profile →'}
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━ SCREEN 2B: PARENT HANDOFF ━━━━━━━━━━━

function ParentHandoffScreen({ setPhase }) {
  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col items-center justify-center text-center">
      <div className="mb-4">
        <button onClick={() => setPhase('ageGate')} className="p-2 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="rgba(255,255,255,0.7)" />
        </button>
      </div>

      <span style={{ fontSize: 64, marginBottom: 24 }}>🤝</span>

      <h1 style={{
        fontFamily: 'var(--font)', fontSize: 28, fontWeight: 700,
        color: '#ffffff', marginBottom: 12,
      }}>
        Ask a parent to help
      </h1>
      <p style={{
        fontFamily: 'var(--font)', fontSize: 16, color: 'rgba(255,255,255,0.6)',
        marginBottom: 40, lineHeight: 1.6, maxWidth: 320,
      }}>
        You need to be 14+ to sign up on your own. Hand your phone to a parent or guardian — they'll set up your account.
      </p>

      <button onClick={() => setPhase('parentDetails')} className={btnPrimary}
        style={{
          fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
          height: 56, borderRadius: 28,
          background: '#FF6B00', color: '#FFFFFF', border: 'none',
          width: '100%', maxWidth: 340,
        }}>
        Continue as Parent →
      </button>

      <button onClick={() => setPhase('ageGate')}
        className="mt-4 text-sm cursor-pointer"
        style={{ fontFamily: 'var(--font)', color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none' }}>
        ← Back to age gate
      </button>
    </motion.div>
  );
}

// ━━━━━━━━━━━ SCREEN 3: PARENT DETAILS ━━━━━━━━━━━

function ParentDetailsScreen({ setPhase, setToken, setParentToken, setUserData, error, setError, setParentCountry, setParentTokenLocal }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', password: '', country_code: '' });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);

  const canSubmit = form.full_name && form.email && form.password.length >= 8 && form.country_code;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        full_name: form.full_name,
        email: form.email,
        password: form.password,
        dob: '',
        gender: '',
        city: '',
        country: form.country_code,
        account_type: 'parent',
      };
      const res = await axios.post(`${BACKEND_URL}/api/auth/register`, payload);
      const tkn = res.data.token;
      setToken(tkn);
      setParentToken(tkn);
      setParentTokenLocal(tkn);
      setUserData(res.data.user);
      setParentCountry(form.country_code);
      setError('');
      setPhase('childModal');
    } catch (e) {
      const detail = e.response?.data?.detail;
      const errors = e.response?.data?.errors;
      let msg = 'Registration failed';
      if (errors && typeof errors === 'object') msg = Object.values(errors).join(', ');
      else if (Array.isArray(detail)) msg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      else if (typeof detail === 'string') msg = detail;
      else if (e.response?.data?.error) msg = e.response.data.error;
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-2">
        <button onClick={() => setPhase('parentHandoff')} className="p-2 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <Wordmark />
      </div>
      <ProgressDots current={1} total={2} />

      <h2 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
        Parent details
      </h2>
      <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
        We'll use this to set up your child's account.
      </p>

      <ErrorBanner error={error} />

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Full Name</label>
          <input placeholder="Parent full name" value={form.full_name} onChange={e => u('full_name', e.target.value)}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Email</label>
          <input type="email" placeholder="parent@example.com" value={form.email} onChange={e => u('email', e.target.value)}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password}
              onChange={e => u('password', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', paddingRight: '3rem' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ background: 'none', border: 'none' }}>
              <F7Icon name={showPass ? 'eye_slash' : 'eye'} size={18} color="rgba(255,255,255,0.4)" />
            </button>
          </div>
        </div>
        <div>
          <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Country</label>
          <CountryDropdown countries={countries} value={form.country_code} onChange={v => u('country_code', v)} />
        </div>
      </div>

      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading} className={btnPrimary}
          style={{
            fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
            height: 56, borderRadius: 28,
            background: canSubmit ? '#FF6B00' : 'rgba(255,255,255,0.1)',
            color: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
            border: 'none',
          }}>
          {loading ? 'Setting up...' : 'Continue →'}
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━ CHILD PROFILE SETUP MODAL ━━━━━━━━━━━

function ChildProfileModal({ parentTokenLocal, childAge, parentCountry, setToken, setUserData, navigate, fetchLinkedProfiles, connectWithInviter }) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [form, setForm] = useState({
    name: '', age: childAge || '', gender: '', city: '', username: '',
  });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setLocalError(''); };

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);

  // Auto-suggest username from name
  useEffect(() => {
    if (form.name && !form.username) {
      const suggested = form.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      setForm(p => ({ ...p, username: suggested }));
    }
  }, [form.name]);

  const canSubmit = form.name && form.age && form.gender;

  const handleSubmit = async () => {
    // Client-side validation for child fields only
    if (!form.name.trim()) { setLocalError("Child's name is required"); return; }
    if (!form.age || parseInt(form.age) < 3 || parseInt(form.age) > 13) { setLocalError("Age must be between 3 and 13"); return; }
    if (!form.gender) { setLocalError("Please select a gender"); return; }
    setLoading(true); setLocalError('');
    try {
      const payload = {
        children: [{
          full_name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          city: form.city || '',
          username: form.username || '',
          country_code: parentCountry || '',
        }],
      };
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-child`, payload, {
        headers: { Authorization: `Bearer ${parentTokenLocal}` },
      });
      // Switch to child profile
      const childUser = res.data.user || res.data.children?.[0];
      const childToken = res.data.token;
      if (childToken) setToken(childToken);
      if (childUser) setUserData(childUser);
      await fetchLinkedProfiles(parentTokenLocal);
      if (connectWithInviter && childToken) await connectWithInviter(childToken);
      navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      const errors = e.response?.data?.errors;
      let msg = 'Failed to create profile';
      if (errors && typeof errors === 'object') {
        const childKeys = ['children', 'child_name', 'child_age', 'child_gender', 'age', 'name', 'gender', 'city', 'username'];
        const filtered = Object.entries(errors)
          .filter(([k]) => childKeys.some(ck => k.toLowerCase().includes(ck)))
          .map(([, v]) => v);
        msg = filtered.length > 0 ? filtered.join(', ') : Object.values(errors).join(', ');
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'string') {
        msg = detail;
      } else if (e.response?.data?.error) msg = e.response.data.error;
      // Filter out any parent-related error messages that leak from backend
      const parentPhrases = ["parent's name", "parent name", "parent email", "parent password"];
      if (parentPhrases.some(p => msg.toLowerCase().includes(p))) msg = 'Failed to create profile. Please try again.';
      if (msg) setLocalError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
    >
      <div className="w-full max-w-[430px] max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          borderRadius: '24px 24px 0 0',
          padding: '28px 20px 32px',
        }}>
        {/* Drag handle */}
        <div className="flex justify-center mb-5">
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        <ProgressDots current={2} total={2} />

        <h2 style={{ fontFamily: 'var(--font)', fontSize: 24, fontWeight: 700, color: '#ffffff', marginBottom: 6 }}>
          Now let's set up your child's profile 👦
        </h2>
        <p style={{ fontFamily: 'var(--font)', fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
          This creates your child's personalised news experience.
        </p>

        <ErrorBanner error={localError} />

        <div className="space-y-4">
          <div>
            <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Child's Name</label>
            <input placeholder="Full name" value={form.name} onChange={e => u('name', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Age</label>
            <input type="number" min="5" max="17" placeholder="Child's age" value={form.age}
              onChange={e => u('age', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Gender</label>
            <ToggleButtons options={GENDER_OPTIONS} value={form.gender} onChange={v => u('gender', v)} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>City <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <input placeholder="City" value={form.city} onChange={e => u('city', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
          <div>
            <label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: 6, display: 'block' }}>Username</label>
            <input placeholder="Username" value={form.username} onChange={e => u('username', e.target.value)}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
          </div>
        </div>

        <div className="mt-6">
          <button onClick={handleSubmit} disabled={!canSubmit || loading} className={btnPrimary}
            style={{
              fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
              height: 56, borderRadius: 28,
              background: canSubmit ? '#FF6B00' : 'rgba(255,255,255,0.1)',
              color: canSubmit ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
              border: 'none',
            }}>
            {loading ? 'Creating...' : 'Set up profile →'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━ LOGIN SCREEN ━━━━━━━━━━━

function LoginScreen({ setPhase, setToken, setParentToken, setUserData, navigate, error, setError, fetchLinkedProfiles }) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState(null);
  const [loginToken, setLoginToken] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true); setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      const { token, user, linked_profiles, account_type, profiles: responseProfiles, parent_token: respParentToken } = res.data;
      if (account_type === 'parent' || user?.account_type === 'parent') {
        const parentJwt = respParentToken || token;
        setLoginToken(parentJwt);
        const profs = responseProfiles || linked_profiles || [];
        setProfiles(profs);
        if (parentJwt) setParentToken(parentJwt);
      } else {
        setToken(token); setUserData(user); fetchLinkedProfiles(token); navigate('/feed');
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Login failed'));
    }
    setLoading(false);
  };

  const handlePickProfile = async (profile) => {
    setSwitching(profile.id);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`,
        { target_user_id: profile.id },
        { headers: { Authorization: `Bearer ${loginToken}` } });
      const newToken = res.data.token || loginToken;
      setToken(newToken); setParentToken(loginToken);
      if (res.data.user) setUserData(res.data.user);
      else {
        const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } });
        setUserData(meRes.data);
      }
      fetchLinkedProfiles(loginToken); navigate('/feed');
    } catch {
      setToken('session_' + profile.id); setUserData(profile); navigate('/feed');
    }
    setSwitching(null);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotSent(true);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to send reset email');
    }
    setForgotLoading(false);
  };

  // Profile picker after parent login
  if (profiles && profiles.length > 0) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col">
        <h2 style={{ fontFamily: 'var(--font)', fontSize: 26, fontWeight: 700, color: '#ffffff', textAlign: 'center', marginBottom: 8 }}>
          Who's reading today? 📖
        </h2>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 }}>
          Pick a profile to continue.
        </p>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {profiles.map((profile) => {
            const isSwitching = switching === profile.id;
            return (
              <button key={profile.id} onClick={() => handlePickProfile(profile)} disabled={isSwitching}
                className="w-full flex items-center gap-4 p-5 cursor-pointer"
                style={{
                  background: 'rgba(255,255,255,0.06)', borderRadius: 18, border: 'none',
                  opacity: isSwitching ? 0.6 : 1,
                }}>
                <AvatarCircle name={profile.full_name} avatarId={null} size={52} bordered={false} />
                <div className="flex-1 text-left">
                  <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: '#ffffff' }}>
                    {profile.full_name}
                  </p>
                </div>
                <F7Icon name="arrow_right" size={18} color="rgba(255,255,255,0.4)" />
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Forgot password
  if (forgotMode) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }}
            className="p-2 cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: 'none' }}>
            <F7Icon name="arrow_left" size={18} color="rgba(255,255,255,0.7)" />
          </button>
          <Wordmark />
        </div>
        {forgotSent ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📬</span>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Check your email!</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
              We've sent a password reset link to <strong style={{ color: '#fff' }}>{forgotEmail}</strong>
            </p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 22, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Forgot your password?</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 24, lineHeight: 1.6 }}>
              Enter your email and we'll send a reset link.
            </p>
            <ErrorBanner error={error} />
            <div className="relative mb-6">
              <input type="email" placeholder="Your email address" value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
            </div>
            <button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail} className={btnPrimary}
              style={{
                fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
                height: 56, borderRadius: 28,
                background: forgotEmail ? '#FF6B00' : 'rgba(255,255,255,0.1)',
                color: forgotEmail ? '#FFFFFF' : 'rgba(255,255,255,0.3)',
                border: 'none',
              }}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </>
        )}
      </motion.div>
    );
  }

  // Main login form
  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPhase('ageGate')} className="p-2 cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 12, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="rgba(255,255,255,0.7)" />
        </button>
        <Wordmark />
      </div>

      <div className="flex-1 flex flex-col justify-center" style={{ marginTop: -40 }}>
        <h2 style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
          Welcome back 👋
        </h2>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'rgba(255,255,255,0.5)', marginBottom: 32, lineHeight: 1.6 }}>
          Pick up where you left off.
        </p>

        <ErrorBanner error={error} />

        <div className="space-y-3 mb-6">
          <input type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff' }} />
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className={inputClass} style={{ ...inputStyle, background: 'rgba(255,255,255,0.08)', color: '#fff', paddingRight: '3rem' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
              style={{ background: 'none', border: 'none' }}>
              <F7Icon name={showPass ? 'eye_slash' : 'eye'} size={18} color="rgba(255,255,255,0.4)" />
            </button>
          </div>
        </div>

        <button onClick={handleLogin} disabled={loading} className={btnPrimary}
          style={{
            fontFamily: 'var(--font)', fontSize: 16, fontWeight: 600,
            height: 56, borderRadius: 28,
            background: '#FF6B00', color: '#FFFFFF', border: 'none',
          }}>
          {loading ? 'Signing in...' : 'Log in →'}
        </button>

        <button onClick={() => { setForgotMode(true); setError(''); }}
          className="mt-4 text-sm text-center w-full cursor-pointer"
          style={{ fontFamily: 'var(--font)', color: '#FF6B00', background: 'none', border: 'none' }}>
          Forgot password?
        </button>

        <button onClick={() => setPhase('ageGate')}
          className="mt-3 text-sm text-center w-full cursor-pointer"
          style={{ fontFamily: 'var(--font)', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none' }}>
          Don't have an account? <span style={{ color: '#FF6B00', fontWeight: 600 }}>Sign up</span>
        </button>
      </div>
    </motion.div>
  );
}
