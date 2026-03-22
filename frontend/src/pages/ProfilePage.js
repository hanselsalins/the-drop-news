import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { BottomNav } from '../components/BottomNav';
import { NotificationSettings } from '../components/NotificationSettings';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, MapPin, Calendar, Globe, Flame, BookOpen, Trophy, Zap, Heart, Users, ChevronDown, Edit3, Check, Search, UserPlus, Crown, Link, Copy, X } from 'lucide-react';
import { ProfileButton } from '../components/ProfileButton';
import { ProfilePanel } from '../components/ProfilePanel';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const AGE_BADGES = {
  '8-10': { label: 'Junior Reader' },
  '11-13': { label: 'News Scout' },
  '14-16': { label: 'Drop Regular' },
  '17-20': { label: 'Sharp Mind' },
};

const CATEGORY_ICONS = {
  world: Globe, science: Zap, money: Trophy, entertainment: Heart,
  history: BookOpen, local: MapPin,
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUserData, token, ageGroup, band, logout } = useTheme();
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
    axios.get(`${BACKEND_URL}/api/friends/leaderboard`, { headers }).then(r => {
      setLeaderboard(r.data.leaderboard);
      setPrevWinner(r.data.previous_month_winner);
    }).catch(() => {});
    axios.get(`${BACKEND_URL}/api/invite/my-link`, { headers }).then(r => {
      setInviteLink(`${window.location.origin}${r.data.invite_url}`);
    }).catch(() => {});
  }, [token]);

  const badge = AGE_BADGES[ageGroup] || AGE_BADGES['14-16'];
  const userCountry = countries.find(c => c.country_name === user?.country);

  const handleCountrySelect = async (c) => {
    setShowCountryPicker(false);
    setSaving(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/api/auth/me`, { country: c.country_name }, { headers });
      setUserData(res.data);
    } catch {}
    setSaving(false);
  };

  const handleSaveCity = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${BACKEND_URL}/api/auth/me`, { city: editCity }, { headers });
      setUserData(res.data);
      setEditingCity(false);
    } catch {}
    setSaving(false);
  };

  const handleLogout = () => { logout(); navigate('/auth'); };

  const handleSearchFriends = async (q) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const r = await axios.get(`${BACKEND_URL}/api/friends/search?q=${q}`, { headers });
      setSearchResults(r.data);
    } catch { setSearchResults([]); }
    setSearching(false);
  };

  const handleSendRequest = async (username) => {
    try {
      await axios.post(`${BACKEND_URL}/api/friends/request`, { target_username: username }, { headers });
      setSearchResults(prev => prev.filter(r => r.username !== username));
    } catch {}
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/friends/accept/${friendshipId}`, {}, { headers });
      setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
      const r = await axios.get(`${BACKEND_URL}/api/friends`, { headers });
      setFriends(r.data);
    } catch {}
  };

  const handleDeclineRequest = async (friendshipId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/friends/decline/${friendshipId}`, {}, { headers });
      setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
    } catch {}
  };

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const getRankLabel = (score) => {
    if (score >= 501) return 'No Cap Legend';
    if (score >= 301) return 'Sharp';
    if (score >= 151) return 'Switched On';
    if (score >= 51) return 'Informed';
    return 'Curious';
  };

  const formatMemberSince = (d) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); } catch { return ''; }
  };

  const getFlameSize = (streak) => {
    if (streak >= 100) return 48;
    if (streak >= 50) return 40;
    if (streak >= 30) return 36;
    if (streak >= 7) return 32;
    return 24;
  };

  const font = "'Rubik', sans-serif";
  const cardStyle = { borderRadius: 14, background: 'var(--light-gray)', boxShadow: 'var(--shadow)' };
  const labelStyle = { fontFamily: font, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-color)' };

  return (
    <div data-testid="profile-page" className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      <div className="px-5 pt-6 max-w-lg mx-auto relative">
        <div className="absolute top-6 right-5 z-10">
          <ProfileButton onClick={() => setProfilePanelOpen(true)} size={34} />
        </div>

        {/* ━━━ IDENTITY HEADER ━━━ */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="relative p-5 mb-4" style={cardStyle}>

          <button data-testid="logout-btn" onClick={handleLogout}
            className="absolute top-4 right-4 p-2 rounded-xl transition-colors"
            style={{ background: 'rgba(239,68,68,0.06)' }}>
            <LogOut size={16} color="#ef4444" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0"
              style={{ borderColor: 'var(--accent)', borderWidth: '3px', borderStyle: 'solid' }}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" data-testid="profile-avatar" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ background: 'var(--accent)', color: '#fff', fontFamily: font }}>
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <h1 className="text-xl font-bold truncate" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                {user?.full_name}
                {user?.username && (
                  <span className="text-sm font-normal ml-2" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                    @{user.username}
                  </span>
                )}
              </h1>

              <div className="flex items-center gap-1.5 mt-1">
                {userCountry && <span className="text-sm">{userCountry.flag_emoji}</span>}
                <span className="text-xs" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                  {user?.city ? `${user.city}, ` : ''}{user?.country || ''}
                </span>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {stats?.member_since && (
                  <span className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                    <Calendar size={10} className="inline mr-1" />
                    Member since {formatMemberSince(stats.member_since)}
                  </span>
                )}
                <span data-testid="age-badge" className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full"
                  style={{ fontFamily: font, background: 'var(--accent)', color: '#fff' }}>
                  {badge.label}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ━━━ STATS ━━━ */}
        {stats && (
          <div className="space-y-3 mb-4">
            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
              data-testid="knowledge-score-card"
              className="p-5 text-center relative overflow-hidden" style={cardStyle}>
              <p style={labelStyle} className="mb-2">KNOWLEDGE SCORE</p>
              <p data-testid="knowledge-score-value" className="text-5xl font-bold mb-1"
                style={{ fontFamily: font, color: 'var(--accent)' }}>
                {stats.knowledge_score.score}
              </p>
              <span data-testid="knowledge-rank-label" className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase"
                style={{ fontFamily: font, background: 'rgba(33,150,243,0.1)', color: 'var(--accent)' }}>
                {stats.knowledge_score.rank_label}
              </span>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                data-testid="streak-card" className="p-4" style={cardStyle}>
                <div className="flex items-center justify-center mb-2">
                  <Flame size={getFlameSize(stats.streak.current)} color="#FF6B35" fill={stats.streak.current > 0 ? '#FF6B35' : 'none'} />
                </div>
                <p data-testid="streak-current" className="text-2xl font-bold text-center"
                  style={{ fontFamily: font, color: 'var(--title-color)' }}>{stats.streak.current}</p>
                <p style={{ ...labelStyle, textAlign: 'center' }}>day streak</p>
                <p className="text-[10px] text-center mt-1.5" style={{ fontFamily: font, color: 'var(--text-color)' }}>Best: {stats.streak.longest}</p>
              </motion.div>

              <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.12 }}
                data-testid="stories-read-card" className="p-4" style={cardStyle}>
                <div className="flex items-center justify-center mb-2">
                  <BookOpen size={24} color="var(--accent)" />
                </div>
                <p data-testid="stories-read-total" className="text-2xl font-bold text-center"
                  style={{ fontFamily: font, color: 'var(--title-color)' }}>{stats.stories_read.total}</p>
                <p style={{ ...labelStyle, textAlign: 'center' }}>stories read</p>
                <p className="text-[10px] text-center mt-1.5" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                  This week: {stats.stories_read.this_week} / Month: {stats.stories_read.this_month}
                </p>
              </motion.div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
                data-testid="favourite-topic-card" className="p-4" style={cardStyle}>
                <div className="flex items-center justify-center mb-2"><Trophy size={24} color="#FFD60A" /></div>
                <p className="text-sm font-bold text-center capitalize"
                  style={{ fontFamily: font, color: 'var(--title-color)' }}>{stats.favourite_category}</p>
                <p style={{ ...labelStyle, textAlign: 'center' }}>top topic</p>
              </motion.div>

              <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.17 }}
                data-testid="reactions-card" className="p-4" style={cardStyle}>
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">{stats.reactions.most_used || '---'}</span>
                </div>
                <p data-testid="reactions-total" className="text-2xl font-bold text-center"
                  style={{ fontFamily: font, color: 'var(--title-color)' }}>{stats.reactions.total}</p>
                <p style={{ ...labelStyle, textAlign: 'center' }}>reactions</p>
                <p className="text-[10px] text-center mt-1.5" style={{ fontFamily: font, color: 'var(--text-color)' }}>This month: {stats.reactions.this_month}</p>
              </motion.div>
            </div>

            <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              data-testid="countries-card" className="p-4 flex items-center gap-4" style={cardStyle}>
              <Globe size={28} color="var(--accent)" />
              <div>
                <p className="text-lg font-bold" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                  {stats.countries_covered} <span className="text-sm font-normal" style={{ color: 'var(--text-color)' }}>countries</span>
                </p>
                <p style={labelStyle}>in your feed this week</p>
              </div>
            </motion.div>
          </div>
        )}

        {/* ━━━ SETTINGS ━━━ */}
        <div className="space-y-3 mb-4">
          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 }}
            className="p-4 relative" style={cardStyle}>
            <p style={labelStyle} className="mb-2">NEWS COUNTRY</p>
            <button data-testid="country-selector-btn" onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg)', border: '1px solid var(--light-gray)' }}>
              <span className="text-sm font-medium" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                {userCountry ? `${userCountry.flag_emoji} ${userCountry.country_name}` : (user?.country || 'Select')}
              </span>
              <ChevronDown size={14} style={{ color: 'var(--text-color)' }} />
            </button>
            {showCountryPicker && (
              <div className="absolute left-0 right-0 mt-1 mx-4 rounded-xl overflow-hidden z-20 max-h-52 overflow-y-auto"
                style={{ background: 'var(--bg)', border: '1px solid var(--light-gray)', boxShadow: 'var(--shadow)' }}>
                {countries.map(c => (
                  <button key={c.country_code} data-testid={`country-option-${c.country_code}`}
                    onClick={() => handleCountrySelect(c)}
                    className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors"
                    style={{ fontFamily: font, color: c.country_name === user?.country ? 'var(--accent)' : 'var(--title-color)' }}>
                    <span>{c.flag_emoji}</span><span>{c.country_name}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.27 }}
            className="p-4" style={cardStyle}>
            <div className="flex items-center justify-between mb-2">
              <p style={labelStyle}>CITY</p>
              {!editingCity ? (
                <button data-testid="edit-city-btn" onClick={() => { setEditingCity(true); setEditCity(user?.city || ''); }}
                  className="p-1.5 rounded-lg" style={{ background: 'rgba(33,150,243,0.1)' }}>
                  <Edit3 size={12} color="var(--accent)" />
                </button>
              ) : (
                <button data-testid="save-city-btn" onClick={handleSaveCity} disabled={saving}
                  className="p-1.5 rounded-lg" style={{ background: 'rgba(33,150,243,0.1)' }}>
                  <Check size={12} color="var(--accent)" />
                </button>
              )}
            </div>
            {editingCity ? (
              <input data-testid="edit-city-input" value={editCity} onChange={e => setEditCity(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                style={{ fontFamily: font, background: 'var(--bg)', border: '1px solid var(--light-gray)', color: 'var(--title-color)' }} />
            ) : (
              <p className="text-sm font-medium" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                {user?.city || 'Not set'}
              </p>
            )}
          </motion.div>

          <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
            <NotificationSettings permission={permission} onRequestPermission={requestPermission} />
          </motion.div>
        </div>

        {/* ━━━ SOCIAL ━━━ */}
        <motion.div initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.35 }} className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ fontFamily: font, color: 'var(--title-color)' }}>Friends</h2>
            <div className="flex gap-2">
              <button data-testid="invite-link-btn" onClick={handleCopyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider"
                style={{ fontFamily: font, background: 'rgba(33,150,243,0.1)', color: 'var(--accent)' }}>
                {copiedLink ? <Check size={12} /> : <Link size={12} />}
                {copiedLink ? 'Copied!' : 'Invite'}
              </button>
              <button data-testid="add-friend-btn" onClick={() => setShowAddFriend(!showAddFriend)}
                className="p-2 rounded-xl" style={{ background: 'rgba(33,150,243,0.1)' }}>
                {showAddFriend ? <X size={14} color="var(--accent)" /> : <UserPlus size={14} color="var(--accent)" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showAddFriend && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mb-3 overflow-hidden">
                <div className="p-4" style={cardStyle}>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-color)' }} />
                    <input data-testid="friend-search-input" placeholder="Find @username" value={searchQuery}
                      onChange={e => handleSearchFriends(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-lg text-sm outline-none"
                      style={{ fontFamily: font, background: 'var(--bg)', border: '1px solid var(--light-gray)', color: 'var(--title-color)' }} />
                  </div>
                  {searching && <p className="text-xs text-center py-2" style={{ color: 'var(--text-color)' }}>Searching...</p>}
                  {searchResults.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2.5 border-t" style={{ borderColor: 'var(--light-gray)' }}>
                      <img src={r.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ fontFamily: font, color: 'var(--title-color)' }}>{r.full_name}</p>
                        <p className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>@{r.username} · {r.knowledge_score} pts</p>
                      </div>
                      <button data-testid={`add-friend-${r.username}`} onClick={() => handleSendRequest(r.username)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                        style={{ fontFamily: font, background: 'var(--accent)', color: '#fff' }}>Add</button>
                    </div>
                  ))}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <p className="text-xs text-center py-2" style={{ color: 'var(--text-color)' }}>No users found</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-1 p-1 rounded-xl mb-3" style={{ background: 'var(--light-gray)' }}>
            {[
              { id: 'friends', label: 'Friends', count: friends.length },
              { id: 'leaderboard', label: 'Board' },
              { id: 'requests', label: 'Requests', count: friendRequests.length },
            ].map(tab => (
              <button key={tab.id} data-testid={`social-tab-${tab.id}`}
                onClick={() => setSocialTab(tab.id)}
                className="flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                style={{
                  fontFamily: font,
                  background: socialTab === tab.id ? 'var(--bg)' : 'transparent',
                  color: socialTab === tab.id ? 'var(--accent)' : 'var(--text-color)',
                  boxShadow: socialTab === tab.id ? 'var(--shadow)' : 'none',
                }}>
                {tab.label}
                {tab.count > 0 && (
                  <span className="w-4 h-4 rounded-full text-[8px] flex items-center justify-center"
                    style={{ background: tab.id === 'requests' ? '#ef4444' : 'var(--accent)', color: '#fff' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {socialTab === 'friends' && (
            <div className="space-y-1" style={cardStyle}>
              {friends.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                  No friends yet. Search or share your invite link!
                </p>
              ) : (
                friends.slice(0, 20).map((f, i) => (
                  <div key={f.id} data-testid={`friend-${f.username}`}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none' }}>
                    <img src={f.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                        {f.full_name} <span className="text-[10px]" style={{ color: 'var(--text-color)' }}>@{f.username}</span>
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] flex items-center gap-0.5" style={{ color: '#FF6B35' }}>
                          <Flame size={10} /> {f.current_streak}
                        </span>
                        <span className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                          {f.knowledge_score} pts · {getRankLabel(f.knowledge_score)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {socialTab === 'leaderboard' && leaderboard && (
            <div style={cardStyle}>
              {prevWinner && (
                <div className="px-4 py-3 text-center" style={{ borderBottom: '1px solid var(--light-gray)' }}>
                  <span className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                    Last month's No Cap Legend: <Crown size={10} className="inline" style={{ color: '#FFD60A' }} /> @{prevWinner.username}
                  </span>
                </div>
              )}
              {leaderboard.map((e, i) => (
                <div key={e.id} data-testid={`leaderboard-${e.rank}`}
                  className="flex items-center gap-3 px-4 py-3"
                  style={{ borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none', background: e.is_self ? 'rgba(33,150,243,0.04)' : 'transparent' }}>
                  <span className="w-6 text-center text-sm font-bold"
                    style={{ fontFamily: font, color: e.rank <= 3 ? '#FFD60A' : 'var(--text-color)' }}>{e.rank}</span>
                  <img src={e.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ fontFamily: font, color: 'var(--title-color)' }}>
                      {e.full_name} {e.is_self && <span className="text-[9px]" style={{ color: 'var(--text-color)' }}>(you)</span>}
                    </p>
                    <span className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>{e.rank_label}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ fontFamily: font, color: 'var(--accent)' }}>{e.knowledge_score}</p>
                    <span className="text-[9px] flex items-center gap-0.5 justify-end" style={{ color: '#FF6B35' }}>
                      <Flame size={9} /> {e.current_streak}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {socialTab === 'requests' && (
            <div style={cardStyle}>
              {friendRequests.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ fontFamily: font, color: 'var(--text-color)' }}>
                  No pending requests
                </p>
              ) : (
                friendRequests.map((r, i) => (
                  <div key={r.friendship_id} data-testid={`request-${r.sender.username}`}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none' }}>
                    <img src={r.sender.avatar_url} alt="" className="w-9 h-9 rounded-full" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ fontFamily: font, color: 'var(--title-color)' }}>{r.sender.full_name}</p>
                      <p className="text-[10px]" style={{ fontFamily: font, color: 'var(--text-color)' }}>@{r.sender.username}</p>
                    </div>
                    <div className="flex gap-1.5">
                      <button data-testid={`accept-${r.sender.username}`} onClick={() => handleAcceptRequest(r.friendship_id)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                        style={{ fontFamily: font, background: 'var(--accent)', color: '#fff' }}>Accept</button>
                      <button data-testid={`decline-${r.sender.username}`} onClick={() => handleDeclineRequest(r.friendship_id)}
                        className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase"
                        style={{ fontFamily: font, background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>Decline</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </motion.div>
      </div>

      <BottomNav active="profile" />
      <ProfilePanel open={profilePanelOpen} onClose={() => setProfilePanelOpen(false)} />
    </div>
  );
}
