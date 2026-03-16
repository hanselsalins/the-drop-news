import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock, User, ChevronDown, Check, Sparkles, UserPlus, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ━━━ Shared styles (light theme) ━━━
const inputStyle = {
  background: '#F8FAFC',
  border: '1.5px solid #E2E8F0',
  borderRadius: '16px',
  color: '#0F172A',
  fontFamily: 'Outfit, sans-serif',
};
const inputClass = "w-full px-4 py-3.5 text-base outline-none placeholder:text-slate-400 focus:border-blue-400";
const btnPrimary = "w-full py-4 rounded-2xl text-base font-bold tracking-wide flex items-center justify-center gap-2 transition-all";

const slideIn = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
  transition: { duration: 0.3 },
};

const GENDER_OPTIONS_FULL = ['Boy', 'Girl', 'Prefer not to say'];
const GENDER_OPTIONS_CHILD = ['Boy', 'Girl'];
const RELATION_OPTIONS = ['Mother', 'Father', 'Guardian'];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const invitedBy = location.state?.invitedBy || '';
  const addProfile = location.state?.addProfile || false;
  const { setToken, setUserData, token } = useTheme();
  const [phase, setPhase] = useState(addProfile ? 'gate' : 'gate');
  const [error, setError] = useState('');

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
      style={{ background: '#FFFFFF' }}>
      {/* Background decorations */}
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-20 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full opacity-15 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }} />

      <div className="relative z-10 flex-1 flex flex-col px-5 py-6">
        <AnimatePresence mode="wait">
          {phase === 'gate' && <GateScreen key="gate" setPhase={setPhase} />}
          {phase === 'self' && (
            <SelfSignup key="self" setPhase={setPhase} setToken={setToken} setUserData={setUserData}
              navigate={navigate} error={error} setError={setError} connectWithInviter={connectWithInviter}
              existingToken={addProfile ? token : null} />
          )}
          {phase === 'child' && (
            <ChildSignup key="child" setPhase={setPhase} setToken={setToken} setUserData={setUserData}
              navigate={navigate} error={error} setError={setError} connectWithInviter={connectWithInviter}
              existingToken={addProfile ? token : null} />
          )}
          {phase === 'login' && (
            <LoginForm key="login" setPhase={setPhase} setToken={setToken} setUserData={setUserData}
              navigate={navigate} error={error} setError={setError} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ PROGRESS BAR ━━━━━━━━━━━━━━━━━━━
function ProgressBar({ current, total }) {
  return (
    <div className="flex gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
          style={{
            background: i < current
              ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)'
              : '#E2E8F0',
          }}
        />
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ TOGGLE BUTTONS ━━━━━━━━━━━━━━━━━━━
function ToggleButtons({ options, value, onChange, columns = options.length }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="py-3 px-4 rounded-2xl text-sm font-semibold transition-all"
          style={{
            fontFamily: 'Outfit, sans-serif',
            background: value === opt ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#F1F5F9',
            color: value === opt ? '#FFFFFF' : '#64748B',
            border: value === opt ? 'none' : '1.5px solid #E2E8F0',
            transform: value === opt ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ COUNTRY DROPDOWN ━━━━━━━━━━━━━━━━━━━
function CountryDropdown({ countries, value, onChange, testPrefix = '' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = countries.find(c => c.country_code === value);
  const filtered = search
    ? countries.filter(c => c.country_name.toLowerCase().includes(search.toLowerCase()))
    : countries;

  return (
    <div className="relative">
      <button
        type="button"
        data-testid={`${testPrefix}country-selector`}
        onClick={() => setOpen(!open)}
        className={`${inputClass} text-left flex items-center justify-between`}
        style={inputStyle}
      >
        <span style={{ opacity: selected ? 1 : 0.4, color: selected ? '#0F172A' : '#94A3B8' }}>
          {selected ? `${selected.flag_emoji} ${selected.country_name}` : 'Select country'}
        </span>
        <ChevronDown size={16} style={{ color: '#94A3B8', transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-2xl overflow-hidden z-20"
          style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0', boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}>
          <div className="p-2">
            <input
              type="text"
              placeholder="Search country..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button
                key={c.country_code}
                data-testid={`${testPrefix}country-${c.country_code}`}
                onClick={() => { onChange(c.country_code); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-blue-50 transition-colors"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  color: c.country_code === value ? '#3B82F6' : '#0F172A',
                  background: c.country_code === value ? '#EFF6FF' : 'transparent',
                }}
              >
                <span>{c.flag_emoji}</span><span>{c.country_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ GATE SCREEN ━━━━━━━━━━━━━━━━━━━
function GateScreen({ setPhase }) {
  const [ageGroup, setAgeGroup] = useState(null); // 'under13' | '13plus'
  const [signupType, setSignupType] = useState(null); // 'self' | 'child'

  const handleContinue = () => {
    if (ageGroup === 'under13' || signupType === 'child') {
      setPhase('child');
    } else {
      setPhase('self');
    }
  };

  const canContinue = ageGroup && (ageGroup === 'under13' ? true : !!signupType);

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      {/* Logo */}
      <div className="mb-2">
        <span className="text-xs font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#3B82F6' }}>THE DROP</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
        style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
        Welcome! 👋
      </h1>
      <p className="text-base mb-8" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
        Let's get you set up with the right experience.
      </p>

      {/* Age question */}
      <div className="mb-6">
        <p className="text-sm font-semibold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
          How old are you?
        </p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: 'under13', label: 'Under 13', emoji: '🧒', desc: 'Kid-friendly experience' },
            { id: '13plus', label: '13 and above', emoji: '🧑', desc: 'Full experience' },
          ].map(opt => (
            <button
              key={opt.id}
              data-testid={`age-${opt.id}`}
              onClick={() => { setAgeGroup(opt.id); if (opt.id === 'under13') setSignupType('child'); else setSignupType(null); }}
              className="p-4 rounded-2xl text-left transition-all"
              style={{
                background: ageGroup === opt.id ? 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' : '#F8FAFC',
                border: ageGroup === opt.id ? '2px solid #3B82F6' : '1.5px solid #E2E8F0',
                transform: ageGroup === opt.id ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span className="text-2xl mb-2 block">{opt.emoji}</span>
              <p className="text-base font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>{opt.label}</p>
              <p className="text-xs mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Signup type — only show for 13+ */}
      <AnimatePresence>
        {ageGroup === '13plus' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <p className="text-sm font-semibold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
              Who is this account for?
            </p>
            <div className="space-y-3">
              {[
                { id: 'self', icon: <UserPlus size={22} style={{ color: '#3B82F6' }} />, label: "I'm signing up for myself", desc: "Create your own account" },
                { id: 'child', icon: <Users size={22} style={{ color: '#8B5CF6' }} />, label: "I'm signing up for my child", desc: "Set up an account as a parent or guardian" },
              ].map(opt => (
                <button
                  key={opt.id}
                  data-testid={`signup-type-${opt.id}`}
                  onClick={() => setSignupType(opt.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: signupType === opt.id ? 'linear-gradient(135deg, #EFF6FF, #F5F3FF)' : '#F8FAFC',
                    border: signupType === opt.id ? '2px solid #3B82F6' : '1.5px solid #E2E8F0',
                  }}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: signupType === opt.id ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#F1F5F9' }}>
                    {signupType === opt.id
                      ? <opt.icon.type {...opt.icon.props} style={{ color: '#FFFFFF' }} />
                      : opt.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>{opt.label}</p>
                    <p className="text-xs mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>{opt.desc}</p>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                    style={{
                      borderColor: signupType === opt.id ? '#3B82F6' : '#CBD5E1',
                      background: signupType === opt.id ? '#3B82F6' : 'transparent',
                    }}>
                    {signupType === opt.id && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Under 13 auto-message */}
      <AnimatePresence>
        {ageGroup === 'under13' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-4 rounded-2xl" style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5' }}>
              <p className="text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#9A3412' }}>
                🛡️ Since you're under 13, a parent or guardian will need to set up your account. Don't worry — the app will still be in your name!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto space-y-3">
        <button
          data-testid="gate-continue"
          onClick={handleContinue}
          disabled={!canContinue}
          className={btnPrimary}
          style={{
            background: canContinue ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#E2E8F0',
            color: canContinue ? '#FFFFFF' : '#94A3B8',
            fontFamily: 'Fredoka, sans-serif',
          }}
        >
          Continue <ArrowRight size={18} />
        </button>

        <button
          data-testid="gate-login-link"
          onClick={() => setPhase('login')}
          className="w-full text-sm py-2 transition-opacity"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}
        >
          Already have an account? <span style={{ color: '#3B82F6', fontWeight: 600 }}>Log in</span>
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ PATH A — SELF SIGNUP ━━━━━━━━━━━━━━━━━━━
function SelfSignup({ setPhase, setToken, setUserData, navigate, error, setError, connectWithInviter, existingToken }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', age: '', gender: '', password: '', country_code: '',
  });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`)
      .then(r => setCountries(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Failed to fetch countries:', e));
  }, []);

  const canSubmit = form.name && form.email && form.age && form.gender && form.password.length >= 6 && form.country_code;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        age: parseInt(form.age),
        gender: form.gender,
        country_code: form.country_code,
      };
      const headers = existingToken ? { Authorization: `Bearer ${existingToken}` } : {};
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-self`, payload, { headers });
      setToken(res.data.token);
      setUserData(res.data.user);
      await connectWithInviter(res.data.token);
      navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Registration failed');
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button data-testid="self-back" onClick={() => setPhase('gate')}
          className="p-2 rounded-xl" style={{ background: '#F1F5F9' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
            Create your account
          </p>
        </div>
      </div>

      <ProgressBar current={1} total={1} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {/* Name */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Name</label>
          <input data-testid="self-name" placeholder="Your name" value={form.name}
            onChange={e => u('name', e.target.value)} className={inputClass} style={inputStyle} />
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Email address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input data-testid="self-email" type="email" placeholder="you@example.com" value={form.email}
              onChange={e => u('email', e.target.value)} className={inputClass}
              style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Age</label>
          <input data-testid="self-age" type="number" min="5" max="99" placeholder="Your age" value={form.age}
            onChange={e => u('age', e.target.value)} className={inputClass} style={inputStyle} />
        </div>

        {/* Gender */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Gender</label>
          <ToggleButtons options={GENDER_OPTIONS_FULL} value={form.gender} onChange={v => u('gender', v)} columns={3} />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
            <input data-testid="self-password" type={showPass ? 'text' : 'password'}
              placeholder="Min 6 characters" value={form.password}
              onChange={e => u('password', e.target.value)} className={inputClass}
              style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPass ? <EyeOff size={16} style={{ color: '#94A3B8' }} /> : <Eye size={16} style={{ color: '#94A3B8' }} />}
            </button>
          </div>
        </div>

        {/* Country */}
        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Country</label>
          <CountryDropdown countries={countries} value={form.country_code} onChange={v => u('country_code', v)} testPrefix="self-" />
        </div>
      </div>

      <div className="pt-4">
        <button data-testid="self-submit" onClick={handleSubmit} disabled={!canSubmit || loading}
          className={btnPrimary}
          style={{
            background: canSubmit ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#E2E8F0',
            color: canSubmit ? '#FFFFFF' : '#94A3B8',
            fontFamily: 'Fredoka, sans-serif',
          }}>
          {loading ? 'Creating account...' : 'Create Account'} {!loading && <Sparkles size={18} />}
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ PATH B — CHILD SIGNUP ━━━━━━━━━━━━━━━━━━━
function ChildSignup({ setPhase, setToken, setUserData, navigate, error, setError, connectWithInviter, existingToken }) {
  const [step, setStep] = useState(1); // 1 = child details, 2 = parent details
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    child_name: '', child_age: '', child_gender: '', child_country_code: '',
    parent_name: '', parent_relation: '', parent_email: '', parent_password: '',
  });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`)
      .then(r => setCountries(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Failed to fetch countries:', e));
  }, []);

  const canStep1 = form.child_name && form.child_age && form.child_gender && form.child_country_code;
  const canStep2 = form.parent_name && form.parent_relation && form.parent_email && form.parent_password.length >= 6;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        child_name: form.child_name,
        child_age: parseInt(form.child_age),
        child_gender: form.child_gender,
        child_country_code: form.child_country_code,
        parent_name: form.parent_name,
        parent_email: form.parent_email,
        parent_password: form.parent_password,
        parent_relation: form.parent_relation,
      };
      const headers = existingToken ? { Authorization: `Bearer ${existingToken}` } : {};
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-child`, payload, { headers });
      setToken(res.data.token);
      setUserData(res.data.user);
      await connectWithInviter(res.data.token);
      navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Registration failed');
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button data-testid="child-back" onClick={() => step > 1 ? setStep(step - 1) : setPhase('gate')}
          className="p-2 rounded-xl" style={{ background: '#F1F5F9' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
            {step === 1 ? "Child's Details" : "Parent / Guardian Details"}
          </p>
        </div>
      </div>

      <ProgressBar current={step} total={2} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Step 1: Child's details */}
        {step === 1 && (
          <motion.div key="c1" {...slideIn} className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
              Tell us about your child 🧒
            </h2>
            <p className="text-sm mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              The account will be created in their name.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Child's Name</label>
                <input data-testid="child-name" placeholder="First name" value={form.child_name}
                  onChange={e => u('child_name', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Age</label>
                <input data-testid="child-age" type="number" min="5" max="17" placeholder="Child's age" value={form.child_age}
                  onChange={e => u('child_age', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Gender</label>
                <ToggleButtons options={GENDER_OPTIONS_CHILD} value={form.child_gender} onChange={v => u('child_gender', v)} columns={2} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Country</label>
                <CountryDropdown countries={countries} value={form.child_country_code} onChange={v => u('child_country_code', v)} testPrefix="child-" />
              </div>
            </div>

            <div className="pt-4">
              <button data-testid="child-step1-next" onClick={() => setStep(2)} disabled={!canStep1}
                className={btnPrimary}
                style={{
                  background: canStep1 ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#E2E8F0',
                  color: canStep1 ? '#FFFFFF' : '#94A3B8',
                  fontFamily: 'Fredoka, sans-serif',
                }}>
                Next: Parent Details <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2: Parent details */}
        {step === 2 && (
          <motion.div key="c2" {...slideIn} className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
              Parent / Guardian 🛡️
            </h2>
            <p className="text-sm mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              You'll use these details to log in.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Your Name</label>
                <input data-testid="parent-name" placeholder="Parent's name" value={form.parent_name}
                  onChange={e => u('parent_name', e.target.value)} className={inputClass} style={inputStyle} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Relation</label>
                <ToggleButtons options={RELATION_OPTIONS} value={form.parent_relation} onChange={v => u('parent_relation', v)} columns={3} />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                  <input data-testid="parent-email" type="email" placeholder="parent@example.com" value={form.parent_email}
                    onChange={e => u('parent_email', e.target.value)} className={inputClass}
                    style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
                  <input data-testid="parent-password" type={showPass ? 'text' : 'password'}
                    placeholder="Min 6 characters" value={form.parent_password}
                    onChange={e => u('parent_password', e.target.value)} className={inputClass}
                    style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff size={16} style={{ color: '#94A3B8' }} /> : <Eye size={16} style={{ color: '#94A3B8' }} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button data-testid="child-submit" onClick={handleSubmit} disabled={!canStep2 || loading}
                className={btnPrimary}
                style={{
                  background: canStep2 ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#E2E8F0',
                  color: canStep2 ? '#FFFFFF' : '#94A3B8',
                  fontFamily: 'Fredoka, sans-serif',
                }}>
                {loading ? 'Creating account...' : 'Create Account'} {!loading && <Sparkles size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ LOGIN FORM ━━━━━━━━━━━━━━━━━━━
function LoginForm({ setPhase, setToken, setUserData, navigate, error, setError }) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState(null); // null = not yet, [] = no profiles
  const [loginToken, setLoginToken] = useState(null);
  const [loginUser, setLoginUser] = useState(null);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      const { token, user, linked_profiles } = res.data;
      
      if (linked_profiles && linked_profiles.length > 0) {
        // Show profile picker
        setLoginToken(token);
        setLoginUser(user);
        setProfiles([user, ...linked_profiles]);
      } else {
        setToken(token);
        setUserData(user);
        navigate('/feed');
      }
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : 'Login failed'));
    }
    setLoading(false);
  };

  const handlePickProfile = async (profile) => {
    if (profile.id === loginUser?.id) {
      // Current user, just proceed
      setToken(loginToken);
      setUserData(loginUser);
      navigate('/feed');
      return;
    }
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`, 
        { target_user_id: profile.id },
        { headers: { Authorization: `Bearer ${loginToken}` } }
      );
      setToken(res.data.token || loginToken);
      setUserData(res.data.user || profile);
      navigate('/feed');
    } catch {
      setToken(loginToken);
      setUserData(loginUser);
      navigate('/feed');
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email: forgotEmail });
      setForgotSent(true);
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : 'Failed to send reset email'));
    }
    setForgotLoading(false);
  };

  // Profile picker screen
  if (profiles && profiles.length > 0) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
          Who's reading today? 📖
        </h2>
        <p className="text-sm mb-8 text-center" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
          Pick your profile to continue.
        </p>

        <div className="space-y-3">
          {profiles.map((profile) => (
            <button
              key={profile.id}
              data-testid={`profile-pick-${profile.id}`}
              onClick={() => handlePickProfile(profile)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all hover:shadow-md"
              style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
            >
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  padding: 2,
                }}>
                <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden"
                  style={{ background: '#FFFFFF' }}>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#3B82F6' }}>
                      {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex-1 text-left">
                <p className="text-base font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
                  {profile.full_name}
                </p>
                <p className="text-xs mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
                  {profile.age_group || 'Reader'}
                </p>
              </div>
              <ArrowRight size={18} style={{ color: '#CBD5E1' }} />
            </button>
          ))}
        </div>
      </motion.div>
    );
  }

  // Forgot password screen
  if (forgotMode) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }}
            className="p-2 rounded-xl" style={{ background: '#F1F5F9' }}>
            <ArrowLeft size={18} color="#64748B" />
          </button>
          <span className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>Reset Password</span>
        </div>

        {forgotSent ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📬</span>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>Check your email!</h2>
            <p className="text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              We've sent a password reset link to <strong>{forgotEmail}</strong>
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
              Forgot your password?
            </h2>
            <p className="text-sm mb-6" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
                style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>
                {error}
              </div>
            )}

            <div className="relative mb-6">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
              <input type="email" placeholder="Your email address" value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
            </div>

            <button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail}
              className={btnPrimary}
              style={{
                background: forgotEmail ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#E2E8F0',
                color: forgotEmail ? '#FFFFFF' : '#94A3B8',
                fontFamily: 'Fredoka, sans-serif',
              }}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-6">
        <button data-testid="login-back" onClick={() => setPhase('gate')}
          className="p-2 rounded-xl" style={{ background: '#F1F5F9' }}>
          <ArrowLeft size={18} color="#64748B" />
        </button>
        <span className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>LOG IN</span>
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
        Welcome back! 👋
      </h2>
      <p className="text-sm mb-8" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
        Pick up where you left off.
      </p>

      {error && (
        <div data-testid="auth-error" className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: '#FEF2F2', border: '1.5px solid #FECACA', color: '#DC2626', fontFamily: 'Outfit, sans-serif' }}>
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input data-testid="login-email" type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#94A3B8' }} />
          <input data-testid="login-password" type={showPass ? 'text' : 'password'} placeholder="Password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
          <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
            {showPass ? <EyeOff size={16} style={{ color: '#94A3B8' }} /> : <Eye size={16} style={{ color: '#94A3B8' }} />}
          </button>
        </div>
      </div>

      <button data-testid="login-submit-btn" onClick={handleLogin} disabled={loading}
        className={btnPrimary}
        style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif' }}>
        {loading ? 'Logging in...' : 'Log In'} {!loading && <ArrowRight size={18} />}
      </button>

      <button onClick={() => { setForgotMode(true); setError(''); }}
        className="mt-4 text-sm text-center w-full"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#3B82F6' }}>
        Forgot password?
      </button>

      <button onClick={() => setPhase('gate')}
        className="mt-4 text-sm text-center w-full"
        style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
        Don't have an account? <span style={{ color: '#3B82F6', fontWeight: 600 }}>Sign up</span>
      </button>
    </motion.div>
  );
}
