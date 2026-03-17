import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_TO_BAND = {
  '8-10': 'big-bold-bright',
  '11-13': 'cool-connected',
  '14-16': 'sharp-aware',
  '17-20': 'editorial',
};

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader', color: '#FFD60A' },
  '11-13': { label: 'News Scout', color: '#3B82F6' },
  '14-16': { label: 'Drop Regular', color: '#8B5CF6' },
  '17-20': { label: 'Sharp Mind', color: '#EC4899' },
};

const GRADIENTS = {
  'big-bold-bright': 'linear-gradient(135deg, #FF4B4B, #FFD93D)',
  'cool-connected': 'linear-gradient(135deg, #1E90FF, #00D4AA)',
  'sharp-aware': 'linear-gradient(135deg, #5C4EFA, #22D3EE)',
  'editorial': 'linear-gradient(135deg, #00D4FF, #FF2D78)',
};

export const ProfileSwitcherModal = ({ open, onClose, onPanelClose }) => {
  const navigate = useNavigate();
  const { user, token, band, setToken, setUserData, linkedProfiles: ctxLinkedProfiles, fetchLinkedProfiles } = useTheme();
  const isDark = band === 'sharp-aware' || band === 'editorial';
  const [switching, setSwitching] = useState(null);

  const allProfiles = ctxLinkedProfiles || [];
  // Ensure current user is first
  const sorted = [
    ...allProfiles.filter(p => p.id === user?.id),
    ...allProfiles.filter(p => p.id !== user?.id),
  ];

  const handleSwitch = async (profile) => {
    if (profile.id === user?.id) return;
    setSwitching(profile.id);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`, { target_user_id: profile.id }, { headers });
      if (res.data.token) {
        setToken(res.data.token);
        const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${res.data.token}` },
        });
        setUserData(meRes.data);
        fetchLinkedProfiles(res.data.token);
      } else if (res.data.user) {
        setUserData(res.data.user);
      }
      onClose();
      onPanelClose();
      navigate('/feed');
    } catch (e) {
      console.error('[Switch] Failed:', e);
    }
    setSwitching(null);
  };

  const modalBg = isDark ? 'var(--drop-surface)' : '#FFFFFF';
  const fallbackGradient = 'linear-gradient(135deg, #3B82F6, #8B5CF6)';

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed z-[90] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(380px,90vw)] max-h-[80vh] overflow-y-auto rounded-3xl"
            style={{
              background: modalBg,
              boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 0 1px var(--drop-border)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <Users size={18} style={{ color: 'var(--drop-text-muted)' }} />
                <h3 className="text-base font-bold" style={{ fontFamily: 'var(--drop-font-heading)', color: 'var(--drop-text)' }}>
                  Who's reading?
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl transition-colors"
                style={{ background: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9' }}>
                <X size={16} style={{ color: 'var(--drop-text-muted)' }} />
              </button>
            </div>

            {/* Profile cards */}
            <div className="px-4 pb-4 space-y-2.5">
              {sorted.map((profile) => {
                const isActive = profile.id === user?.id;
                const profBadge = AGE_BADGES[profile.age_group] || AGE_BADGES['14-16'];
                const profBand = AGE_TO_BAND[profile.age_group];
                const profGradient = GRADIENTS[profBand] || fallbackGradient;
                const isSwitching = switching === profile.id;

                return (
                  <motion.button
                    key={profile.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSwitch(profile)}
                    disabled={isActive || isSwitching}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                    style={{
                      background: isActive
                        ? (isDark ? 'rgba(92,78,250,0.12)' : '#EFF6FF')
                        : (isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC'),
                      border: isActive
                        ? (isDark ? '1.5px solid rgba(92,78,250,0.3)' : '1.5px solid #93C5FD')
                        : '1.5px solid var(--drop-border)',
                      opacity: isSwitching ? 0.5 : 1,
                      cursor: isActive ? 'default' : 'pointer',
                    }}
                  >
                    {/* Large avatar */}
                    <div className="flex-shrink-0" style={{ width: 52, height: 52, borderRadius: '50%', padding: 2.5, background: profGradient }}>
                      <div className="w-full h-full rounded-full overflow-hidden">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold"
                            style={{ background: profGradient, color: '#FFFFFF', fontFamily: 'var(--drop-font-heading)', fontSize: 22 }}>
                            {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
                        {profile.full_name}
                      </p>
                      <span className="inline-block text-[10px] font-bold tracking-wider uppercase mt-1 px-2 py-0.5 rounded-full"
                        style={{ background: `${profBadge.color}15`, color: profBadge.color, fontFamily: 'var(--drop-font-body)' }}>
                        {profBadge.label}
                      </span>
                    </div>

                    {/* Status */}
                    {isActive ? (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: `${profBadge.color}20` }}>
                        <Check size={16} style={{ color: profBadge.color }} strokeWidth={3} />
                      </div>
                    ) : (
                      <span className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
                        style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#F1F5F9', color: 'var(--drop-text-muted)', fontFamily: 'var(--drop-font-body)' }}>
                        {isSwitching ? '...' : 'Switch'}
                      </span>
                    )}
                  </motion.button>
                );
              })}

              {/* Add New Profile */}
              <button
                onClick={() => { onClose(); onPanelClose(); navigate('/auth', { state: { addProfile: true } }); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl transition-colors"
                style={{ background: isDark ? 'rgba(0,212,255,0.06)' : '#F0F9FF', border: isDark ? '1.5px dashed rgba(0,212,255,0.3)' : '1.5px dashed #93C5FD' }}>
                <div className="flex-shrink-0 w-[52px] h-[52px] rounded-full flex items-center justify-center"
                  style={{ background: GRADIENTS[band] || fallbackGradient }}>
                  <span className="text-white text-2xl font-bold">+</span>
                </div>
                <span className="text-sm font-semibold" style={{ fontFamily: 'var(--drop-font-body)', color: isDark ? 'var(--drop-accent, #00D4FF)' : '#3B82F6' }}>
                  Add New Profile
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
