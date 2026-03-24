import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { F7Icon } from './F7Icon';
import { AvatarCircle, getSavedAvatarId } from './AvatarCircle';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader', color: 'var(--accent)' },
  '11-13': { label: 'News Scout', color: 'var(--accent)' },
  '14-16': { label: 'Drop Regular', color: 'var(--accent)' },
  '17-20': { label: 'Sharp Mind', color: 'var(--accent)' },
};

export const ProfileSwitcherModal = ({ open, onClose, onPanelClose }) => {
  const navigate = useNavigate();
  const { user, token, parentToken, setToken, setUserData, fetchLinkedProfiles } = useTheme();
  const [switching, setSwitching] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const fetchToken = parentToken || token;
  const canAddProfile = !!parentToken;

  useEffect(() => {
    if (!open || !fetchToken) return;
    let cancelled = false;
    const fetchProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/auth/linked-profiles`, {
          headers: { Authorization: `Bearer ${fetchToken}` },
        });
        let fetched = [];
        if (Array.isArray(res.data)) fetched = res.data;
        else if (Array.isArray(res.data?.profiles)) fetched = res.data.profiles;

        const combined = user ? [user, ...fetched] : fetched;
        const seen = new Set();
        const all = combined.filter(p => {
          if (!p?.id || seen.has(p.id)) return false;
          seen.add(p.id); return true;
        });
        const childOnly = all.filter(p => p.account_type === 'child');
        if (!cancelled) setProfiles(childOnly.length > 0 ? childOnly : all);
      } catch {
        if (!cancelled) setProfiles(user ? [user] : []);
      }
      if (!cancelled) setLoadingProfiles(false);
    };
    fetchProfiles();
    return () => { cancelled = true; };
  }, [open, fetchToken, user?.id]);

  const sorted = [
    ...profiles.filter(p => p.id === user?.id),
    ...profiles.filter(p => p.id !== user?.id),
  ];

  const handleSwitch = async (profile) => {
    if (profile.id === user?.id) return;
    setSwitching(profile.id);
    try {
      const switchToken = parentToken || token;
      const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`,
        { target_user_id: profile.id },
        { headers: { Authorization: `Bearer ${switchToken}` } }
      );
      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        let newUser = res.data.user;
        if (!newUser) {
          const meRes = await axios.get(`${BACKEND_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${res.data.token}` },
          });
          newUser = meRes.data;
        }
        setUserData(newUser);
        fetchLinkedProfiles(parentToken || res.data.token);
      } else if (res.data.user) {
        setUserData(res.data.user);
      }
      onClose();
      if (onPanelClose) onPanelClose();
      navigate('/feed');
    } catch (e) {
      console.error('[Switch] FAILED:', e.response?.status, e.message);
    }
    setSwitching(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[80]"
            style={{ background: 'var(--overlay-backdrop)' }} />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed z-[90] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(380px,90vw)] max-h-[80vh] overflow-y-auto"
            style={{ background: 'var(--bg)', borderRadius: 18, boxShadow: 'var(--block-shadow)' }}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex items-center gap-2.5">
                <F7Icon name="person_2_fill" size={18} color="var(--text-color)" />
                <h3 style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--title-color)' }}>
                  Who's reading?
                </h3>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl cursor-pointer"
                style={{ background: 'var(--light-gray)', border: 'none' }}>
                <F7Icon name="xmark" size={16} color="var(--text-color)" />
              </button>
            </div>

            <div className="px-4 pb-4 space-y-2.5">
              {loadingProfiles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--text-color)', borderTopColor: 'transparent' }} />
                </div>
              ) : sorted.length === 0 ? (
                <p className="text-center text-sm py-6" style={{ color: 'var(--text-color)', fontFamily: 'var(--font)' }}>No profiles found</p>
              ) : null}

              {!loadingProfiles && sorted.map((profile) => {
                const isActive = profile.id === user?.id;
                const profBadge = AGE_BADGES[profile.age_group] || AGE_BADGES['14-16'];
                const isSwitching = switching === profile.id;

                return (
                  <button key={profile.id} onClick={() => handleSwitch(profile)}
                    disabled={isActive || isSwitching}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(255,107,0,0.06)' : 'var(--light-gray)',
                      border: isActive ? '1.5px solid rgba(255,107,0,0.3)' : '1.5px solid transparent',
                      opacity: isSwitching ? 0.5 : 1,
                    }}>
                    <AvatarCircle name={profile.full_name} avatarId={getSavedAvatarId(profile.id)} size={52} />
                    <div className="flex-1 text-left min-w-0">
                      <p style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>
                        {profile.full_name}
                      </p>
                      <span style={{
                        fontFamily: 'var(--font)', fontSize: 11, fontWeight: 500,
                        color: 'var(--accent)', display: 'inline-block', marginTop: 2,
                      }}>
                        {profBadge.label}
                      </span>
                    </div>
                    {isActive ? (
                      <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,107,0,0.1)' }}>
                        <F7Icon name="checkmark_alt" size={16} color="var(--accent)" />
                      </div>
                    ) : (
                      <span style={{
                        fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500,
                        color: 'var(--text-color)', background: 'var(--bg)',
                        padding: '4px 12px', borderRadius: 22,
                      }}>
                        {isSwitching ? '...' : 'Switch'}
                      </span>
                    )}
                  </button>
                );
              })}

              {canAddProfile && (
                <button onClick={() => { onClose(); onPanelClose(); navigate('/auth', { state: { addProfile: true } }); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl cursor-pointer"
                  style={{ background: 'var(--light-gray)', border: '1.5px dashed var(--accent)', borderStyle: 'dashed' }}>
                  <div className="flex-shrink-0 w-[48px] h-[48px] rounded-full flex items-center justify-center"
                    style={{ background: 'var(--accent)' }}>
                    <span className="text-white text-2xl font-bold">+</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--accent)' }}>
                    Add New Profile
                  </span>
                </button>
              )}

              {!canAddProfile && user?.account_type === 'child' && (
                <div className="p-4 rounded-2xl text-center" style={{ background: 'var(--light-gray)' }}>
                  <p style={{ fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text-color)' }}>
                    Ask your parent to add a new profile from the login screen
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
