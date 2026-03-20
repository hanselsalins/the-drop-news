import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, ChevronRight, LogOut, Trash2, Lock, Eye, EyeOff, Users } from 'lucide-react';
import { ProfileSwitcherModal } from './ProfileSwitcherModal';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ProfilePanel = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { user, token, ageGroup, logout, linkedProfiles: ctxLinkedProfiles, fetchLinkedProfiles, parentToken } = useTheme();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [streak, setStreak] = useState({ current_streak: 0 });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  const isChildAccount = user?.account_type === 'child';
  const hasLinkedProfiles = (ctxLinkedProfiles || []).length > 0;
  const showSwitchButton = isChildAccount || hasLinkedProfiles;
  const isSelfAccount = user?.account_type === 'self' || user?.account_type === 'independent';

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const streakRes = await axios.get(`${BACKEND_URL}/api/streak`, { headers }).catch(() => ({ data: { current_streak: 0 } }));
      setStreak(streakRes.data);
    } catch {}
    fetchLinkedProfiles();
  }, [token, fetchLinkedProfiles]);

  useEffect(() => {
    if (open) {
      fetchData();
      setShowSwitcher(false);
      setShowChangePassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setPasswordError('');
      setPasswordSuccess(false);
    }
  }, [open, fetchData]);

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordForm.new !== passwordForm.confirm) { setPasswordError('Passwords do not match'); return; }
    if (passwordForm.new.length < 6) { setPasswordError('Password must be at least 6 characters'); return; }
    try {
      await axios.post(`${BACKEND_URL}/api/auth/change-password`, {
        current_password: passwordForm.current, new_password: passwordForm.new,
      }, { headers });
      setPasswordSuccess(true);
      setTimeout(() => { setShowChangePassword(false); setPasswordSuccess(false); }, 2000);
    } catch (e) {
      setPasswordError(e.response?.data?.error || 'Failed to change password');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try { await axios.delete(`${BACKEND_URL}/api/auth/account`, { headers }); logout(); navigate('/auth'); } catch {}
    setDeleting(false);
  };

  const handleLogout = () => { logout(); onClose(); navigate('/auth'); };

  const inputStyle = {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    background: '#F5F5F5',
    border: '1px solid #E5E5E5',
    color: '#151924',
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] overflow-y-auto"
            style={{ width: 'min(360px, 85vw)', background: '#EFEFEB' }}
          >
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="p-2 rounded-xl cursor-pointer"
                style={{ background: '#E5E5E5' }}>
                <X size={18} style={{ color: '#878989' }} />
              </button>
            </div>

            {/* Avatar + name */}
            <div className="flex flex-col items-center px-6 pb-5">
              <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: '#1B202F' }}>
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"
                    style={{ background: '#1B202F', color: '#507AF9', fontFamily: "'Inter', sans-serif", fontSize: 32, fontWeight: 700 }}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>

              <h2 style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 17,
                fontWeight: 600,
                color: '#000000',
                marginTop: 12,
              }}>
                {user?.full_name}
              </h2>
              {user?.username && (
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 400, color: '#878989', marginTop: 2 }}>
                  @{user.username}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-center">
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600, color: '#000000' }}>
                    {streak.current_streak || 0}
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 400, color: '#878989' }}>
                    Day Streak
                  </p>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-4">
                <button style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#EFEFEB',
                  border: '1px solid #151924',
                  borderRadius: 4,
                  color: '#151924',
                  padding: '8px 20px',
                  cursor: 'pointer',
                }}>
                  Message
                </button>
                <button style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  fontWeight: 600,
                  background: '#151924',
                  border: 'none',
                  borderRadius: 4,
                  color: '#FFFFFF',
                  padding: '8px 20px',
                  cursor: 'pointer',
                }}>
                  Follow
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: '#E5E5E5', margin: '0 24px' }} />

            {/* Switch Profile */}
            {!isSelfAccount && showSwitchButton && (
              <div className="px-6 py-4">
                <button onClick={() => setShowSwitcher(true)}
                  className="w-full flex items-center gap-3 py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                  style={{ background: 'rgba(80,122,249,0.08)', border: '1px solid rgba(80,122,249,0.2)' }}>
                  <Users size={20} style={{ color: '#507AF9' }} />
                  <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, color: '#151924' }}>
                    Switch Profile
                  </span>
                  <span style={{
                    fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 500, color: '#878989',
                    background: '#E5E5E5', borderRadius: 10, padding: '2px 8px',
                  }}>
                    {(ctxLinkedProfiles || []).length}
                  </span>
                  <ChevronRight size={16} style={{ color: '#878989' }} />
                </button>
              </div>
            )}

            <ProfileSwitcherModal open={showSwitcher} onClose={() => setShowSwitcher(false)} onPanelClose={onClose} />

            {/* Change Password */}
            <div className="px-6 py-4">
              <button onClick={() => setShowChangePassword(!showChangePassword)} className="w-full flex items-center gap-3 py-2 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <Lock size={18} style={{ color: '#878989' }} />
                <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#151924' }}>
                  Change Password
                </span>
                <ChevronRight size={16} style={{ color: '#878989', transform: showChangePassword ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {showChangePassword && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="pt-3 space-y-3">
                      <div className="relative">
                        <input type={showCurrentPw ? 'text' : 'password'} placeholder="Current password"
                          value={passwordForm.current} onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={inputStyle} />
                        <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                          {showCurrentPw ? <Eye size={14} style={{ color: '#878989' }} /> : <EyeOff size={14} style={{ color: '#878989' }} />}
                        </button>
                      </div>
                      <div className="relative">
                        <input type={showNewPw ? 'text' : 'password'} placeholder="New password"
                          value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                          style={inputStyle} />
                        <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                          {showNewPw ? <Eye size={14} style={{ color: '#878989' }} /> : <EyeOff size={14} style={{ color: '#878989' }} />}
                        </button>
                      </div>
                      <input type="password" placeholder="Confirm new password"
                        value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                        style={inputStyle} />
                      {passwordError && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#FF6E6E' }}>{passwordError}</p>}
                      {passwordSuccess && <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: '#34D399' }}>Password changed!</p>}
                      <button onClick={handleChangePassword} className="w-full py-2.5 rounded-xl cursor-pointer"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, background: '#507AF9', color: '#FFFFFF', border: 'none' }}>
                        Update Password
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Delete Account */}
            <div className="px-6 pb-2">
              <button onClick={() => setShowDeleteConfirm(!showDeleteConfirm)} className="w-full flex items-center gap-3 py-2 cursor-pointer" style={{ background: 'none', border: 'none' }}>
                <Trash2 size={18} style={{ color: '#FF6E6E' }} />
                <span className="flex-1 text-left" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, color: '#FF6E6E' }}>
                  Delete Account
                </span>
              </button>

              <AnimatePresence>
                {showDeleteConfirm && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="p-4 rounded-xl mt-2" style={{ background: 'rgba(255,110,110,0.1)', border: '1px solid rgba(255,110,110,0.2)' }}>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#151924', marginBottom: 12 }}>
                        Are you sure? This action cannot be undone.
                      </p>
                      <div className="flex gap-2">
                        <button onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 py-2 rounded-xl cursor-pointer"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 500, background: '#EFEFEB', border: '1px solid #E5E5E5', color: '#878989' }}>
                          Cancel
                        </button>
                        <button onClick={handleDeleteAccount} disabled={deleting}
                          className="flex-1 py-2 rounded-xl cursor-pointer"
                          style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, fontWeight: 600, background: '#FF6E6E', color: '#FFFFFF', border: 'none' }}>
                          {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div style={{ height: 1, background: '#E5E5E5', margin: '0 24px' }} />

            {/* Logout */}
            <div className="px-6 py-4 pb-8">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 600, background: 'transparent', color: '#FF6E6E', border: 'none' }}>
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
