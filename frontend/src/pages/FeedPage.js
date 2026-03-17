import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { NewsCard } from '../components/NewsCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { BottomNav } from '../components/BottomNav';
import { StreakBadge } from '../components/StreakBadge';
import { MicroFactCard } from '../components/MicroFactCard';
import { ProfileButton } from '../components/ProfileButton';
import { ProfilePanel } from '../components/ProfilePanel';
import { MilestoneBanner } from '../components/MilestoneBanner';
import { ProgressDots } from '../components/ProgressDots';
import { MissionHeader } from '../components/MissionHeader';
import { BriefingHeader } from '../components/BriefingHeader';
import { EditorialHeader } from '../components/EditorialHeader';
import { useReadArticles } from '../hooks/useReadArticles';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function FeedPage() {
  const { ageGroup, themeMode, band, user, token } = useTheme();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [microFacts, setMicroFacts] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, read_today: false });
  const [activeCategory, setActiveCategory] = useState('today');
  const [loading, setLoading] = useState(true);
  const [countries, setCountries] = useState([]);
  const [profileOpen, setProfileOpen] = useState(false);

  const isBand1 = band === 'big-bold-bright';
  const isBand2 = band === 'cool-connected';
  const isBand3 = band === 'sharp-aware';
  const isBand4 = band === 'editorial';
  const isKids = isBand1 || isBand2;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { milestone, checkMilestone, acknowledgeMilestone, requestPermission, permission } = useNotifications();
  const { readIds, refresh: refreshReadIds } = useReadArticles();

  useEffect(() => {
    if (permission === 'default') {
      const t = setTimeout(() => requestPermission(), 3000);
      return () => clearTimeout(t);
    }
  }, [permission, requestPermission]);

  const fetchArticles = useCallback(async () => {
    try {
      const isToday = activeCategory === 'today';
      const limit = isToday ? 5 : 3;
      const params = { age_group: ageGroup || '14-16', limit };
      if (!isToday) params.category = activeCategory;
      const res = await axios.get(`${BACKEND_URL}/api/articles`, { params, headers });
      const visible = (Array.isArray(res.data) ? res.data : []).filter(a =>
        a.rewrite || a.original_title || a.original_content
      );
      setArticles(visible);
    } catch (e) {
      console.error('Failed to fetch articles:', e);
    } finally {
      setLoading(false);
    }
  }, [ageGroup, activeCategory, token]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/categories`);
      setCategories(res.data);
    } catch (e) {}
  }, []);

  const fetchMicroFacts = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/micro-facts`, { params: { age_group: ageGroup || '14-16' } });
      setMicroFacts(res.data);
    } catch (e) {}
  }, [ageGroup]);

  const fetchStreak = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${BACKEND_URL}/api/streak`, { headers });
      setStreak(res.data);
    } catch (e) {}
  }, [token]);

  const fetchCountries = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/countries`);
      setCountries(Array.isArray(res.data) ? res.data : []);
    } catch (e) {}
  }, []);

  useEffect(() => { fetchCategories(); fetchCountries(); }, [fetchCategories, fetchCountries]);
  useEffect(() => { fetchStreak(); }, [fetchStreak]);
  useEffect(() => { fetchMicroFacts(); }, [fetchMicroFacts]);
  useEffect(() => { setArticles([]); setMicroFacts([]); setLoading(true); fetchArticles(); }, [fetchArticles]);
  useEffect(() => { checkMilestone(); }, [checkMilestone]);
  useEffect(() => { refreshReadIds(); }, [articles, refreshReadIds]);

  const todayArticleIds = activeCategory === 'today' ? articles.map(a => String(a.id)) : [];
  const allTodayRead = todayArticleIds.length === 5 && todayArticleIds.every(id => readIds.has(id));

  useEffect(() => {
    if (allTodayRead && token) {
      axios.post(`${BACKEND_URL}/api/streak/read`, {}, { headers }).catch(() => {});
      fetchStreak();
    }
  }, [allTodayRead, token]);

  const topCategory = articles.length > 0
    ? (() => {
        const counts = {};
        articles.forEach(a => {
          const cat = (a.category || '').toLowerCase();
          counts[cat] = (counts[cat] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'world';
      })()
    : 'world';

  const buildFeedItems = () => {
    const items = [];
    let factIdx = 0;
    articles.forEach((article, i) => {
      items.push({ type: 'article', data: article });
      if ((i + 1) % 3 === 0 && factIdx < microFacts.length) {
        items.push({ type: 'fact', data: microFacts[factIdx] });
        factIdx++;
      }
    });
    return items;
  };

  const feedItems = buildFeedItems();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Band-specific header gradient
  const headerGradient = isBand1
    ? 'linear-gradient(135deg, #FF4B4B 0%, #FFD93D 100%)'
    : isBand2
    ? 'linear-gradient(135deg, #1E90FF 0%, #00D4AA 100%)'
    : isBand3
    ? 'var(--drop-header-bg)'
    : 'var(--drop-header-bg)';

  // Header font
  const headerFont = isBand1 ? 'Fredoka, cursive'
    : isBand2 ? 'Baloo 2, cursive'
    : isBand3 ? 'Syne, sans-serif'
    : 'Urbanist, sans-serif';

  return (
    <div data-testid="feed-page" className="min-h-screen pb-28" style={{ background: 'var(--drop-bg)' }}>
      <MilestoneBanner
        milestone={milestone}
        onDismiss={() => acknowledgeMilestone(milestone?.notification_id)}
        isKids={isKids}
      />

      {/* ═══ BAND 1: Big Bold Bright header ═══ */}
      {isBand1 && (
        <>
          <div style={{ background: headerGradient, padding: '12px 20px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ fontFamily: headerFont, fontSize: 28, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>
                  The Drop
                </h1>
                <p style={{ fontFamily: 'var(--drop-font-body)', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {today}
                </p>
              </div>
              <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
            </div>
          </div>
          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          {activeCategory === 'today' && !loading && articles.length > 0 && (
            <MissionHeader articles={articles} readArticleIds={readIds} streak={streak} topCategory={topCategory} />
          )}
        </>
      )}

      {/* ═══ BAND 2: Cool & Connected header ═══ */}
      {isBand2 && (
        <>
          <div style={{ background: headerGradient, padding: '12px 20px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ fontFamily: headerFont, fontSize: 26, fontWeight: 700, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>
                  The Drop
                </h1>
                <p style={{ fontFamily: 'var(--drop-font-body)', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>
                  {today}
                </p>
              </div>
              <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
            </div>
          </div>
          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          {activeCategory === 'today' && !loading && articles.length > 0 && (
            <MissionHeader articles={articles} readArticleIds={readIds} streak={streak} topCategory={topCategory} />
          )}
        </>
      )}

      {/* ═══ BAND 3: Sharp & Aware header ═══ */}
      {isBand3 && (
        <>
          <div style={{ background: 'var(--drop-header-bg)', padding: '14px 20px 18px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ fontFamily: headerFont, fontSize: 22, fontWeight: 800, color: 'var(--drop-text)', lineHeight: 1.2, margin: 0, letterSpacing: '-0.04em', textTransform: 'uppercase' }}>
                  The Drop
                </h1>
                <p style={{ fontFamily: 'var(--drop-font-body)', fontSize: 12, color: 'var(--drop-text-muted)', marginTop: 2 }}>
                  {today}
                </p>
              </div>
              <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
            </div>
          </div>
          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
          {activeCategory === 'today' && !loading && articles.length > 0 && (
            <BriefingHeader articles={articles} readArticleIds={readIds} streak={streak} topCategory={topCategory} />
          )}
        </>
      )}

      {/* ═══ BAND 4: Cyber Editorial header ═══ */}
      {isBand4 && (
        <>
          {!loading && articles.length > 0 && activeCategory === 'today' ? (
            <EditorialHeader articles={articles} topCategory={topCategory} onProfileOpen={() => setProfileOpen(true)} />
          ) : (
            <div style={{ background: 'var(--drop-bg)', padding: '14px 20px' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontFamily: 'var(--drop-font-heading)', fontSize: 13, letterSpacing: 1, color: 'var(--drop-text-muted)' }}>the drop</span>
                <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
              </div>
            </div>
          )}
          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        </>
      )}

      {/* ═══ Fallback (no band set) ═══ */}
      {!band && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 60%, #EC4899 100%)', padding: '14px 20px 18px' }}>
            <div className="flex items-center justify-between">
              <div>
                <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: 28, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.2, margin: 0 }}>The Drop</h1>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>{today}</p>
              </div>
              <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
            </div>
          </div>
          <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
        </>
      )}

      {/* Feed */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={32} style={{ color: 'var(--drop-accent, #3B82F6)' }} />
          </div>
        ) : feedItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-lg" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
              No articles yet. Hit refresh to load fresh news!
            </p>
          </motion.div>
        ) : (
          feedItems.map((item, index) => (
            <motion.div
              key={item.type === 'article' ? item.data.id : `fact-${index}`}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: Math.min(index * 0.05, 0.5),
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {item.type === 'article' ? (
                <NewsCard article={item.data} />
              ) : (
                <MicroFactCard fact={item.data} />
              )}
            </motion.div>
          ))
        )}
      </div>

      <BottomNav active="home" />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
