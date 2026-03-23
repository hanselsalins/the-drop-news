import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from '../components/F7Icon';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const inputStyle = {
  background: 'var(--light-gray)',
  border: 'none',
  borderRadius: 10,
  color: 'var(--title-color)',
  fontFamily: 'var(--font)',
};
const inputClass = "w-full px-4 py-3 text-base outline-none";
const btnPrimary = "w-full flex items-center justify-center gap-2 cursor-pointer";

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
      style={{ backgroundColor: 'var(--bg)' }}>
      <div className="relative z-10 flex-1 flex flex-col" style={{ padding: '24px 15px' }}>
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

function ProgressBar({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex-1 h-1.5 rounded-full" style={{
          background: i < current ? 'var(--accent)' : 'var(--light-gray)',
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
            fontFamily: 'var(--font)', borderRadius: 22,
            background: value === opt ? 'var(--accent)' : 'var(--light-gray)',
            color: value === opt ? '#FFFFFF' : 'var(--title-color)',
            border: 'none', minHeight: 44,
          }}>
          {opt}
        </button>
      ))}
    </div>
  );
}

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
        className={`${inputClass} text-left flex items-center justify-between cursor-pointer`}
        style={{ ...inputStyle, height: 44 }}>
        <span style={{ opacity: selected ? 1 : 0.4, color: selected ? 'var(--title-color)' : '#93a0b1' }}>
          {selected ? `${selected.flag_emoji} ${selected.country_name}` : 'Select country'}
        </span>
        <F7Icon name="chevron_down" size={16} color="var(--text-color)" />
      </button>
      {open && (
        <div className="absolute left-0 right-0 mt-1 overflow-hidden z-20"
          style={{ background: 'var(--bg)', border: '1px solid var(--light-gray)', borderRadius: 10, boxShadow: 'var(--block-shadow)' }}>
          <div className="p-2">
            <input type="text" placeholder="Search country..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none"
              style={{ ...inputStyle, height: 36, borderRadius: 8 }} />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.country_code} data-testid={`${testPrefix}country-${c.country_code}`}
                onClick={() => { onChange(c.country_code); setOpen(false); setSearch(''); }}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: 'var(--font)', color: c.country_code === value ? 'var(--accent)' : 'var(--title-color)', background: 'none', border: 'none' }}>
                <span>{c.flag_emoji}</span><span>{c.country_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function GateScreen({ setPhase }) {
  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <h1 style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 600, color: 'var(--title-color)', marginBottom: 8 }}>
        Welcome! 👋
      </h1>
      <p style={{ fontFamily: 'var(--font)', fontSize: 15, lineHeight: '1.8em', color: 'var(--text-color)', marginBottom: 32 }}>
        Let's get you set up with the right experience.
      </p>

      <div className="space-y-4 mb-8">
        <button data-testid="gate-under14" onClick={() => setPhase('pathA')}
          className="w-full text-left p-6 cursor-pointer"
          style={{ background: 'var(--light-gray)', borderRadius: 18, border: 'none' }}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">👦🏻</span>
            <div className="flex-1">
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>I'm under 14</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-color)', marginTop: 4 }}>A parent or guardian will set up your account</p>
            </div>
            <F7Icon name="arrow_right" size={20} color="var(--accent)" style={{ marginTop: 4 }} />
          </div>
        </button>

        <button data-testid="gate-14plus" onClick={() => setPhase('pathB')}
          className="w-full text-left p-6 cursor-pointer"
          style={{ background: 'var(--light-gray)', borderRadius: 18, border: 'none' }}>
          <div className="flex items-start gap-4">
            <span className="text-4xl">🧑🏻</span>
            <div className="flex-1">
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>I'm 14 or older</p>
              <p style={{ fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text-color)', marginTop: 4 }}>Create your own profile</p>
            </div>
            <F7Icon name="arrow_right" size={20} color="var(--accent)" style={{ marginTop: 4 }} />
          </div>
        </button>
      </div>

      <div className="mt-auto">
        <button data-testid="gate-login-link" onClick={() => setPhase('login')}
          className="w-full text-sm py-2 cursor-pointer" style={{ fontFamily: 'var(--font)', color: 'var(--text-color)', background: 'none', border: 'none' }}>
          Already have an account? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Log in</span>
        </button>
      </div>
    </motion.div>
  );
}

function ChildForm({ index, child, onChange, onRemove, countries, showRemove }) {
  const u = (k, v) => onChange(index, { ...child, [k]: v });
  return (
    <div className="p-4 space-y-3" style={{ background: 'var(--light-gray)', borderRadius: 18 }}>
      {showRemove && (
        <div className="flex items-center justify-between mb-1">
          <span style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-color)' }}>Child {index + 1}</span>
          <button onClick={() => onRemove(index)} className="p-1.5 cursor-pointer" style={{ background: 'none', border: 'none' }}>
            <F7Icon name="trash" size={14} color="#FF3B30" />
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>First Name</label><input placeholder="First name" value={child.first_name} onChange={e => u('first_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Last Name</label><input placeholder="Last name" value={child.last_name} onChange={e => u('last_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
      </div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Username</label>
        <div className="relative"><F7Icon name="at" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input placeholder="choose a fun name" value={child.username} onChange={e => u('username', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div></div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Age</label><input type="number" min="5" max="17" placeholder="Age" value={child.age} onChange={e => u('age', e.target.value)} className={inputClass} style={inputStyle} /></div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Gender</label><ToggleButtons options={GENDER_OPTIONS} value={child.gender} onChange={v => u('gender', v)} /></div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Country</label><CountryDropdown countries={countries} value={child.country_code} onChange={v => u('country_code', v)} testPrefix={`child${index}-`} /></div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>City <span style={{ color: 'var(--text-color)' }}>(optional)</span></label><input placeholder="City" value={child.city} onChange={e => u('city', e.target.value)} className={inputClass} style={inputStyle} /></div>
      <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>School <span style={{ color: 'var(--text-color)' }}>(optional)</span></label><input placeholder="School name" value={child.school} onChange={e => u('school', e.target.value)} className={inputClass} style={inputStyle} /></div>
    </div>
  );
}

const emptyChild = () => ({ first_name: '', last_name: '', username: '', age: '', gender: '', country_code: '', city: '', school: '' });

function PathASignup({ setPhase, setToken, setParentToken, setUserData, navigate, error, setError, connectWithInviter, fetchLinkedProfiles }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [parentForm, setParentForm] = useState({ first_name: '', last_name: '', email: '', password: '' });
  const [children, setChildren] = useState([emptyChild()]);

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);

  const pU = (k, v) => { setParentForm(p => ({ ...p, [k]: v })); setError(''); };
  const canStep1 = parentForm.first_name && parentForm.last_name && parentForm.email && parentForm.password.length >= 8;
  const canStep2 = children.every(c => c.first_name && c.last_name && c.age && c.gender && c.country_code);
  const updateChild = (idx, data) => { setChildren(prev => prev.map((c, i) => i === idx ? data : c)); setError(''); };
  const removeChild = (idx) => { if (children.length <= 1) return; setChildren(prev => prev.filter((_, i) => i !== idx)); };
  const addChild = () => { if (children.length >= 5) return; setChildren(prev => [...prev, emptyChild()]); };

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = {
        parent_name: `${parentForm.first_name} ${parentForm.last_name}`.trim(),
        parent_email: parentForm.email, parent_password: parentForm.password, parent_relation: 'guardian',
        children: children.map(c => ({
          child_name: `${c.first_name} ${c.last_name}`.trim(), child_username: c.username || '',
          child_age: parseInt(c.age), child_gender: c.gender, child_country_code: c.country_code,
          child_city: c.city || '', child_school: c.school || '',
        })),
      };
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-child`, payload);
      const pToken = res.data.parent_token || res.data.token;
      setParentToken(pToken); setToken(res.data.token); setUserData(res.data.user);
      await fetchLinkedProfiles(pToken); await connectWithInviter(res.data.token);
      navigate('/feed');
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
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => step > 1 ? setStep(step - 1) : setPhase('gate')} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="var(--text-color)" />
        </button>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>
          {step === 1 ? 'Parent / Guardian Details' : "Your Child's Profile"}
        </p>
      </div>
      <ProgressBar current={step} total={2} />
      {error && <div className="mb-4 px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, color: '#FF3B30', fontFamily: 'var(--font)' }}>{error}</div>}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="a1" {...slideIn} className="flex-1 flex flex-col">
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 4 }}>Your details 🛡️</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginBottom: 24, lineHeight: '1.8em' }}>As the parent, you'll use these to log in.</p>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>First Name</label><input placeholder="First name" value={parentForm.first_name} onChange={e => pU('first_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
                <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Last Name</label><input placeholder="Last name" value={parentForm.last_name} onChange={e => pU('last_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
              </div>
              <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Email</label>
                <div className="relative"><F7Icon name="envelope" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type="email" placeholder="parent@example.com" value={parentForm.email} onChange={e => pU('email', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div></div>
              <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Password</label>
                <div className="relative"><F7Icon name="lock" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={parentForm.password} onChange={e => pU('password', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} /><button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }}>{showPass ? <F7Icon name="eye_slash" size={16} color="var(--text-color)" /> : <F7Icon name="eye" size={16} color="var(--text-color)" />}</button></div></div>
            </div>
            <div className="pt-4">
              <button onClick={() => setStep(2)} disabled={!canStep1} className={btnPrimary}
                style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: canStep1 ? 'var(--accent)' : 'var(--light-gray)', color: canStep1 ? '#FFFFFF' : 'var(--text-color)', border: 'none' }}>
                Next <F7Icon name="arrow_right" size={18} color={canStep1 ? '#FFFFFF' : 'var(--text-color)'} />
              </button>
            </div>
          </motion.div>
        )}
        {step === 2 && (
          <motion.div key="a2" {...slideIn} className="flex-1 flex flex-col">
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 4 }}>Tell us about your child 🧒</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginBottom: 16, lineHeight: '1.8em' }}>No email or password needed.</p>
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {children.map((child, idx) => <ChildForm key={idx} index={idx} child={child} onChange={updateChild} onRemove={removeChild} countries={countries} showRemove={children.length > 1} />)}
              {children.length < 5 && (
                <button onClick={addChild} className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium cursor-pointer"
                  style={{ fontFamily: 'var(--font)', color: 'var(--accent)', background: 'var(--light-gray)', border: '1.5px dashed var(--accent)', borderRadius: 10 }}>
                  <F7Icon name="plus" size={16} color="var(--accent)" /> Add Another Child
                </button>
              )}
            </div>
            <div className="pt-4">
              <button onClick={handleSubmit} disabled={!canStep2 || loading} className={btnPrimary}
                style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: canStep2 ? 'var(--accent)' : 'var(--light-gray)', color: canStep2 ? '#FFFFFF' : 'var(--text-color)', border: 'none' }}>
                {loading ? 'Creating Profiles...' : 'Create Profiles'} {!loading && <F7Icon name="arrow_right" size={18} color={canStep2 ? '#FFFFFF' : 'var(--text-color)'} />}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PathBSignup({ setPhase, setToken, setUserData, navigate, error, setError, connectWithInviter }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', username: '', age: '', gender: '', country_code: '', city: '', school: '', email: '', password: '' });
  const u = (k, v) => { setForm(p => ({ ...p, [k]: v })); setError(''); };

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);
  const canSubmit = form.first_name && form.last_name && form.age && form.gender && form.email && form.password.length >= 8 && form.country_code;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = { name: `${form.first_name} ${form.last_name}`.trim(), username: form.username || undefined, email: form.email, password: form.password, age: parseInt(form.age), gender: form.gender, country_code: form.country_code, city: form.city || undefined, school: form.school || undefined };
      const res = await axios.post(`${BACKEND_URL}/api/auth/register-self`, payload);
      setToken(res.data.token); setUserData(res.data.user); await connectWithInviter(res.data.token); navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Registration failed'));
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setPhase('gate')} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="var(--text-color)" />
        </button>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Create Your Profile</p>
      </div>
      {error && <div className="mb-4 px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, color: '#FF3B30', fontFamily: 'var(--font)' }}>{error}</div>}
      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        <div className="grid grid-cols-2 gap-2">
          <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>First Name</label><input placeholder="First name" value={form.first_name} onChange={e => u('first_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
          <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Last Name</label><input placeholder="Last name" value={form.last_name} onChange={e => u('last_name', e.target.value)} className={inputClass} style={inputStyle} /></div>
        </div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Username</label><div className="relative"><F7Icon name="at" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input placeholder="choose a fun name" value={form.username} onChange={e => u('username', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Age</label><input type="number" min="14" max="20" placeholder="Your age" value={form.age} onChange={e => u('age', e.target.value)} className={inputClass} style={inputStyle} /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Gender</label><ToggleButtons options={GENDER_OPTIONS} value={form.gender} onChange={v => u('gender', v)} /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Country</label><CountryDropdown countries={countries} value={form.country_code} onChange={v => u('country_code', v)} testPrefix="self-" /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>City <span style={{ color: 'var(--text-color)' }}>(optional)</span></label><input placeholder="City" value={form.city} onChange={e => u('city', e.target.value)} className={inputClass} style={inputStyle} /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>School <span style={{ color: 'var(--text-color)' }}>(optional)</span></label><input placeholder="School name" value={form.school} onChange={e => u('school', e.target.value)} className={inputClass} style={inputStyle} /></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Email</label><div className="relative"><F7Icon name="envelope" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type="email" placeholder="you@example.com" value={form.email} onChange={e => u('email', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div></div>
        <div><label style={{ fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, color: 'var(--text-color)' }}>Password</label><div className="relative"><F7Icon name="lock" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type={showPass ? 'text' : 'password'} placeholder="Min 8 characters" value={form.password} onChange={e => u('password', e.target.value)} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} /><button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }}>{showPass ? <F7Icon name="eye_slash" size={16} color="var(--text-color)" /> : <F7Icon name="eye" size={16} color="var(--text-color)" />}</button></div></div>
      </div>
      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading} className={btnPrimary}
          style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: canSubmit ? 'var(--accent)' : 'var(--light-gray)', color: canSubmit ? '#FFFFFF' : 'var(--text-color)', border: 'none' }}>
          {loading ? 'Creating Profile...' : 'Create Profile'} {!loading && <F7Icon name="arrow_right" size={18} color={canSubmit ? '#FFFFFF' : 'var(--text-color)'} />}
        </button>
      </div>
    </motion.div>
  );
}

function AddProfileForm({ token, setUserData, navigate, error, setError, fetchLinkedProfiles }) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [child, setChild] = useState(emptyChild());

  useEffect(() => { axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {}); }, []);
  const canSubmit = child.first_name && child.last_name && child.age && child.gender && child.country_code;

  const handleSubmit = async () => {
    setLoading(true); setError('');
    try {
      const payload = { child_name: `${child.first_name} ${child.last_name}`.trim(), child_username: child.username || undefined, child_age: parseInt(child.age), child_gender: child.gender, child_country_code: child.country_code, child_city: child.city || undefined, child_school: child.school || undefined };
      await axios.post(`${BACKEND_URL}/api/auth/add-profile`, payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchLinkedProfiles(token); navigate('/feed');
    } catch (e) {
      const detail = e.response?.data?.detail;
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : e.response?.data?.error || 'Failed to add profile'));
    }
    setLoading(false);
  };

  return (
    <motion.div {...slideIn} className="flex-1 flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/feed')} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="var(--text-color)" />
        </button>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Add New Profile</p>
      </div>
      {error && <div className="mb-4 px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, color: '#FF3B30', fontFamily: 'var(--font)' }}>{error}</div>}
      <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 4 }}>Add a child profile 🧒</h2>
      <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginBottom: 16, lineHeight: '1.8em' }}>No email or password needed.</p>
      <div className="flex-1 overflow-y-auto pb-4"><ChildForm index={0} child={child} onChange={(_, data) => setChild(data)} onRemove={() => {}} countries={countries} showRemove={false} /></div>
      <div className="pt-4">
        <button onClick={handleSubmit} disabled={!canSubmit || loading} className={btnPrimary}
          style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: canSubmit ? 'var(--accent)' : 'var(--light-gray)', color: canSubmit ? '#FFFFFF' : 'var(--text-color)', border: 'none' }}>
          {loading ? 'Adding Profile...' : 'Add Profile'} {!loading && <F7Icon name="sparkles" size={18} color={canSubmit ? '#FFFFFF' : 'var(--text-color)'} />}
        </button>
      </div>
    </motion.div>
  );
}

function LoginForm({ setPhase, setToken, setParentToken, setUserData, navigate, error, setError, fetchLinkedProfiles }) {
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
      setError(Array.isArray(detail) ? detail.map(d => d.msg || JSON.stringify(d)).join(', ') : (typeof detail === 'string' ? detail : 'Login failed'));
    }
    setLoading(false);
  };

  const handlePickProfile = async (profile) => {
    setSwitching(profile.id);
    try {
      if (loginToken) {
        const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`, { target_user_id: profile.id }, { headers: { Authorization: `Bearer ${loginToken}` } });
        const newToken = res.data.token || loginToken;
        setToken(newToken); setParentToken(loginToken);
        if (res.data.user) setUserData(res.data.user);
        else { const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${newToken}` } }); setUserData(meRes.data); }
        fetchLinkedProfiles(loginToken); navigate('/feed');
      }
    } catch (e) {
      setToken('session_' + profile.id); setUserData(profile); navigate('/feed');
    }
    setSwitching(null);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true);
    try { await axios.post(`${BACKEND_URL}/api/auth/forgot-password`, { email: forgotEmail }); setForgotSent(true); }
    catch (e) { const detail = e.response?.data?.detail; setError(typeof detail === 'string' ? detail : 'Failed to send reset email'); }
    setForgotLoading(false);
  };

  if (profiles && profiles.length > 0) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col">
        <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', textAlign: 'center', marginBottom: 8 }}>Who's reading today? 📖</h2>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', textAlign: 'center', marginBottom: 32, lineHeight: '1.8em' }}>Pick a profile to continue.</p>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {profiles.map((profile) => {
            const isSwitching = switching === profile.id;
            return (
              <button key={profile.id} onClick={() => handlePickProfile(profile)} disabled={isSwitching}
                className="w-full flex items-center gap-4 p-5 cursor-pointer"
                style={{ background: 'var(--light-gray)', borderRadius: 18, border: 'none', opacity: isSwitching ? 0.6 : 1 }}>
                <div className="flex-shrink-0 w-14 h-14 rounded-full overflow-hidden" style={{ background: 'var(--accent)' }}>
                  {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl font-bold text-white" style={{ fontFamily: 'var(--font)' }}>{profile.full_name?.charAt(0)?.toUpperCase() || '?'}</div>}
                </div>
                <div className="flex-1 text-left"><p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{profile.full_name}</p></div>
                <F7Icon name="arrow_right" size={18} color="var(--text-color)" />
              </button>
            );
          })}
        </div>
      </motion.div>
    );
  }

  if (forgotMode) {
    return (
      <motion.div {...slideIn} className="flex-1 flex flex-col justify-center">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => { setForgotMode(false); setForgotSent(false); setError(''); }} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
            <F7Icon name="arrow_left" size={18} color="var(--text-color)" />
          </button>
          <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Reset Password</span>
        </div>
        {forgotSent ? (
          <div className="text-center py-8">
            <span className="text-4xl mb-4 block">📬</span>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 8 }}>Check your email!</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', lineHeight: '1.8em' }}>We've sent a password reset link to <strong>{forgotEmail}</strong></p>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 8 }}>Forgot your password?</h2>
            <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginBottom: 24, lineHeight: '1.8em' }}>Enter your email and we'll send a reset link.</p>
            {error && <div className="mb-4 px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, color: '#FF3B30', fontFamily: 'var(--font)' }}>{error}</div>}
            <div className="relative mb-6"><F7Icon name="envelope" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type="email" placeholder="Your email address" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div>
            <button onClick={handleForgotPassword} disabled={forgotLoading || !forgotEmail} className={btnPrimary}
              style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: forgotEmail ? 'var(--accent)' : 'var(--light-gray)', color: forgotEmail ? '#FFFFFF' : 'var(--text-color)', border: 'none' }}>
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
        <button onClick={() => setPhase('gate')} className="p-2 cursor-pointer" style={{ background: 'var(--light-gray)', borderRadius: 10, border: 'none' }}>
          <F7Icon name="arrow_left" size={18} color="var(--text-color)" />
        </button>
        <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>LOG IN</span>
      </div>
      <h2 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginBottom: 8 }}>Welcome back! 👋</h2>
      <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginBottom: 32, lineHeight: '1.8em' }}>Pick up where you left off.</p>
      {error && <div className="mb-4 px-4 py-3 text-sm" style={{ background: 'rgba(255,59,48,0.08)', borderRadius: 10, color: '#FF3B30', fontFamily: 'var(--font)' }}>{error}</div>}
      <div className="space-y-3 mb-6">
        <div className="relative"><F7Icon name="envelope" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type="email" placeholder="Email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem' }} /></div>
        <div className="relative"><F7Icon name="lock" size={16} color="var(--text-color)" className="absolute left-4 top-1/2 -translate-y-1/2" /><input type={showPass ? 'text' : 'password'} placeholder="Password" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} className={inputClass} style={{ ...inputStyle, paddingLeft: '2.8rem', paddingRight: '3rem' }} /><button onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }}>{showPass ? <F7Icon name="eye_slash" size={16} color="var(--text-color)" /> : <F7Icon name="eye" size={16} color="var(--text-color)" />}</button></div>
      </div>
      <button onClick={handleLogin} disabled={loading} className={btnPrimary}
        style={{ fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: 'var(--accent)', color: '#FFFFFF', border: 'none' }}>
        {loading ? 'Signing in...' : 'Sign In'} {!loading && <F7Icon name="arrow_right" size={18} color="#FFFFFF" />}
      </button>
      <button onClick={() => { setForgotMode(true); setError(''); }} className="mt-4 text-sm text-center w-full cursor-pointer"
        style={{ fontFamily: 'var(--font)', color: 'var(--accent)', background: 'none', border: 'none' }}>Forgot password?</button>
      <button onClick={() => setPhase('gate')} className="mt-4 text-sm text-center w-full cursor-pointer"
        style={{ fontFamily: 'var(--font)', color: 'var(--text-color)', background: 'none', border: 'none' }}>
        Don't have an account? <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign up</span>
      </button>
    </motion.div>
  );
}
