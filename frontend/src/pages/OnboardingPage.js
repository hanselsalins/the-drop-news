import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const groupStyles = {
  '8-10': { label: 'Kid Mode', sub: 'Ages 8-10', desc: 'Big pictures, simple words, lots of fun!', icon: '🎮' },
  '11-13': { label: 'Tween Mode', sub: 'Ages 11-13', desc: 'Real talk, cool comparisons, easy to get.', icon: '🎯' },
  '14-16': { label: 'Teen Mode', sub: 'Ages 14-16', desc: 'No cap, just facts with the right vibe.', icon: '🔥' },
  '17-20': { label: 'Young Adult', sub: 'Ages 17-20', desc: 'Deep dives, real context, think critically.', icon: '💫' },
};

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { setAgeGroup, setUserId, setHasOnboarded } = useTheme();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (groupId) => {
    setSelected(groupId);
    setLoading(true);
    try {
      const res = await axios.post(`${BACKEND_URL}/api/users`, { age_group: groupId });
      setUserId(res.data.id);
      setAgeGroup(groupId);
      setHasOnboarded(true);
      setTimeout(() => navigate('/feed'), 600);
    } catch (e) {
      setAgeGroup(groupId);
      setHasOnboarded(true);
      setTimeout(() => navigate('/feed'), 600);
    }
    setLoading(false);
  };

  return (
    <div data-testid="onboarding-page" className="min-h-screen flex flex-col" style={{ background: 'var(--bg)', padding: '32px 15px' }}>
      <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 600, color: 'var(--title-color)', marginBottom: 20 }}>
          Pick your vibe
        </h1>
        <p style={{ fontFamily: 'var(--font)', fontSize: 15, lineHeight: '1.8em', color: 'var(--text-color)' }}>
          We'll serve your news the way you like it.
        </p>
      </motion.div>

      <div className="flex flex-col gap-4 flex-1">
        {Object.entries(groupStyles).map(([id, style], index) => (
          <motion.button key={id} data-testid={`age-group-${id}`}
            initial={{ x: -40, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(id)} disabled={loading}
            className="relative p-5 text-left overflow-hidden cursor-pointer"
            style={{
              background: 'var(--light-gray)', borderRadius: 18,
              border: selected === id ? '2px solid var(--accent)' : '2px solid transparent',
              opacity: loading && selected !== id ? 0.4 : 1,
            }}>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <span style={{ fontFamily: 'var(--font)', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-color)' }}>
                  {style.sub}
                </span>
                <h3 style={{ fontFamily: 'var(--font)', fontSize: 20, fontWeight: 600, color: 'var(--title-color)', marginTop: 4 }}>
                  {style.label}
                </h3>
                <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)', marginTop: 4, lineHeight: '1.8em' }}>
                  {style.desc}
                </p>
              </div>
              <span className="text-4xl">{style.icon}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
