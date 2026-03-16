import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, ChevronRight, LogOut, Trash2, Lock, Eye, EyeOff, Check } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader', color: '#FFD60A' },
  '11-13': { label: 'News Scout', color: '#3B82F6' },
  '14-16': { label: 'Drop Regular', color: '#8B5CF6' },
  '17-20': { label: 'Sharp Mind', color: '#EC4899' },
};

const ACCOUNT_TYPES = {
  child: { label: 'Child Account', color: '#3B82F6' },
  parent: { label: 'Parent Account', color: '#8B5CF6' },
  independent: { label: 'Independent', color: '#10B981' },
};

export const ProfilePanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, token, ageGroup, logout, setToken, setUserData } = useTheme();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [linkedProfiles, setLinkedProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [streak, setStreak] = useState({ current_streak: 0 });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [streakRes, profilesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/streak`, { headers }),
        axios.get(`${BACKEND_URL}/api/auth/linked-profiles`, { headers }).catch(() => ({ data: [] })),
      ]);
      setStreak(streakRes.data);
      const profiles = profilesRes.data?.profiles || profilesRes.data;
      setLinkedProfiles(Array.isArray(profiles) ? profiles : []);
    } catch {}
  }, [token]);

  useEffect(() => {
    if (open) {
      fetchData();
      setShowChangePassword(false);
      setShowDeleteConfirm(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setPasswordSuccess(false);
    }
  }, [open, fetchData]);

  const handleSwitchProfile = async (profileId) => {
    if (profileId === user?.id) return;
    try {
      const res = await axios.post(`${BACKEND_URL}/api/auth/switch-profile`, { target_user_id: profileId }, { headers });
      if (res.data.token) setToken(res.data.token);
      if (res.data.user) setUserData(res.data.user);
      onClose();
      navigate('/feed');
    } catch {}
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (passwordForm.new.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/auth/change-password`, {
        current_password: passwordForm.current,
        new_password: passwordForm.new,
      }, { headers });
      setPasswordSuccess(true);
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (e) {
      setPasswordError(e.response?.data?.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${BACKEND_URL}/api/auth/account`, { headers });
      logout();
      navigate('/auth');
    } catch {}
    setDeleting(false);
  };

  const handleLogout = () => {
    logout();
    onClose();
    navigate('/auth');
  };

  const badge = AGE_BADGES[ageGroup] || AGE_BADGES['14-16'];
  const accountType = ACCOUNT_TYPES[user?.account_type] || ACCOUNT_TYPES.independent;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] overflow-y-auto"
            style={{
              width: 'min(360px, 85vw)',
              background: '#FFFFFF',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
            }}
          >
            {/* Close button */}
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="p-2 rounded-xl" style={{ background: '#F1F5F9' }}>
                <X size={18} style={{ color: '#64748B' }} />
              </button>
            </div>

            {/* Profile picture */}
            <div className="flex flex-col items-center px-6 pb-5">
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  padding: 3,
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                }}
              >
                <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden' }}>
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        color: '#FFFFFF',
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: 32,
                        fontWeight: 700,
                      }}
                    >
                      {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
              </div>

              {/* Name */}
              <h2
                className="mt-3 text-xl font-bold text-center"
                style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}
              >
                {user?.full_name}
              </h2>
              {user?.username && (
                <p className="text-sm mt-0.5" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
                  @{user.username}
                </p>
              )}

              {/* Badges */}
              <div className="flex items-center gap-2 mt-3">
                <span
                  className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{ fontFamily: 'Outfit, sans-serif', background: `${badge.color}15`, color: badge.color }}
                >
                  {badge.label}
                </span>
                <span
                  className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-full"
                  style={{ fontFamily: 'Outfit, sans-serif', background: `${accountType.color}15`, color: accountType.color }}
                >
                  {accountType.label}
                </span>
              </div>

              {/* Streak */}
              <div
                className="flex items-center gap-2 mt-4 px-4 py-2 rounded-full"
                style={{ background: '#FFF7ED', border: '1.5px solid #FFEDD5' }}
              >
                <Flame size={18} style={{ color: '#F97316' }} fill="#F97316" />
                <span className="text-sm font-bold" style={{ fontFamily: 'Fredoka, sans-serif', color: '#F97316' }}>
                  {streak.current_streak} day streak
                </span>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F1F5F9', margin: '0 24px' }} />

            {/* Profile Switching */}
            {/* Profile Switching */}
            <div className="px-6 py-4">
              {linkedProfiles.length > 0 && (
                <>
                  <p
                    className="text-[10px] font-bold tracking-wider uppercase mb-3"
                    style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}
                  >
                    Profiles
                  </p>
                  <div className="space-y-2">
                    {/* Active profile (current user) */}
                    <div
                      className="w-full flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: '#EFF6FF', border: '1.5px solid #BFDBFE' }}
                    >
                      <div
                        className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                        style={{ border: '2px solid #3B82F6' }}
                      >
                        {user?.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div
                            className="w-full h-full flex items-center justify-center text-sm font-bold"
                            style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif' }}
                          >
                            {user?.full_name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                          {user?.full_name}
                        </p>
                        <p className="text-[10px]" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
                          {AGE_BADGES[ageGroup]?.label || ageGroup}
                        </p>
                      </div>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#3B82F6' }}>
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    </div>

                    {/* Linked profiles */}
                    {linkedProfiles.map((profile) => (
                      <button
                        key={profile.id}
                        onClick={() => handleSwitchProfile(profile.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors"
                        style={{ background: '#F8FAFC', border: '1.5px solid #F1F5F9' }}
                      >
                        <div
                          className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0"
                          style={{ border: '2px solid #E2E8F0' }}
                        >
                          {profile.avatar_url ? (
                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center text-sm font-bold"
                              style={{ background: '#E2E8F0', color: '#64748B', fontFamily: 'Fredoka, sans-serif' }}
                            >
                              {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                            {profile.full_name}
                          </p>
                          <p className="text-[10px]" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
                            {AGE_BADGES[profile.age_group]?.label || profile.age_group}
                          </p>
                        </div>
                        <ChevronRight size={16} style={{ color: '#CBD5E1' }} />
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Add New Profile button */}
              <button
                onClick={() => {
                  onClose();
                  navigate('/auth', { state: { addProfile: true } });
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl mt-2 transition-colors"
                style={{ background: '#F0F9FF', border: '1.5px dashed #93C5FD' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)' }}
                >
                  <span className="text-white text-lg font-bold">+</span>
                </div>
                <span className="text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#3B82F6' }}>
                  Add New Profile
                </span>
              </button>
            </div>
            <div style={{ height: 1, background: '#F1F5F9', margin: '0 24px' }} />

            {/* Change Password */}
            <div className="px-6 py-4">
              <button
                onClick={() => setShowChangePassword(!showChangePassword)}
                className="w-full flex items-center gap-3 py-2"
              >
                <Lock size={18} style={{ color: '#64748B' }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
                  Change Password
                </span>
                <ChevronRight
                  size={16}
                  style={{
                    color: '#CBD5E1',
                    transform: showChangePassword ? 'rotate(90deg)' : 'none',
                    transition: 'transform 0.2s',
                  }}
                />
              </button>

              <AnimatePresence>
                {showChangePassword && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-3">
                      <div className="relative">
                        <input
                          type={showCurrentPw ? 'text' : 'password'}
                          placeholder="Current password"
                          value={passwordForm.current}
                          onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ fontFamily: 'Outfit, sans-serif', background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                        />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showCurrentPw ? <EyeOff size={14} style={{ color: '#94A3B8' }} /> : <Eye size={14} style={{ color: '#94A3B8' }} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showNewPw ? 'text' : 'password'}
                          placeholder="New password"
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={{ fontFamily: 'Outfit, sans-serif', background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                        />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                          {showNewPw ? <EyeOff size={14} style={{ color: '#94A3B8' }} /> : <Eye size={14} style={{ color: '#94A3B8' }} />}
                        </button>
                      </div>
                      <input
                        type="password"
                        placeholder="Confirm new password"
                        value={passwordForm.confirm}
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={{ fontFamily: 'Outfit, sans-serif', background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}
                      />
                      {passwordError && (
                        <p className="text-xs" style={{ color: '#EF4444', fontFamily: 'Outfit, sans-serif' }}>{passwordError}</p>
                      )}
                      {passwordSuccess && (
                        <p className="text-xs" style={{ color: '#10B981', fontFamily: 'Outfit, sans-serif' }}>Password changed successfully!</p>
                      )}
                      <button
                        onClick={handleChangePassword}
                        className="w-full py-2.5 rounded-xl text-sm font-bold"
                        style={{
                          fontFamily: 'Outfit, sans-serif',
                          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                          color: '#FFFFFF',
                          border: 'none',
                        }}
                      >
                        Update Password
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delete Account */}
            <div className="px-6 pb-2">
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="w-full flex items-center gap-3 py-2"
              >
                <Trash2 size={18} style={{ color: '#EF4444' }} />
                <span className="flex-1 text-left text-sm font-medium" style={{ fontFamily: 'Outfit, sans-serif', color: '#EF4444' }}>
                  Delete Account
                </span>
              </button>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 rounded-xl mt-2" style={{ background: '#FEF2F2', border: '1.5px solid #FECACA' }}>
                      <p className="text-sm mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#991B1B' }}>
                        Are you sure? This action cannot be undone. All your data will be permanently deleted.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-xl text-sm font-medium"
                          style={{ fontFamily: 'Outfit, sans-serif', background: '#FFFFFF', border: '1.5px solid #E2E8F0', color: '#64748B' }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleting}
                          className="flex-1 py-2 rounded-xl text-sm font-bold"
                          style={{ fontFamily: 'Outfit, sans-serif', background: '#EF4444', color: '#FFFFFF', border: 'none' }}
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: '#F1F5F9', margin: '0 24px' }} />

            {/* Logout */}
            <div className="px-6 py-4 pb-8">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  background: '#FEF2F2',
                  color: '#EF4444',
                  border: '1.5px solid #FECACA',
                }}
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
