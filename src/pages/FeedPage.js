import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { NewsCard, HeroNewsCard } from '../components/NewsCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { BottomNav } from '../components/BottomNav';
import { MicroFactCard } from '../components/MicroFactCard';
import { ProfileButton } from '../components/ProfileButton';
import { ProfilePanel } from '../components/ProfilePanel';
import { MilestoneBanner } from '../components/MilestoneBanner';
import { ProgressDots } from '../components/ProgressDots';
import { SkeletonCard, HeroSkeletonCard } from '../components/SkeletonCard';
import { SkeletonTabs } from '../components/SkeletonTabs';
import { StreakCelebration } from '../components/StreakCelebration';
import { useReadArticles } from '../hooks/useReadArticles';
import { motion } from 'framer-motion';
import { RefreshCw, Search, Menu } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function FeedPage() {
  const { ageGroup, user, token } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [microFacts, setMicroFacts] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, read_today: false });
  const [activeCategory, setActiveCategory] = useState('today');
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [atTop, setAtTop] = useState(true);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { milestone, checkMilestone, acknowledgeMilestone, requestPermission, permission } = useNotifications();
  const { readIds, refresh: refreshReadIds } = useReadArticles();

  useEffect(() => {
    const handleScroll = () => setAtTop(window.scrollY <= 0);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  useEffect(() => { fetchCategories(); }, [fetchCategories]);
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

  const buildFeedItems = () => {
    const items = [];
    let factIdx = 0;
    // For "today" tab, first 2 articles go to hero carousel, rest to list
    const listArticles = activeCategory === 'today' ? articles.slice(2) : articles;
    listArticles.forEach((article, i) => {
      items.push({ type: 'article', data: article });
      if ((i + 1) % 3 === 0 && factIdx < microFacts.length) {
        items.push({ type: 'fact', data: microFacts[factIdx] });
        factIdx++;
      }
    });
    return items;
  };

  const heroArticles = activeCategory === 'today' ? articles.slice(0, 2) : [];
  const feedItems = buildFeedItems();

  const handlePullRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setPullDistance(0);
    await fetchArticles();
    await fetchMicroFacts();
    setIsRefreshing(false);
  };

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  return (
    <div data-testid="feed-page" className="min-h-screen pb-28" style={{ background: 'var(--bg-dark)' }}>
      <StreakCelebration streakCount={streak.current_streak} onComplete={() => setShowCelebration(false)} />

      <MilestoneBanner
        milestone={milestone}
        onDismiss={() => acknowledgeMilestone(milestone?.notification_id)}
      />

      {/* ── HEADER ── */}
      <div style={{ padding: '16px 16px 0' }}>
        {/* Top row: hamburger | app name | avatar */}
        <div className="flex items-center justify-between mb-4">
          <Menu size={24} style={{ color: 'var(--white)' }} />
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 18,
            fontWeight: 600,
             color: 'var(--white)',
          }}>
            The Drop
          </span>
          <ProfileButton onClick={() => setProfileOpen(true)} size={46} />
        </div>

        {/* Greeting */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          fontWeight: 400,
           color: 'var(--body-light)',
          marginBottom: 4,
        }}>
          {greeting}! {user?.full_name?.split(' ')[0] || ''} 👋
        </p>

        {/* Section title */}
        <h1 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 22,
          fontWeight: 600,
           color: 'var(--white)',
          margin: '0 0 16px 0',
        }}>
          Today's News
        </h1>

        {/* Search bar */}
        <div
          className="flex items-center"
          style={{
            width: '100%',
            height: 46,
            background: 'var(--card-dark)',
            borderRadius: 12,
            padding: '0 14px',
            marginBottom: 8,
          }}
        >
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 400,
             color: 'var(--muted)',
            flex: 1,
          }}>
            Find Breaking News
          </span>
          <Search size={18} style={{ color: 'var(--muted)' }} />
        </div>
      </div>

      {/* ── CATEGORY TABS ── */}
      {loading && categories.length === 0 ? <SkeletonTabs /> : (
        <CategoryTabs categories={categories} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
      )}

      {/* ── HERO CARDS (horizontal scroll) ── */}
      {activeCategory === 'today' && (
        <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="flex gap-3 px-4 py-3 min-w-max">
            {loading ? (
              <>
                <HeroSkeletonCard />
                <HeroSkeletonCard />
              </>
            ) : heroArticles.length > 0 ? (
              heroArticles.map(article => (
                <HeroNewsCard key={article.id} article={article} />
              ))
            ) : null}
          </div>
        </div>
      )}

      {/* ── PROGRESS DOTS ── */}
      {activeCategory === 'today' && !loading && articles.length > 0 && (
        <ProgressDots articleIds={todayArticleIds} readArticleIds={readIds} />
      )}

      {/* Pull-to-refresh indicator */}
      {(pullDistance > 10 || isRefreshing) && (
        <div className="flex items-center justify-center py-2" style={{ height: Math.min(pullDistance * 0.5, 50) }}>
          <RefreshCw
            size={20}
            className={isRefreshing ? 'animate-spin' : ''}
            style={{
              color: 'var(--accent-blue)',
              transform: isRefreshing ? undefined : `rotate(${Math.min(pullDistance * 2, 360)}deg)`,
              transition: isRefreshing ? 'none' : 'transform 0.1s',
            }}
          />
        </div>
      )}

      {/* ── LIST CARDS ── */}
      <div className="px-4 pt-2">
        {/* Section header */}
        {!loading && feedItems.length > 0 && (
          <div className="flex items-center justify-between mb-3">
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: '#FFFFFF',
            }}>
              Latest News
            </span>
            <span style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              fontWeight: 400,
              color: '#D4D4D4',
              cursor: 'pointer',
            }}>
              View All
            </span>
          </div>
        )}

        <motion.div
          className="space-y-2.5"
          drag={atTop && !isRefreshing ? 'y' : false}
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.4}
          onDrag={(e, info) => { if (info.offset.y > 0) setPullDistance(info.offset.y); }}
          onDragEnd={(e, info) => {
            if (info.offset.y > 80) handlePullRefresh();
            else setPullDistance(0);
          }}
          style={{ touchAction: atTop ? 'none' : 'auto' }}
        >
          {loading ? (
            <div className="space-y-2.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : feedItems.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 15,
                fontWeight: 400,
                color: '#828693',
              }}>
                No articles yet. Pull down to refresh!
              </p>
            </motion.div>
          ) : (
            feedItems.map((item, index) => (
              <motion.div
                key={item.type === 'article' ? item.data.id : `fact-${index}`}
                initial={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
                animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
                transition={prefersReducedMotion ? undefined : {
                  delay: Math.min(index * 0.05, 0.4),
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
        </motion.div>
      </div>

      <BottomNav active="home" />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
