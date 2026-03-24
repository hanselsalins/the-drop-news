import { useState, useEffect, useCallback, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { HeroNewsCard, TodayDropCard, CategoryCard, PostListCard } from '../components/NewsCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { BottomNav } from '../components/BottomNav';
import { MicroFactCard } from '../components/MicroFactCard';
import { ProfileButton } from '../components/ProfileButton';
import { MilestoneBanner } from '../components/MilestoneBanner';
import { ProgressDots } from '../components/ProgressDots';
import { SkeletonCard, HeroSkeletonCard } from '../components/SkeletonCard';
import { SkeletonTabs } from '../components/SkeletonTabs';
import { StreakCelebration } from '../components/StreakCelebration';
import { useReadArticles } from '../hooks/useReadArticles';
import { motion } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function FeedPage() {
  const { ageGroup, user, token, darkMode } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [microFacts, setMicroFacts] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, read_today: false });
  const [activeCategory, setActiveCategory] = useState('today');
  const [loading, setLoading] = useState(true);
  
  const [showCelebration, setShowCelebration] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshSpin, setRefreshSpin] = useState(false);

  // Sticky header state
  const [activeSectionTitle, setActiveSectionTitle] = useState('');
  

  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { milestone, checkMilestone, acknowledgeMilestone, requestPermission, permission } = useNotifications();
  const { readIds, refresh: refreshReadIds } = useReadArticles();

  useEffect(() => {
    if (permission === 'default') {
      const t = setTimeout(() => requestPermission(), 3000);
      return () => clearTimeout(t);
    }
  }, [permission, requestPermission]);

  // IntersectionObserver + scroll listener for sticky header section titles
  useEffect(() => {
    // Small delay to let DOM render section headings
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('[data-section-title]');
      if (headings.length === 0) return;

      const observer = new IntersectionObserver(
        () => {
          // On any intersection change, recalculate which section is active
          const allHeadings = document.querySelectorAll('[data-section-title]');
          let lastHidden = '';
          allHeadings.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.top < 68) {
              lastHidden = el.getAttribute('data-section-title');
            }
          });
          if (window.scrollY < 60) {
            setActiveSectionTitle('');
          } else {
            setActiveSectionTitle(lastHidden);
          }
        },
        {
          root: null,
          threshold: 0,
          rootMargin: '-68px 0px 0px 0px',
        }
      );

      headings.forEach((h) => observer.observe(h));

      const handleScroll = () => {
        if (window.scrollY < 60) {
          setActiveSectionTitle('');
          return;
        }
        const allHeadings = document.querySelectorAll('[data-section-title]');
        let lastHidden = '';
        allHeadings.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.top < 68) {
            lastHidden = el.getAttribute('data-section-title');
          }
        });
        setActiveSectionTitle(lastHidden);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      // Store cleanup refs
      cleanupRef.current = () => {
        observer.disconnect();
        window.removeEventListener('scroll', handleScroll);
      };
    }, 300);

    return () => {
      clearTimeout(timer);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [loading, activeCategory, articles]);

  const cleanupRef = useRef(null);

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

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setRefreshSpin(true);
    setIsRefreshing(true);
    await fetchArticles();
    await fetchMicroFacts();
    setIsRefreshing(false);
    setTimeout(() => setRefreshSpin(false), 600);
  };

  const heroArticle = activeCategory === 'today' && articles.length > 0 ? articles[0] : null;
  const todayDropArticles = activeCategory === 'today' ? articles : [];

  return (
    <div data-testid="feed-page" className="min-h-screen pb-16" style={{ backgroundColor: 'var(--bg)', color: 'var(--title-color)' }}>
      <StreakCelebration streakCount={streak.current_streak} onComplete={() => setShowCelebration(false)} />
      <MilestoneBanner milestone={milestone} onDismiss={() => acknowledgeMilestone(milestone?.notification_id)} />

      {/* ── FIXED HEADER ── */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        zIndex: 100,
        height: 68,
        background: 'var(--header-bg, var(--bg))',
        borderBottom: activeSectionTitle ? '1px solid var(--light-gray)' : '1px solid transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        transition: 'border-color 0.2s ease',
      }}>
        {/* LEFT: Profile avatar */}
        <ProfileButton size={36} bordered />

        {/* CENTRE: Section title */}
        <span style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Rubik, sans-serif',
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--title-color)',
          textAlign: 'center',
          opacity: activeSectionTitle ? 1 : 0,
          transition: 'opacity 0.2s ease',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {activeSectionTitle}
        </span>

        {/* RIGHT: Wordmark */}
        <span style={{
          fontFamily: "'Big Shoulders Display', sans-serif",
          fontWeight: 900,
          fontSize: 22,
          letterSpacing: '0.02em',
        }}>
          <span style={{ color: 'var(--title-color)' }}>THE </span>
          <span style={{ color: '#FF6B00' }}>DROP</span>
        </span>
      </div>

      {/* ── PAGE CONTENT (below fixed header) ── */}
      <div style={{ paddingTop: 68 }}>

        {/* ── BREAKING NEWS hero card ── */}
        <div style={{ padding: '0 15px' }}>
          {activeCategory === 'today' && (
            <div style={{ marginTop: 25 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span
                  data-section-title="Breaking News"
                  style={{ fontFamily: 'var(--font)', fontSize: 28, fontWeight: 600, color: 'var(--title-color)' }}
                >
                  Breaking News
                </span>
              </div>
              {loading ? (
                <HeroSkeletonCard />
              ) : heroArticle ? (
                <HeroNewsCard article={heroArticle} badge="BREAKING" />
              ) : null}
            </div>
          )}
        </div>

        {/* ── CATEGORY TABS ── */}
        <div style={{ padding: '0 15px' }}>
          <div data-section-title="Categories">
            <CategoryTabs />
          </div>
        </div>

        {/* ── PAGE CONTENT ── */}
        <div style={{ padding: '0 15px' }}>

          {/* TODAY'S DROP section — vertical post list */}
          {activeCategory === 'today' && !loading && todayDropArticles.length > 0 && (
            <div style={{ marginTop: 25 }}>
              <div data-section-title="Today's Drop">
                <ProgressDots articleIds={todayArticleIds} readArticleIds={readIds} />
              </div>
              <div>
                {todayDropArticles.map((article, i) => (
                  <PostListCard key={article.id} article={article} isLast={i === todayDropArticles.length - 1} ageGroup={ageGroup} />
                ))}
              </div>
            </div>
          )}

          {/* Category-specific section */}
          {activeCategory !== 'today' && (
            <div style={{ marginTop: 25 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                <span style={{ fontFamily: 'var(--font)', fontSize: 18, fontWeight: 600, color: 'var(--title-color)' }}>
                  {categories.find(c => c.id === activeCategory)?.name || activeCategory}
                </span>
                <span style={{ fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500, color: 'var(--accent)', cursor: 'pointer' }}>
                  See All
                </span>
              </div>
              {loading ? (
                <div className="flex gap-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : (
                <div className="overflow-x-auto" style={{ margin: '0 -15px', padding: '0 15px' }}>
                  <div className="flex gap-3 min-w-max">
                    {articles.map(article => (
                      <CategoryCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Micro facts */}
          {!loading && microFacts.length > 0 && (
            <div className="mt-6" style={{ paddingBottom: 36 }}>
              <MicroFactCard fact={microFacts[0]} />
            </div>
          )}

          {/* Empty state */}
          {!loading && articles.length === 0 && (
            <div className="text-center py-20">
              <p style={{ fontFamily: 'var(--font)', fontSize: 15, color: 'var(--text-color)' }}>
                No articles yet. Tap refresh to load!
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  );
}
