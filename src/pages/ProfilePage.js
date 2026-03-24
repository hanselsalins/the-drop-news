import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { F7Icon } from '../components/F7Icon';
import { AvatarCircle, getSavedAvatarId } from '../components/AvatarCircle';
import { getBankForAge } from '../lib/memojis';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const f = 'Rubik, var(--font), sans-serif';

const AGE_BAND_NAMES = { '8-10': '8–10', '11-13': '11–13', '14-16': '14–16', '17-20': '17–20' };

function getLevel(score) {
  if (score >= 200) return 'Expert';
  if (score >= 100) return 'Scholar';
  if (score >= 50) return 'Analyst';
  if (score >= 25) return 'Thinker';
  if (score >= 10) return 'Explorer';
  return 'Curious';
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, token, ageGroup } = useTheme();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const [stats, setStats] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [socialTab, setSocialTab] = useState('friends');
  const [inviteLink, setInviteLink] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedAvatarId, setSelectedAvatarId] = useState(() => getSavedAvatarId(user?.id));
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Friend search
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios.get(`${BACKEND_URL}/api/profile/stats`, { headers }).then(r => setStats(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends`, { headers }).then(r => setFriends(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends/requests`, { headers }).then(r => setFriendRequests(r.data)).catch(() => {});
    axios.get(`${BACKEND_URL}/api/friends/leaderboard`, { headers }).then(r => { setLeaderboard(r.data.leaderboard); }).catch(() => {});
    axios.get(`${BACKEND_URL}/api/invite/my-link`, { headers }).then(r => { setInviteLink(`${window.location.origin}${r.data.invite_url}`); }).catch(() => {});
  }, [token]);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

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
    try {
      await axios.post(`${BACKEND_URL}/api/friends/accept/${friendshipId}`, {}, { headers });
      setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId));
      const r = await axios.get(`${BACKEND_URL}/api/friends`, { headers });
      setFriends(r.data);
    } catch {}
  };

  const handleDeclineRequest = async (friendshipId) => {
    try { await axios.post(`${BACKEND_URL}/api/friends/decline/${friendshipId}`, {}, { headers }); setFriendRequests(prev => prev.filter(r => r.friendship_id !== friendshipId)); } catch {}
  };

  const avatarSrc = selectedMemojiId ? getMemojiById(selectedMemojiId) : (user?.avatar_url || getMemoji(user?.full_name));
  const initials = (user?.full_name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const knowledgeScore = stats ? stats.knowledge_score?.score || 0 : 0;

  return (
    <div data-testid="profile-page" className="min-h-screen" style={{ backgroundColor: 'var(--bg)', paddingTop: 50, paddingBottom: 68 }}>

      {/* ══════ 1. USER IDENTITY CARD ══════ */}
      <div style={{
        background: 'var(--surface)', borderRadius: 0, padding: '20px 20px 24px 20px',
        marginBottom: 0, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* Avatar */}
          <button onClick={() => setShowMemojiPicker(true)} style={{
            width: 64, height: 64, borderRadius: '50%', overflow: 'hidden',
            border: '3px solid #FF6B00', flexShrink: 0, padding: 0,
            background: avatarSrc ? 'var(--light-gray)' : '#FF6B00', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontFamily: f, fontSize: 24, fontWeight: 600, color: '#fff' }}>{initials}</span>
            )}
          </button>

          {/* Name + username + badge */}
          <div style={{ marginLeft: 16, flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: f, fontSize: 18, fontWeight: 600, color: 'var(--title-color)', margin: 0 }}>
              {user?.full_name || 'Reader'}
            </p>
            <p style={{ fontFamily: f, fontSize: 13, fontWeight: 400, color: 'var(--text-color)', margin: '2px 0 0' }}>
              @{user?.username || 'user'}
            </p>
            <span style={{
              display: 'inline-block', background: 'var(--light-gray)', color: 'var(--text-color)',
              fontFamily: f, fontSize: 11, fontWeight: 600, padding: '2px 8px',
              borderRadius: 4, marginTop: 6,
            }}>
              {AGE_BAND_NAMES[ageGroup] || ageGroup || '—'}
            </span>
          </div>
        </div>

        {/* Edit button */}
        <button
          onClick={() => navigate('/settings')}
          style={{
            position: 'absolute', top: 20, right: 20,
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
          }}
        >
          <F7Icon name="pencil" size={18} color="#FF6B00" />
        </button>
      </div>

      {/* ══════ 2. KNOWLEDGE SCORE CARD ══════ */}
      <div style={{
        background: 'linear-gradient(135deg, #4C35E8, #7B5FFF)',
        borderRadius: 18, margin: '16px 15px 0', padding: '24px 20px', textAlign: 'center',
      }}>
        <p style={{
          fontFamily: f, fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)',
          letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
        }}>KNOWLEDGE SCORE</p>
        <p style={{ fontFamily: f, fontSize: 52, fontWeight: 700, color: '#ffffff', margin: '8px 0' }}>
          {knowledgeScore}
        </p>
        <p style={{
          fontFamily: f, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
          textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0,
        }}>{getLevel(knowledgeScore)}</p>
      </div>

      {/* ══════ 3. STATS GRID 2×2 ══════ */}
      {stats && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10,
          margin: '12px 15px 0',
        }}>
          {/* Streak */}
          <div style={{
            background: 'var(--surface)', borderRadius: 14, padding: 16,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <F7Icon name="flame_fill" size={22} color="#FF6B00" style={{ marginBottom: 6 }} />
            <p style={{ fontFamily: f, fontSize: 28, fontWeight: 700, color: 'var(--title-color)', margin: 0 }}>
              {stats.streak?.current || 0}
            </p>
            <p style={{ fontFamily: f, fontSize: 11, fontWeight: 600, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
              DAY STREAK
            </p>
            <p style={{ fontFamily: f, fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 2 }}>
              Best: {stats.streak?.longest || 0}
            </p>
          </div>

          {/* Stories Read */}
          <div style={{
            background: 'var(--surface)', borderRadius: 14, padding: 16,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <F7Icon name="book_fill" size={22} color="#FF6B00" style={{ marginBottom: 6 }} />
            <p style={{ fontFamily: f, fontSize: 28, fontWeight: 700, color: 'var(--title-color)', margin: 0 }}>
              {stats.stories_read?.total || 0}
            </p>
            <p style={{ fontFamily: f, fontSize: 11, fontWeight: 600, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
              STORIES READ
            </p>
            <p style={{ fontFamily: f, fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 2 }}>
              Week: {stats.stories_read?.this_week || 0}
            </p>
          </div>

          {/* Top Topic */}
          <div style={{
            background: 'var(--surface)', borderRadius: 14, padding: 16,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <F7Icon name="rosette" size={22} color="#FF6B00" style={{ marginBottom: 6 }} />
            <p className="capitalize" style={{ fontFamily: f, fontSize: 15, fontWeight: 600, color: 'var(--title-color)', margin: 0 }}>
              {stats.favourite_category || '—'}
            </p>
            <p style={{ fontFamily: f, fontSize: 11, fontWeight: 600, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
              TOP TOPIC
            </p>
          </div>

          {/* Reactions */}
          <div style={{
            background: 'var(--surface)', borderRadius: 14, padding: 16,
            textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}>
            <F7Icon name="hand_thumbsup_fill" size={22} color="#FF6B00" style={{ marginBottom: 6 }} />
            <p style={{ fontFamily: f, fontSize: 28, fontWeight: 700, color: 'var(--title-color)', margin: 0 }}>
              {stats.reactions?.total || 0}
            </p>
            <p style={{ fontFamily: f, fontSize: 11, fontWeight: 600, color: 'var(--text-color)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
              REACTIONS
            </p>
            <p style={{ fontFamily: f, fontSize: 12, fontWeight: 400, color: 'var(--text-color)', marginTop: 2 }}>
              {stats.reactions?.most_used || '—'}
            </p>
          </div>
        </div>
      )}

      {/* ══════ 4. COUNTRIES STRIP ══════ */}
      {stats && (
        <div style={{
          background: 'var(--surface)', borderRadius: 14, margin: '12px 15px 0',
          padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <F7Icon name="globe" size={22} color="#FF6B00" />
          <div>
            <p style={{ fontFamily: f, fontSize: 15, fontWeight: 600, color: 'var(--title-color)', margin: 0 }}>
              {stats.countries_covered || 0} countries
            </p>
            <p style={{
              fontFamily: f, fontSize: 11, fontWeight: 500, color: 'var(--text-color)',
              textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
            }}>IN YOUR FEED THIS WEEK</p>
          </div>
        </div>
      )}

      {/* ══════ 5. FRIENDS SECTION ══════ */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 20px 8px',
      }}>
        <p style={{
          fontFamily: f, fontSize: 13, fontWeight: 600, color: 'var(--text-color)',
          textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0,
        }}>Friends</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleCopyInvite} className="cursor-pointer" style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'rgba(255,107,0,0.1)', color: '#FF6B00', borderRadius: 10,
            padding: '6px 14px', fontFamily: f, fontSize: 13, fontWeight: 600, border: 'none',
          }}>
            <F7Icon name="link" size={14} color="#FF6B00" />
            {copiedLink ? 'Copied!' : 'Invite'}
          </button>
          <button onClick={() => setShowAddFriend(!showAddFriend)} className="cursor-pointer" style={{
            background: 'rgba(255,107,0,0.1)', borderRadius: 10,
            padding: '6px 10px', border: 'none',
          }}>
            {showAddFriend
              ? <F7Icon name="xmark" size={14} color="#FF6B00" />
              : <F7Icon name="person_badge_plus" size={14} color="#FF6B00" />}
          </button>
        </div>
      </div>

      {/* Add friend search */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', margin: '0 15px 8px' }}>
            <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 14 }}>
              <div className="relative" style={{ marginBottom: 10 }}>
                <F7Icon name="search" size={14} color="var(--text-color)" className="absolute left-3 top-1/2 -translate-y-1/2" />
                <input placeholder="Find @username" value={searchQuery}
                  onChange={e => handleSearchFriends(e.target.value)}
                  className="w-full outline-none"
                  style={{
                    fontFamily: f, fontSize: 14, paddingLeft: 36, paddingRight: 14,
                    height: 40, background: 'var(--bg)', borderRadius: 10, border: 'none',
                    color: 'var(--title-color)',
                  }} />
              </div>
              {searching && <p style={{ fontFamily: f, fontSize: 12, color: 'var(--text-color)', textAlign: 'center', padding: 8 }}>Searching...</p>}
              {searchResults.map(r => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderTop: '1px solid var(--light-gray)',
                }}>
                  <img src={r.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontFamily: f, fontSize: 14, fontWeight: 500, color: 'var(--title-color)', margin: 0 }}>{r.full_name}</p>
                    <p style={{ fontFamily: f, fontSize: 11, color: 'var(--text-color)', margin: 0 }}>@{r.username} · {r.knowledge_score} pts</p>
                  </div>
                  <button onClick={() => handleSendRequest(r.username)} className="cursor-pointer"
                    style={{ fontFamily: f, fontSize: 12, fontWeight: 600, background: '#FF6B00', color: '#fff', borderRadius: 10, padding: '6px 14px', border: 'none', textTransform: 'uppercase' }}>Add</button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab switcher */}
      <div style={{
        display: 'flex', background: 'var(--light-gray)', borderRadius: 10,
        margin: '0 15px 12px', padding: 2,
      }}>
        {[
          { id: 'friends', label: 'Friends', count: friends.length },
          { id: 'leaderboard', label: 'Board' },
          { id: 'requests', label: 'Requests', count: friendRequests.length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setSocialTab(tab.id)} className="cursor-pointer"
            style={{
              flex: 1, padding: 8, textAlign: 'center', borderRadius: 8, border: 'none',
              fontFamily: f, fontSize: 14,
              fontWeight: socialTab === tab.id ? 600 : 400,
              background: socialTab === tab.id ? 'var(--surface)' : 'transparent',
              color: socialTab === tab.id ? 'var(--title-color)' : 'var(--text-color)',
              boxShadow: socialTab === tab.id ? 'var(--block-shadow)' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            }}>
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                width: 16, height: 16, borderRadius: '50%', fontSize: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: tab.id === 'requests' ? '#FF3B30' : '#FF6B00', color: '#fff',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ margin: '0 15px', background: 'var(--surface)', borderRadius: 14, overflow: 'hidden' }}>
        {/* Friends */}
        {socialTab === 'friends' && (
          friends.length === 0 ? (
            <p style={{ fontFamily: f, fontSize: 14, fontWeight: 400, color: 'var(--text-color)', textAlign: 'center', padding: 24 }}>No friends yet</p>
          ) : friends.slice(0, 20).map((fr, i) => (
            <div key={fr.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none',
            }}>
              <img src={fr.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: f, fontSize: 14, fontWeight: 500, color: 'var(--title-color)', margin: 0 }}>{fr.full_name}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: '#FF6B00', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <F7Icon name="flame_fill" size={10} color="#FF6B00" /> {fr.current_streak}
                  </span>
                  <span style={{ fontFamily: f, fontSize: 11, color: 'var(--text-color)' }}>{fr.knowledge_score} pts</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Leaderboard */}
        {socialTab === 'leaderboard' && leaderboard && (
          leaderboard.map((e, i) => (
            <div key={e.id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none',
              background: e.is_self ? 'rgba(255,107,0,0.04)' : 'transparent',
            }}>
              <span style={{ fontFamily: f, fontSize: 14, fontWeight: 700, color: e.rank <= 3 ? '#FFD60A' : 'var(--text-color)', width: 24, textAlign: 'center' }}>{e.rank}</span>
              <img src={e.avatar_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: f, fontSize: 14, fontWeight: 500, color: 'var(--title-color)', margin: 0 }}>{e.full_name}</p>
              </div>
              <p style={{ fontFamily: f, fontSize: 14, fontWeight: 500, color: '#FF6B00', margin: 0 }}>{e.knowledge_score}</p>
            </div>
          ))
        )}

        {/* Requests */}
        {socialTab === 'requests' && (
          friendRequests.length === 0 ? (
            <p style={{ fontFamily: f, fontSize: 14, fontWeight: 400, color: 'var(--text-color)', textAlign: 'center', padding: 24 }}>No pending requests</p>
          ) : friendRequests.map((r, i) => (
            <div key={r.friendship_id} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
              borderTop: i > 0 ? '1px solid var(--light-gray)' : 'none',
            }}>
              <img src={r.sender.avatar_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: f, fontSize: 14, fontWeight: 500, color: 'var(--title-color)', margin: 0 }}>{r.sender.full_name}</p>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => handleAcceptRequest(r.friendship_id)} className="cursor-pointer"
                  style={{ fontFamily: f, fontSize: 10, fontWeight: 700, background: '#FF6B00', color: '#fff', borderRadius: 10, padding: '6px 12px', border: 'none', textTransform: 'uppercase' }}>Accept</button>
                <button onClick={() => handleDeclineRequest(r.friendship_id)} className="cursor-pointer"
                  style={{ fontFamily: f, fontSize: 10, fontWeight: 700, background: 'rgba(255,59,48,0.1)', color: '#FF3B30', borderRadius: 10, padding: '6px 12px', border: 'none', textTransform: 'uppercase' }}>Decline</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ height: 20 }} />

      <BottomNav active="profile" />

      {/* Memoji Picker */}
      {showMemojiPicker && (
        <MemojiPicker
          currentId={selectedMemojiId}
          onSelect={(id) => {
            setSelectedMemojiId(id);
            localStorage.setItem(`memoji_${user?.id || 'default'}`, id);
            setShowMemojiPicker(false);
          }}
          onClose={() => setShowMemojiPicker(false)}
        />
      )}
    </div>
  );
}
