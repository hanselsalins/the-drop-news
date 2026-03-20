import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Eye, EyeOff, Mail, Lock, User, ChevronDown, Check, Sparkles, Plus, Trash2, AtSign } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ━━━ Auth palette — matches The Drop design system ━━━
const AUTH = {
  primary: '#507AF9',
  primaryLight: '#74C9EB',
  gradient: 'linear-gradient(145deg, #507AF9, #74C9EB)',
  gradientDisabled: '#828693',
  text: '#151924',
  textMuted: '#404551',
  textLight: '#828693',
  bg: '#EFEFEB',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F5F5',
  border: '#E5E5E5',
  borderLight: '#E5E5E5',
  inputBg: '#FFFFFF',
  error: '#FF6E6E',
  errorBg: '#FFF0F0',
  errorBorder: '#FFD0D0',
  fontHeading: "'Inter', sans-serif",
  fontBody: "'Inter', sans-serif",
};

const inputStyle = {
  background: AUTH.inputBg,
  border: `1.5px solid ${AUTH.borderLight}`,
  borderRadius: '16px',
  color: AUTH.text,
  fontFamily: AUTH.fontBody,
};
const inputClass = "w-full px-4 py-3.5 text-base outline-none placeholder:text-[#9B8EC4] focus:border-[#8B5CF6]";
const btnPrimary = "w-full py-4 rounded-2xl text-base font-bold tracking-wide flex items-center justify-center gap-2 transition-all";

const slideIn = {
  initial: { x: 60, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -60, opacity: 0 },
  transition: { duration: 0.3 },
};

const GENDER_OPTIONS = ['Boy', 'Girl', 'Prefer not to say'];

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const invitedBy = location.state?.invitedBy || '';
  const addProfile = location.state?.addProfile || false;
  const { setToken, setParentToken, setUserData, token, parentToken, fetchLinkedProfiles } = useTheme();
  const [phase, setPhase] = useState(addProfile ? 'addProfile' : 'gate');
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
      style={{ background: AUTH.bg }}>
      <div className="absolute top-[-80px] right-[-80px] w-64 h-64 rounded-full opacity-15 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #4F46E5, #8B5CF6)' }} />
      <div className="absolute bottom-[-60px] left-[-60px] w-48 h-48 rounded-full opacity-10 blur-3xl"
        style={{ background: 'linear-gradient(135deg, #EC4899, #8B5CF6)' }} />

      <div className="relative z-10 flex-1 flex flex-col px-5 py-6">
        <AnimatePresence mode="wait">
          {phase === 'gate' && <GateScreen key="gate" setPhase={setPhase} />}
          {phase === 'pathA' && (
            <PathASignup key="pathA" setPhase={setPhase} setToken={setToken} setParentToken={setParentToken}
              setUserData={setUserData} navigate={navigate} error={error} setError={setError}
              connectWithInviter={connectWithInviter} fetchLinkedProfiles={fetchLinkedProfiles} />
          )}
          {phase === 'pathB' && (
            <PathBSignup key="pathB" setPhase={setPhase} setToken={setToken} setUserData={setUserData}
              navigate={navigate} error={error} setError={setError} connectWithInviter={connectWithInviter} />
          )}
          {phase === 'addProfile' && (
            <AddProfileForm key="addProfile" token={parentToken || token} setUserData={setUserData}
              navigate={navigate} error={error} setError={setError} fetchLinkedProfiles={fetchLinkedProfiles} />
          )}
          {phase === 'login' && (
            <LoginForm key="login" setPhase={setPhase} setToken={setToken} setParentToken={setParentToken}
              setUserData={setUserData} navigate={navigate} error={error} setError={setError}
              fetchLinkedProfiles={fetchLinkedProfiles} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ━━━ PROGRESS BAR ━━━
function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full h-1.5 rounded-full transition-all duration-300"
            style={{
              background: i < current ? AUTH.gradient : AUTH.borderLight,
            }}
          />
          <span className="text-[10px] font-medium" style={{
            fontFamily: AUTH.fontBody,
            color: i < current ? AUTH.primary : AUTH.textLight,
          }}>
            Step {i + 1}
          </span>
        </div>
      ))}
    </div>
  );
}

// ━━━ TOGGLE BUTTONS (pill style) ━━━
function ToggleButtons({ options, value, onChange }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className="py-3 px-5 rounded-full text-sm font-semibold transition-all"
          style={{
            fontFamily: AUTH.fontBody,
            background: value === opt ? AUTH.gradient : AUTH.surfaceAlt,
            color: value === opt ? '#FFFFFF' : AUTH.textMuted,
            border: value === opt ? 'none' : `1.5px solid ${AUTH.borderLight}`,
            minHeight: 48,
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ━━━ COUNTRY DROPDOWN ━━━
function CountryDropdown({ countries, value, onChange, testPrefix = '' }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const selected = countries.find(c => c.country_code === value);
  const filtered = search
    ? countries.filter(c => c.country_name.toLowerCase().includes(search.toLowerCase()))
    : countries;

  return (
    <div className="relative">
      <button type="button" data-testid={`${testPrefix}country-selector`}
        onClick={() => setOpen(!open)}
        className={`${inputClass} text-left flex items-center justify-between`}
        style={inputStyle}
      >
        <span style={{ opacity: selected ? 1 : 0.4, color: selected ? AUTH.text : AUTH.textLight }}>
          {selected ? `${selected.flag_emoji} ${selected.country_name}` : 'Select country'}
        </span>
        <ChevronDown size={16} style={{ color: AUTH.textLight, transform: open ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 rounded-2xl overflow-hidden z-20"
          style={{ background: '#FFFFFF', border: `1.5px solid ${AUTH.borderLight}`, boxShadow: '0 12px 40px rgba(79,70,229,0.12)' }}>
          <div className="p-2">
            <input type="text" placeholder="Search country..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none"
              style={{ background: AUTH.inputBg, border: `1px solid ${AUTH.borderLight}`, fontFamily: AUTH.fontBody, color: AUTH.text }}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.country_code} data-testid={`${testPrefix}country-${c.country_code}`}
                onClick={() => { onChange(c.country_code); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                style={{
                  fontFamily: AUTH.fontBody,
                  color: c.country_code === value ? AUTH.primary : AUTH.text,
                  background: c.country_code === value ? AUTH.surfaceAlt : 'transparent',
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
  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="mb-2">
        <span className="text-xs font-bold tracking-[0.3em] uppercase"
          style={{ fontFamily: AUTH.fontBody, color: AUTH.primary }}>THE DROP</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
        style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
        Welcome! 👋
      </h1>
      <p className="text-base mb-8" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
        Let's get you set up with the right experience.
      </p>

      <div className="space-y-4 mb-8">
        {/* Option A — Under 14 */}
        <button
          data-testid="gate-under14"
          onClick={() => setPhase('pathA')}
          className="w-full text-left p-6 rounded-3xl transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg, #FFF7ED, #FEF3C7)', border: '2px solid #FBBF24' }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">👦🏻</span>
            <div className="flex-1">
              <p className="text-lg font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
                I'm under 14
              </p>
              <p className="text-sm mt-1" style={{ fontFamily: AUTH.fontBody, color: '#78716C' }}>
                A parent or guardian will set up your account
              </p>
            </div>
            <ArrowRight size={20} style={{ color: '#FBBF24', marginTop: 4 }} />
          </div>
        </button>

        {/* Option B — 14 or older */}
        <button
          data-testid="gate-14plus"
          onClick={() => setPhase('pathB')}
          className="w-full text-left p-6 rounded-3xl transition-all hover:shadow-lg active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg, ${AUTH.surface}, #F5F3FF)`, border: `2px solid ${AUTH.primaryLight}` }}
        >
          <div className="flex items-start gap-4">
            <span className="text-4xl">🧑🏻</span>
            <div className="flex-1">
              <p className="text-lg font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
                I'm 14 or older
              </p>
              <p className="text-sm mt-1" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
                Create your own profile
              </p>
            </div>
            <ArrowRight size={20} style={{ color: AUTH.primaryLight, marginTop: 4 }} />
          </div>
        </button>
      </div>

      <div className="mt-auto">
        <button data-testid="gate-login-link" onClick={() => setPhase('login')}
          className="w-full text-sm py-2 transition-opacity"
          style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
          Already have an account? <span style={{ color: AUTH.primary, fontWeight: 600 }}>Log in</span>
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━ CHILD PROFILE FORM ━━━━━━━━━
function ChildForm({ index, child, onChange, onRemove, countries, showRemove }) {
  const u = (k, v) => onChange(index, { ...child, [k]: v });

  return (
    <div className="p-4 rounded-2xl space-y-3" style={{ background: AUTH.surface, border: `1.5px solid ${AUTH.borderLight}` }}>
      {showRemove && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold uppercase tracking-wider"
            style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
            Child {index + 1}
          </span>
          <button onClick={() => onRemove(index)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
            <Trash2 size={14} style={{ color: '#EF4444' }} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>First Name</label>
          <input placeholder="First name" value={child.first_name}
            onChange={e => u('first_name', e.target.value)} className={inputClass} style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Last Name</label>
          <input placeholder="Last name" value={child.last_name}
            onChange={e => u('last_name', e.target.value)} className={inputClass} style={inputStyle} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Username</label>
        <div className="relative">
          <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
          <input placeholder="choose a fun name" value={child.username}
            onChange={e => u('username', e.target.value)} className={inputClass}
            style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Age</label>
        <input type="number" min="5" max="17" placeholder="Age" value={child.age}
          onChange={e => u('age', e.target.value)} className={inputClass} style={inputStyle} />
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Gender</label>
        <ToggleButtons options={GENDER_OPTIONS} value={child.gender} onChange={v => u('gender', v)} />
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Country</label>
        <CountryDropdown countries={countries} value={child.country_code} onChange={v => u('country_code', v)} testPrefix={`child${index}-`} />
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
          City <span style={{ color: AUTH.textLight }}>(optional)</span>
        </label>
        <input placeholder="City" value={child.city}
          onChange={e => u('city', e.target.value)} className={inputClass} style={inputStyle} />
      </div>

      <div>
        <label className="text-xs font-semibold mb-1 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
          School <span style={{ color: AUTH.textLight }}>(optional)</span>
        </label>
        <input placeholder="School name" value={child.school}
          onChange={e => u('school', e.target.value)} className={inputClass} style={inputStyle} />
      </div>
    </div>
  );
}

const emptyChild = () => ({ first_name: '', last_name: '', username: '', age: '', gender: '', country_code: '', city: '', school: '' });

// ━━━━━━━━━━━━━━━━━━━ PATH A — Under 14 (Parent-led) ━━━━━━━━━━━━━━━━━━━
function PathASignup({ setPhase, setToken, setParentToken, setUserData, navigate, error, setError, connectWithInviter, fetchLinkedProfiles }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);

  const [parentForm, setParentForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [children, setChildren] = useState([emptyChild()]);

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`)
      .then(r => setCountries(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Failed to fetch countries:', e));
  }, []);

  const pU = (k, v) => { setParentForm(p => ({ ...p, [k]: v })); setError(''); };

  const canStep1 = parentForm.first_name && parentForm.last_name && parentForm.email && parentForm.password.length >= 8;
  const canStep2 = children.every(c => c.first_name && c.last_name && c.age && c.gender && c.country_code);

  const updateChild = (idx, data) => {
    setChildren(prev => prev.map((c, i) => i === idx ? data : c));
    setError('');
  };

  const removeChild = (idx) => {
    if (children.length <= 1) return;
    setChildren(prev => prev.filter((_, i) => i !== idx));
  };

  const addChild = () => {
    if (children.length >= 5) return;
    setChildren(prev => [...prev, emptyChild()]);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        parent_name: `${parentForm.first_name} ${parentForm.last_name}`.trim(),
        parent_email: parentForm.email,
        parent_password: parentForm.password,
        parent_relation: parentForm.relation || 'guardian',
        children: children.map(c => ({
          child_name: `${c.first_name} ${c.last_name}`.trim(),
          child_username: c.username || '',
          child_age: parseInt(c.age),
          child_gender: c.gender,
          child_country_code: c.country_code,
          child_city: c.city || '',
          child_school: c.school || '',
        })),
      };
      console.log('[PathA] POST /api/auth/register-child payload:', JSON.stringify(payload));
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-child`, payload);
      console.log('[PathA] Response:', JSON.stringify(res.data));

      const pToken = res.data.parent_token || res.data.token;
      setParentToken(pToken);
      setToken(res.data.token);
      setUserData(res.data.user);
      await fetchLinkedProfiles(pToken);
      await connectWithInviter(res.data.token);
      navigate('/feed');
    } catch (e) {
      console.error('[PathA] Error:', e.response?.status, JSON.stringify(e.response?.data));
      const detail = e.response?.data?.detail;
      const errors = e.response?.data?.errors;
      let msg = 'Registration failed';
      if (errors && typeof errors === 'object') {
        msg = Object.values(errors).join(', ');
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => d.msg || JSON.stringify(d)).join(', ');
      } else if (typeof detail === 'string') {
        msg = detail;
      } else if (e.response?.data?.error) {
        msg = e.response.data.error;
      }
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : setPhase('gate')}
          className="p-2 rounded-xl" style={{ background: AUTH.surfaceAlt }}>
          <ArrowLeft size={18} color={AUTH.textMuted} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
            {step === 1 ? 'Parent / Guardian Details' : "Your Child's Profile"}
          </p>
        </div>
      </div>

      <ProgressBar current={step} total={2} />

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: AUTH.errorBg, border: `1.5px solid ${AUTH.errorBorder}`, color: AUTH.error, fontFamily: AUTH.fontBody }}>
          {error}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="a1" {...slideIn} className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
              Your details 🛡️
            </h2>
            <p className="text-sm mb-6" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
              As the parent, you'll use these to log in and manage the account.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>First Name</label>
                  <input placeholder="First name" value={parentForm.first_name}
                    onChange={e => pU('first_name', e.target.value)} className={inputClass} style={inputStyle} />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Last Name</label>
                  <input placeholder="Last name" value={parentForm.last_name}
                    onChange={e => pU('last_name', e.target.value)} className={inputClass} style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
                  <input type="email" placeholder="parent@example.com" value={parentForm.email}
                    onChange={e => pU('email', e.target.value)} className={inputClass}
                    style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Password <span style={{ color: AUTH.textLight }}>(min 8 characters)</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
                  <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                    value={parentForm.password} onChange={e => pU('password', e.target.value)}
                    className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
                  <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff size={16} style={{ color: AUTH.textLight }} /> : <Eye size={16} style={{ color: AUTH.textLight }} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button onClick={() => setStep(2)} disabled={!canStep1}
                className={btnPrimary}
                style={{
                  background: canStep1 ? AUTH.gradient : AUTH.gradientDisabled,
                  color: canStep1 ? '#FFFFFF' : '#FEFCFF',
                  fontFamily: AUTH.fontHeading,
                }}>
                Next <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="a2" {...slideIn} className="flex-1 flex flex-col">
            <h2 className="text-xl font-bold mb-1" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
              Tell us about your {children.length > 1 ? 'children' : 'child'} 🧒
            </h2>
            <p className="text-sm mb-4" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
              No email or password needed — profiles are managed by you.
            </p>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {children.map((child, idx) => (
                <ChildForm
                  key={idx}
                  index={idx}
                  child={child}
                  onChange={updateChild}
                  onRemove={removeChild}
                  countries={countries}
                  showRemove={children.length > 1}
                />
              ))}

              {children.length < 5 && (
                <button onClick={addChild}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold transition-colors"
                  style={{ fontFamily: AUTH.fontBody, color: AUTH.primary, background: AUTH.surface, border: `1.5px dashed ${AUTH.border}` }}>
                  <Plus size={16} /> Add Another Child
                </button>
              )}
            </div>

            <div className="pt-4">
              <button onClick={handleSubmit} disabled={!canStep2 || loading}
                className={btnPrimary}
                style={{
                  background: canStep2 ? AUTH.gradient : AUTH.gradientDisabled,
                  color: canStep2 ? '#FFFFFF' : '#FEFCFF',
                  fontFamily: AUTH.fontHeading,
                }}>
                {loading ? 'Creating Profiles...' : 'Create Profiles'} {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ PATH B — 14+ Self Signup ━━━━━━━━━━━━━━━━━━━
function PathBSignup({ setPhase, setToken, setUserData, navigate, error, setError, connectWithInviter }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', age: '', gender: '',
    country_code: '', city: '', school: '', email: '', password: '',
  });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`)
      .then(r => setCountries(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Failed to fetch countries:', e));
  }, []);

  const canSubmit = form.first_name && form.last_name && form.age && form.gender && form.email && form.password.length >= 8 && form.country_code;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        name: `${form.first_name} ${form.last_name}`.trim(),
        username: form.username || undefined,
        email: form.email,
        password: form.password,
        age: parseInt(form.age),
        gender: form.gender,
        country_code: form.country_code,
        city: form.city || undefined,
        school: form.school || undefined,
      };
      console.log('[PathB] POST /api/auth/register-self payload:', JSON.stringify(payload));
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-self`, payload);
      console.log('[PathB] Response:', JSON.stringify(res.data));
      setToken(res.data.token);
      setUserData(res.data.user);
      await connectWithInviter(res.data.token);
      navigate('/feed');
    } catch (e) {
      console.error('[PathB] Error:', e.response?.status, JSON.stringify(e.response?.data));
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Registration failed');
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setPhase('gate')} className="p-2 rounded-xl" style={{ background: AUTH.surfaceAlt }}>
          <ArrowLeft size={18} color={AUTH.textMuted} />
        </button>
        <div className="flex-1">
          <p className="text-sm font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>Create Your Profile</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: AUTH.errorBg, border: `1.5px solid ${AUTH.errorBorder}`, color: AUTH.error, fontFamily: AUTH.fontBody }}>
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>First Name</label>
            <input placeholder="First name" value={form.first_name}
              onChange={e => u('first_name', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Last Name</label>
            <input placeholder="Last name" value={form.last_name}
              onChange={e => u('last_name', e.target.value)} className={inputClass} style={inputStyle} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Username</label>
          <div className="relative">
            <AtSign size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
            <input placeholder="choose a fun name" value={form.username}
              onChange={e => u('username', e.target.value)} className={inputClass}
              style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Age</label>
          <input type="number" min="14" max="20" placeholder="Your age" value={form.age}
            onChange={e => u('age', e.target.value)} className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Gender</label>
          <ToggleButtons options={GENDER_OPTIONS} value={form.gender} onChange={v => u('gender', v)} />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Country</label>
          <CountryDropdown countries={countries} value={form.country_code} onChange={v => u('country_code', v)} testPrefix="self-" />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
            City <span style={{ color: AUTH.textLight }}>(optional)</span>
          </label>
          <input placeholder="City" value={form.city}
            onChange={e => u('city', e.target.value)} className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
            School <span style={{ color: AUTH.textLight }}>(optional)</span>
          </label>
          <input placeholder="School name" value={form.school}
            onChange={e => u('school', e.target.value)} className={inputClass} style={inputStyle} />
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => u('email', e.target.value)} className={inputClass}
              style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-1.5 block" style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>Password <span style={{ color: AUTH.textLight }}>(min 8 characters)</span></label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
            <input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
              value={form.password} onChange={e => u('password', e.target.value)}
              className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
            <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
              {showPass ? <EyeOff size={16} style={{ color: AUTH.textLight }} /> : <Eye size={16} style={{ color: AUTH.textLight }} />}
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading}
          className={btnPrimary}
          style={{
            background: canSubmit ? AUTH.gradient : AUTH.gradientDisabled,
            color: canSubmit ? '#FFFFFF' : '#FEFCFF',
            fontFamily: AUTH.fontHeading,
          }}>
          {loading ? 'Creating Profile...' : 'Create Profile'} {!loading && <ArrowRight size={18} />}
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ ADD PROFILE (from inside app) ━━━━━━━━━━━━━━━━━━━
function AddProfileForm({ token, setUserData, navigate, error, setError, fetchLinkedProfiles }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [child, setChild] = useState(emptyChild());

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/countries`)
      .then(r => setCountries(Array.isArray(r.data) ? r.data : []))
      .catch(e => console.error('Failed to fetch countries:', e));
  }, []);

  const canSubmit = child.first_name && child.last_name && child.age && child.gender && child.country_code;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        child_name: `${child.first_name} ${child.last_name}`.trim(),
        child_username: child.username || undefined,
        child_age: parseInt(child.age),
        child_gender: child.gender,
        child_country_code: child.country_code,
        child_city: child.city || undefined,
        child_school: child.school || undefined,
      };
      console.log('[AddProfile] POST /api/auth/add-profile with token:', !!token);
      console.log('[AddProfile] Payload:', JSON.stringify(payload));
      const res = await axios.post(`${BACKEND_URL}/api/auth/add-profile`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[AddProfile] Success:', JSON.stringify(res.data));
      await fetchLinkedProfiles(token);
      navigate('/feed');
    } catch (e) {
      console.error('[AddProfile] FAILED:', e.response?.status, JSON.stringify(e.response?.data));
      const detail = e.response?.data?.detail;
      const msg = Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : e.response?.data?.error || `Failed to add profile (${e.response?.status || 'network error'})`);
      setError(msg);
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/feed')} className="p-2 rounded-xl" style={{ background: AUTH.surfaceAlt }}>
          <ArrowLeft size={18} color={AUTH.textMuted} />
        </button>
        <p className="text-sm font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>Add New Profile</p>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: AUTH.errorBg, border: `1.5px solid ${AUTH.errorBorder}`, color: AUTH.error, fontFamily: AUTH.fontBody }}>
          {error}
        </div>
      )}

      <h2 className="text-xl font-bold mb-1" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
        Add a child profile 🧒
      </h2>
      <p className="text-sm mb-4" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
        No email or password needed — this profile is managed by you.
      </p>

      <div className="flex-1 overflow-y-auto pb-4">
        <ChildForm index={0} child={child} onChange={(_, data) => setChild(data)}
          onRemove={() => {}} countries={countries} showRemove={false} />
      </div>

      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading}
          className={btnPrimary}
          style={{
            background: canSubmit ? AUTH.gradient : AUTH.gradientDisabled,
            color: canSubmit ? '#FFFFFF' : '#FEFCFF',
            fontFamily: AUTH.fontHeading,
          }}>
          {loading ? 'Adding Profile...' : 'Add Profile'} {!loading && <Sparkles size={18} />}
        </button>
      </div>
    </motion.div>
  );
}

// ━━━━━━━━━━━━━━━━━━━ LOGIN FORM ━━━━━━━━━━━━━━━━━━━
function LoginForm({ setPhase, setToken, setParentToken, setUserData, navigate, error, setError, fetchLinkedProfiles }) {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profiles, setProfiles] = useState(null);
  const [loginToken, setLoginToken] = useState(null);
  const [loginUser, setLoginUser] = useState(null);
  const [switching, setSwitching] = useState(null);

  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Design System B band gradients for profile picker
  const AGE_TO_BAND = {
    '8-10': 'big-bold-bright', '11-13': 'cool-connected',
    '14-16': 'sharp-aware', '17-20': 'editorial',
  };
  const GRADIENTS = {
    'big-bold-bright': 'linear-gradient(145deg, #4F46E5, #F59E0B)',
    'cool-connected': 'linear-gradient(145deg, #2563EB, #8B5CF6)',
    'sharp-aware': 'linear-gradient(145deg, #F43F5E, #6366F1)',
    'editorial': 'linear-gradient(145deg, #C9A84C, #F5E6C8)',
  };
  const AGE_BADGES = {
    '8-10': { label: 'Junior Reader', color: '#4F46E5' },
    '11-13': { label: 'News Scout', color: '#2563EB' },
    '14-16': { label: 'Drop Regular', color: '#F43F5E' },
    '17-20': { label: 'Sharp Mind', color: '#C9A84C' },
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      console.log('[Login] POST /api/auth/login');
      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, { email, password });
      console.log('[Login] Response:', JSON.stringify(res.data));
      const { token, user, linked_profiles, account_type, profiles: responseProfiles, parent_token: respParentToken } = res.data;

      if (account_type === 'parent' || user?.account_type === 'parent') {
        console.log('[Login] Parent account detected, showing profile picker');
        const parentJwt = respParentToken || token;
        console.log('[Login] Parent JWT available:', !!parentJwt);
        setLoginToken(parentJwt);
        setLoginUser(user);
        const profs = responseProfiles || linked_profiles || [];
        setProfiles(profs);
        if (parentJwt) setParentToken(parentJwt);
      } else {
        setToken(token);
        setUserData(user);
        fetchLinkedProfiles(token);
        navigate('/feed');
      }
    } catch (e) {
      console.error('[Login] Error:', e.response?.status, JSON.stringify(e.response?.data));
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Login failed'));
    }
    setLoading(false);
  };

  const handlePickProfile = async (profile) => {
    setSwitching(profile.id);
    try {
      console.log('[Login] Switching to profile:', profile.id, profile.full_name);
      
      if (loginToken) {
        const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`,
          { target_user_id: profile.id },
          { headers: { Authorization: `Bearer ${loginToken}` } }
        );
        console.log('[Login] Switch response:', JSON.stringify(res.data));
        const newToken = res.data.token || loginToken;
        setToken(newToken);
        setParentToken(loginToken);
        if (res.data.user) {
          setUserData(res.data.user);
        } else {
          const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });
          setUserData(meRes.data);
        }
        fetchLinkedProfiles(loginToken);
        navigate('/feed');
      } else {
        console.log('[Login] No token available, re-authenticating as child profile');
        const loginRes = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email, password, target_profile_id: profile.id,
        });
        console.log('[Login] Child login response:', JSON.stringify(loginRes.data));
        const childToken = loginRes.data.token;
        if (childToken) {
          setToken(childToken);
          setUserData(loginRes.data.user || profile);
          if (loginRes.data.parent_token) setParentToken(loginRes.data.parent_token);
          navigate('/feed');
        } else {
          console.log('[Login] Using profile data directly');
          setToken('session_' + profile.id);
          setUserData(profile);
          navigate('/feed');
        }
      }
    } catch (e) {
      console.error('[Login] Switch failed:', e.response?.status, JSON.stringify(e.response?.data));
      console.log('[Login] Fallback: using profile data directly');
      setToken('session_' + profile.id);
      setUserData(profile);
      navigate('/feed');
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
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Failed to send reset email'));
    }
    setForgotLoading(false);
  };

  // ── Profile picker ──
  if (profiles && profiles.length > 0) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold mb-2 text-center" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
          Who's reading today? 📖
        </h2>
        <p className="text-sm mb-8 text-center" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
          Pick a profile to continue.
        </p>

        <div className="space-y-3 flex-1 overflow-y-auto">
          {profiles.map((profile) => {
            const profBand = AGE_TO_BAND[profile.age_group];
            const profGradient = GRADIENTS[profBand] || AUTH.gradient;
            const profBadge = AGE_BADGES[profile.age_group] || { label: 'Reader', color: AUTH.textLight };
            const isSwitching = switching === profile.id;

            return (
              <button key={profile.id} onClick={() => handlePickProfile(profile)}
                disabled={isSwitching}
                className="w-full flex items-center gap-4 p-5 rounded-3xl transition-all hover:shadow-lg active:scale-[0.98]"
                style={{ background: AUTH.surface, border: `2px solid ${AUTH.borderLight}`, opacity: isSwitching ? 0.6 : 1 }}
              >
                <div className="flex-shrink-0" style={{ width: 56, height: 56, borderRadius: '50%', padding: 2.5, background: profGradient }}>
                  <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center"
                    style={{ background: profGradient }}>
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-white" style={{ fontFamily: AUTH.fontHeading }}>
                        {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
                    {profile.full_name}
                  </p>
                  <span className="inline-block text-[10px] font-bold tracking-wider uppercase mt-1 px-2 py-0.5 rounded-full"
                    style={{ background: `${profBadge.color}15`, color: profBadge.color, fontFamily: AUTH.fontBody }}>
                    {profBadge.label}
                  </span>
                </div>
                <ArrowRight size={18} style={{ color: AUTH.border }} />
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ── Forgot password ──
  if (forgotMode) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }}
            className="p-2 rounded-xl" style={{ background: AUTH.surfaceAlt }}>
            <ArrowLeft size={18} color={AUTH.textMuted} />
          </button>
          <span className="text-sm font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>Reset Password</span>
        </div>

        {forgotSent ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📬</span>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>Check your email!</h2>
            <p className="text-sm" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
              We've sent a password reset link to <strong>{forgotEmail}</strong>
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-2" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>Forgot your password?</h2>
            <p className="text-sm mb-6" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>Enter your email and we'll send you a reset link.</p>
            {error && (
              <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
                style={{ background: AUTH.errorBg, border: `1.5px solid ${AUTH.errorBorder}`, color: AUTH.error, fontFamily: AUTH.fontBody }}>{error}</div>
            )}
            <div className="relative mb-6">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
              <input type="email" placeholder="Your email address" value={forgotEmail}
                onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
            </div>
            <button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail}
              className={btnPrimary}
              style={{
                background: forgotEmail ? AUTH.gradient : AUTH.gradientDisabled,
                color: forgotEmail ? '#FFFFFF' : '#FEFCFF',
                fontFamily: AUTH.fontHeading,
              }}>
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </>
        )}
      </motion.div>
    );
  }

  // ── Main login form ──
  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setPhase('gate')} className="p-2 rounded-xl" style={{ background: AUTH.surfaceAlt }}>
          <ArrowLeft size={18} color={AUTH.textMuted} />
        </button>
        <span className="text-sm font-bold" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>LOG IN</span>
      </div>

      <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: AUTH.fontHeading, color: AUTH.text }}>
        Welcome back! 👋
      </h2>
      <p className="text-sm mb-8" style={{ fontFamily: AUTH.fontBody, color: AUTH.textLight }}>
        Pick up where you left off.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-2xl text-sm"
          style={{ background: AUTH.errorBg, border: `1.5px solid ${AUTH.errorBorder}`, color: AUTH.error, fontFamily: AUTH.fontBody }}>{error}</div>
      )}

      <div className="space-y-3 mb-6">
        <div className="relative">
          <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
          <input type="email" placeholder="Email" value={email}
            onChange={e => { setEmail(e.target.value); setError(''); }}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} />
        </div>
        <div className="relative">
          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: AUTH.textLight }} />
          <input type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} />
          <button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
            {showPass ? <EyeOff size={16} style={{ color: AUTH.textLight }} /> : <Eye size={16} style={{ color: AUTH.textLight }} />}
          </button>
        </div>
      </div>

      <button onClick={handleLogin} disabled={loading}
        className={btnPrimary}
        style={{ background: AUTH.gradient, color: '#FFFFFF', fontFamily: AUTH.fontHeading }}>
        {loading ? 'Signing in...' : 'Sign In'} {!loading && <ArrowRight size={18} />}
      </button>

      <button onClick={() => { setForgotMode(true); setError(''); }}
        className="mt-4 text-sm text-center w-full"
        style={{ fontFamily: AUTH.fontBody, color: AUTH.primary }}>
        Forgot password?
      </button>

      <button onClick={() => setPhase('gate')}
        className="mt-4 text-sm text-center w-full"
        style={{ fontFamily: AUTH.fontBody, color: AUTH.textMuted }}>
        Don't have an account? <span style={{ color: AUTH.primary, fontWeight: 600 }}>Sign up</span>
      </button>
    </motion.div>
  );
}
