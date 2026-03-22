import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { BottomNav } from '../components/BottomNav';
import { NotificationSettings } from '../components/NotificationSettings';
import { ProfilePanel } from '../components/ProfilePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MapPin, Calendar, Globe, Flame, BookOpen, Trophy, Zap, Heart, Users, ChevronDown, ChevronRight, Edit3, Check, Search, UserPlus, Crown, Link, Copy, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader' }, '11-13': { label: 'News Scout' },
  '14-16': { label: 'Drop Regular' }, '17-20': { label: 'Sharp Mind' },
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUserData, token, ageGroup, logout, darkMode, toggleDarkMode } = useTheme();
  const [stats, setStats] = useState(null);
  const [countries, setCountries] = useState([]);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [editingCity, setEditingCity] = useState(false);
  const [editCity, setEditCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [prevWinner, setPrevWinner] = useState(null);
  const [socialTab, setSocialTab] = useState('friends');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const { permission, requestPermission } = useNotifications();
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    if (!token) return;
    axios.get(`${BACKEND_URL}/api/profile/stats`, { headers }).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/countries`).then(r => setCountries(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends`, { headers }).then(r => setFriends(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends/requests`, { headers }).then(r => setFriendRequests(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends/leaderboard`, { headers }).then(r => { setLeaderboard(r.data.leaderboard); setPrevWinner(r.data.previous_month_winner); }).catch(() => {});
    axios.get(`${BACKEND_URL}/api/invite/my-link`, { headers }).then(r => { setInviteLink(`${window.location.origin}${r.data.invite_url}`); }).catch(() => {});
  }, [token]);

  const badge = AGE_BADGES[ageGroup] || AGE_BADGES['14-16'];
  const userCountry = countries.find(c => c.country_name === user?.country);

  const handleCountrySelect = async (c) => {
    setShowCountryPicker(false); setSaving(true);
    try { const res = await axios.put(`${BACKEND_URL}/api/auth/me`, { country: c.country_name }, { headers }); setUserData(res.data); } catch {}
    setSaving(false);
  };

  const handleSaveCity = async () => {
    setSaving(true);
    try { const res = await axios.put(`${BACKEND_URL}/api/auth/me`, { city: editCity }, { headers }); setUserData(res.data); setEditingCity(false); } catch {}
    setSaving(false);
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const handleSearchFriends = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try { const r = await axios.get(`${BACKEND_URL}/api/friends/search?q=${q}`, { headers }); setSearchResults(r.data); } catch { setSearchResults([]); }
    setSearching(false);
  };

  const handleSendRequest = async (username) => {
    try { await axios.post(`${BACKEND_URL}/api/friends/request`, { target_username: username }, { headers }); setSearchResults(prev => prev.filter(r => r.username !== username)); } catch {}
  };

  const handleAcceptRequest = async (friendshipId) => {
    try { await axios.post(`${BACKEND_URL}/api/friends/accept/${friendshipId}`, {}, { headers }); setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId)); const r = await axios.get(`${BACKEND_URL}/api/friends`, { headers }); setFriends(r.data); } catch {}
  };

  const handleDeclineRequest = async (friendshipId) => {
    try { await axios.post(`${BACKEND_URL}/api/friends/decline/${friendshipId}`, {}, { headers }); setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId)); } catch {}
  };

  const handleCopyInvite = () => { navigator.clipboard.writeText(inviteLink).then(() => { setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); }); };

  const getRankLabel = (score) => {
    if (score >= 501) return 'No Cap Legend'; if (score >= 301) return 'Sharp';
    if (score >= 151) return 'Switched On'; if (score >= 51) return 'Informed'; return 'Curious';
  };

  const formatMemberSince = (d) => { if (!d) return ''; try { return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); } catch { return ''; } };

  const f = 'var(--font)';

  return (
    <div data-testid="profile-page" className="min-h-screen pb-16" style={{ background: 'var(--bg)' }}>
      <div style={{ padding: '0 15px' }} className="max-w-lg mx-auto">

        {/* Page title */}
        <h1 style={{ fontFamily: f, fontSize: 28, fontWeight: 600, color: 'var(--title-color)', marginTop: 32, marginBottom: 20 }}>Settings</h1>

        {/* User summary */}
        <div className="flex items-center gap-4 mb-6">
          <div style={{ width: 55, height: 55, borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--accent)', flexShrink: 0 }}>
            {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" data-testid="profile-avatar" />
              : <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--accent)', color: '#fff', fontFamily: f, fontSize: 22, fontWeight: 700 }}>{user?.full_name?.charAt(0)?.toUpperCase() || 'U'}</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{user?.full_name}</p>
            <p style={{ fontFamily: f, fontSize: 13, fontWeight: 400, color: 'var(--text-color)' }}>{user?.email || ''}</p>
          </div>
          <button data-testid="logout-btn" onClick={handleLogout} className="cursor-pointer"
            style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--accent)', background: 'none', border: 'none' }}>
            Sign Out
          </button>
        </div>

        {/* Toggles */}
        <div style={{ background: 'var(--light-gray)', borderRadius: 18, overflow: 'hidden', marginBottom: 15 }}>
          <div className="flex items-center justify-between" style={{ padding: '14px 15px', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Dark Mode</span>
            <button onClick={toggleDarkMode} className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
              style={{ background: darkMode ? 'var(--accent)' : '#ddd', border: 'none' }}>
              <div className="w-5 h-5 rounded-full" style={{ background: '#fff', transform: darkMode ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
          <div className="flex items-center justify-between" style={{ padding: '14px 15px' }}>
            <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Notifications</span>
            <button onClick={requestPermission} className="w-11 h-6 rounded-full flex items-center px-0.5 cursor-pointer"
              style={{ background: permission === 'granted' ? 'var(--accent)' : '#ddd', border: 'none' }}>
              <div className="w-5 h-5 rounded-full" style={{ background: '#fff', transform: permission === 'granted' ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {/* Account section */}
        <p style={{ fontFamily: f, fontSize: 18, fontWeight: 600, color: 'var(--title-color)', marginTop: 25, marginBottom: 8 }}>Account</p>
        <div style={{ background: 'var(--light-gray)', borderRadius: 18, overflow: 'hidden', marginBottom: 15 }}>
          {/* Country */}
          <button data-testid="country-selector-btn" onClick={() => setShowCountryPicker(!showCountryPicker)}
            className="w-full flex items-center justify-between cursor-pointer"
            style={{ padding: '14px 15px', height: 50, background: 'none', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>
              News Country: {userCountry ? `${userCountry.flag_emoji} ${userCountry.country_name}` : (user?.country || 'Select')}
            </span>
            <ChevronRight size={16} style={{ color: '#8896b8' }} />
          </button>
          {/* City */}
          <div className="flex items-center justify-between" style={{ padding: '14px 15px', height: 50, borderBottom: '1px solid rgba(0,0,0,0.12)' }}>
            {editingCity ? (
              <div className="flex items-center gap-2 flex-1">
                <input data-testid="edit-city-input" value={editCity} onChange={e => setEditCity(e.target.value)}
                  className="flex-1 px-2 py-1 text-sm outline-none" style={{ fontFamily: f, background: 'var(--bg)', borderRadius: 8, border: 'none', color: 'var(--title-color)' }} />
                <button data-testid="save-city-btn" onClick={handleSaveCity} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                  <Check size={16} style={{ color: 'var(--accent)' }} />
                </button>
              </div>
            ) : (
              <>
                <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>City: {user?.city || 'Not set'}</span>
                <button data-testid="edit-city-btn" onClick={() => { setEditingCity(true); setEditCity(user?.city || ''); }} className="cursor-pointer" style={{ background: 'none', border: 'none' }}>
                  <Edit3 size={16} style={{ color: 'var(--accent)' }} />
                </button>
              </>
            )}
          </div>
          {/* Age badge */}
          <div className="flex items-center justify-between" style={{ padding: '14px 15px', height: 50 }}>
            <span style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>Role</span>
            <span data-testid="age-badge" style={{ fontFamily: f, fontSize: 13, fontWeight: 500, color: 'var(--bg)', background: 'var(--title-color)', borderRadius: 22, padding: '0 10px', height: 24, display: 'inline-flex', alignItems: 'center' }}>
              {badge.label}
            </span>
          </div>
        </div>

        {showCountryPicker && (
          <div className="mb-4 max-h-52 overflow-y-auto" style={{ background: 'var(--bg)', border: '1px solid var(--light-gray)', borderRadius: 10, boxShadow: 'var(--block-shadow)' }}>
            {countries.map(c => (
              <button key={c.country_code} data-testid={`country-option-${c.country_code}`} onClick={() => handleCountrySelect(c)}
                className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: f, color: c.country_name === user?.country ? 'var(--accent)' : 'var(--title-color)', background: 'none', border: 'none' }}>
                <span>{c.flag_emoji}</span><span>{c.country_name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Knowledge Score */}
        {stats && (
          <>
            <div data-testid="knowledge-score-card" className="p-5 text-center mb-4"
              style={{ background: 'linear-gradient(135deg, #4C35E8, #7B5FFF)', borderRadius: 18 }}>
              <p style={{ fontFamily: f, fontSize: 11, fontWeight: 500, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>KNOWLEDGE SCORE</p>
              <p data-testid="knowledge-score-value" style={{ fontFamily: f, fontSize: 48, fontWeight: 700, color: '#FFFFFF', margin: 0 }}>{stats.knowledge_score.score}</p>
              <p data-testid="knowledge-rank-label" style={{ fontFamily: f, fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', marginTop: 4 }}>{stats.knowledge_score.rank_label}</p>
            </div>

            {/* Stats 2x2 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div data-testid="streak-card" className="p-4 text-center" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
                <Flame size={20} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <p data-testid="streak-current" style={{ fontFamily: f, fontSize: 28, fontWeight: 600, color: 'var(--title-color)' }}>{stats.streak.current}</p>
                <p style={{ fontFamily: f, fontSize: 11, fontWeight: 500, color: 'var(--text-color)', textTransform: 'uppercase' }}>day streak</p>
                <p style={{ fontFamily: f, fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 4 }}>Best: {stats.streak.longest}</p>
              </div>
              <div data-testid="stories-read-card" className="p-4 text-center" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
                <BookOpen size={20} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <p data-testid="stories-read-total" style={{ fontFamily: f, fontSize: 28, fontWeight: 600, color: 'var(--title-color)' }}>{stats.stories_read.total}</p>
                <p style={{ fontFamily: f, fontSize: 11, fontWeight: 500, color: 'var(--text-color)', textTransform: 'uppercase' }}>stories read</p>
                <p style={{ fontFamily: f, fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 4 }}>Week: {stats.stories_read.this_week}</p>
              </div>
              <div data-testid="favourite-topic-card" className="p-4 text-center" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
                <Trophy size={20} style={{ color: '#FFD60A', margin: '0 auto 8px' }} />
                <p className="capitalize" style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{stats.favourite_category}</p>
                <p style={{ fontFamily: f, fontSize: 11, fontWeight: 500, color: 'var(--text-color)', textTransform: 'uppercase' }}>top topic</p>
              </div>
              <div data-testid="reactions-card" className="p-4 text-center" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
                <span style={{ fontSize: 20, display: 'block', marginBottom: 8 }}>{stats.reactions.most_used || '---'}</span>
                <p data-testid="reactions-total" style={{ fontFamily: f, fontSize: 28, fontWeight: 600, color: 'var(--title-color)' }}>{stats.reactions.total}</p>
                <p style={{ fontFamily: f, fontSize: 11, fontWeight: 500, color: 'var(--text-color)', textTransform: 'uppercase' }}>reactions</p>
              </div>
            </div>

            {/* Countries */}
            <div data-testid="countries-card" className="flex items-center gap-4 p-4 mb-4" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
              <Globe size={20} style={{ color: 'var(--accent)' }} />
              <div>
                <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{stats.countries_covered} countries</p>
                <p style={{ fontFamily: f, fontSize: 13, fontWeight: 400, color: 'var(--text-color)', textTransform: 'uppercase' }}>IN YOUR FEED THIS WEEK</p>
              </div>
            </div>
          </>
        )}

        {/* Friends */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontFamily: f, fontSize: 18, fontWeight: 600, color: 'var(--title-color)', marginTop: 25 }}>Friends</p>
            <div className="flex gap-2" style={{ marginTop: 25 }}>
              <button data-testid="invite-link-btn" onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase cursor-pointer"
                style={{ fontFamily: f, background: 'rgba(255,107,0,0.1)', color: 'var(--accent)', borderRadius: 10, border: 'none' }}>
                {copiedLink ? <Check size={12} /> : <Link size={12} />} {copiedLink ? 'Copied!' : 'Invite'}
              </button>
              <button data-testid="add-friend-btn" onClick={() => setShowAddFriend(!showAddFriend)}
                className="p-2 cursor-pointer" style={{ background: 'rgba(255,107,0,0.1)', borderRadius: 10, border: 'none' }}>
                {showAddFriend ? <X size={14} color="var(--accent)" /> : <UserPlus size={14} color="var(--accent)" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddFriend && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
                <div className="p-4" style={{ background: 'var(--light-gray)', borderRadius: 15 }}>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-color)' }} />
                    <input data-testid="friend-search-input" placeholder="Find @username" value={searchQuery}
                      onChange={e => handleSearchFriends(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm outline-none"
                      style={{ fontFamily: f, background: 'var(--bg)', borderRadius: 10, border: 'none', color: 'var(--title-color)' }} />
                  </div>
                  {searching && <p className="text-xs text-center py-2" style={{ color: 'var(--text-color)' }}>Searching...</p>}
                  {searchResults.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 border-t" style={{ borderColor: 'var(--light-gray)' }}>
                      <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{r.full_name}</p>
                        <p style={{ fontFamily: f, fontSize: 11, color: 'var(--text-color)' }}>@{r.username} · {r.knowledge_score} pts</p>
                      </div>
                      <button data-testid={`add-friend-${r.username}`} onClick={() => handleSendRequest(r.username)}
                        className="px-3 py-1.5 text-xs font-bold uppercase cursor-pointer"
                        style={{ fontFamily: f, background: 'var(--accent)', color: '#fff', borderRadius: 10, border: 'none' }}>Add</button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-1 p-1 mb-3" style={{ background: 'var(--light-gray)', borderRadius: 10 }}>
            {[
              { id: 'friends', label: 'Friends', count: friends.length },
              { id: 'leaderboard', label: 'Board' },
              { id: 'requests', label: 'Requests', count: friendRequests.length },
            ].map(tab => (
              <button key={tab.id} data-testid={`social-tab-${tab.id}`} onClick={() => setSocialTab(tab.id)}
                className="flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                style={{
                  fontFamily: f, borderRadius: 8, border: 'none',
                  background: socialTab === tab.id ? 'var(--bg)' : 'transparent',
                  color: socialTab === tab.id ? 'var(--accent)' : 'var(--text-color)',
                  boxShadow: socialTab === tab.id ? 'var(--block-shadow)' : 'none',
                }}>
                {tab.label}
                {tab.count > 0 && (
                  <span className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center"
                    style={{ background: tab.id === 'requests' ? '#FF3B30' : 'var(--accent)', color: '#fff' }}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {socialTab === 'friends' && (
            <div style={{ background: 'var(--light-gray)', borderRadius: 15, overflow: 'hidden' }}>
              {friends.length === 0 ? (
                <p className="text-center py-6" style={{ fontFamily: f, fontSize: 13, color: 'var(--text-color)' }}>No friends yet</p>
              ) : friends.slice(0, 20).map((fr, i) => (
                <div key={fr.id} data-testid={`friend-${fr.username}`} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none' }}>
                  <img src={fr.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{fr.full_name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--accent)' }}><Flame size={10} /> {fr.current_streak}</span>
                      <span style={{ fontFamily: f, fontSize: 11, color: 'var(--text-color)' }}>{fr.knowledge_score} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {socialTab === 'leaderboard' && leaderboard && (
            <div style={{ background: 'var(--light-gray)', borderRadius: 15, overflow: 'hidden' }}>
              {leaderboard.map((e, i) => (
                <div key={e.id} data-testid={`leaderboard-${e.rank}`} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none', background: e.is_self ? 'rgba(255,107,0,0.04)' : 'transparent' }}>
                  <span className="w-6 text-center text-sm font-bold" style={{ fontFamily: f, color: e.rank <= 3 ? '#FFD60A' : 'var(--text-color)' }}>{e.rank}</span>
                  <img src={e.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{e.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--accent)' }}>{e.knowledge_score}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {socialTab === 'requests' && (
            <div style={{ background: 'var(--light-gray)', borderRadius: 15, overflow: 'hidden' }}>
              {friendRequests.length === 0 ? (
                <p className="text-center py-6" style={{ fontFamily: f, fontSize: 13, color: 'var(--text-color)' }}>No pending requests</p>
              ) : friendRequests.map((r, i) => (
                <div key={r.friendship_id} className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid rgba(0,0,0,0.12)' : 'none' }}>
                  <img src={r.sender.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: f, fontSize: 15, fontWeight: 500, color: 'var(--title-color)' }}>{r.sender.full_name}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button data-testid={`accept-${r.sender.username}`} onClick={() => handleAcceptRequest(r.friendship_id)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
                      style={{ fontFamily: f, background: 'var(--accent)', color: '#fff', borderRadius: 10, border: 'none' }}>Accept</button>
                    <button data-testid={`decline-${r.sender.username}`} onClick={() => handleDeclineRequest(r.friendship_id)}
                      className="px-3 py-1.5 text-[10px] font-bold uppercase cursor-pointer"
                      style={{ fontFamily: f, background: 'rgba(255,59,48,0.1)', color: '#FF3B30', borderRadius: 10, border: 'none' }}>Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log out */}
        <button onClick={handleLogout} className="w-full cursor-pointer"
          style={{ fontFamily: f, fontSize: 14, fontWeight: 500, height: 44, borderRadius: 10, background: 'var(--light-gray)', color: '#FF3B30', border: 'none', marginTop: 25 }}>
          Log Out
        </button>
      </div>

      <BottomNav active="settings" />
      <ProfilePanel open={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />
    </div>
  );
}
