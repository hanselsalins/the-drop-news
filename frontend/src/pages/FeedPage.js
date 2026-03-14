import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { NewsCard } from '../components/NewsCard';
import { CategoryTabs } from '../components/CategoryTabs';
import { BottomNav } from '../components/BottomNav';
import { StreakBadge } from '../components/StreakBadge';
import { MicroFactCard } from '../components/MicroFactCard';
import { MilestoneBanner } from '../components/MilestoneBanner';
import { ProgressDots } from '../components/ProgressDots';
import { useReadArticles } from '../hooks/useReadArticles';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function FeedPage() {
  const { ageGroup, themeMode, user, token } = useTheme();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [microFacts, setMicroFacts] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0, read_today: false });
  const [activeCategory, setActiveCategory] = useState('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countries, setCountries] = useState([]);

  const isKids = themeMode === 'kids';
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const { milestone, checkMilestone, acknowledgeMilestone, requestPermission, permission } = useNotifications();
  const { readIds, refresh: refreshReadIds } = useReadArticles();

  const userCountryObj = countries.find(c => c.country_name === user?.country);

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
      setArticles(res.data);
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
  useEffect(() => { setLoading(true); fetchArticles(); }, [fetchArticles]);
  useEffect(() => { checkMilestone(); }, [checkMilestone]);

  // Refresh read status when articles change or component regains focus
  useEffect(() => { refreshReadIds(); }, [articles, refreshReadIds]);

  // Check if all today's articles are read → increment streak
  const todayArticleIds = activeCategory === 'today' ? articles.map(a => String(a.id)) : [];
  const allTodayRead = todayArticleIds.length === 5 && todayArticleIds.every(id => readIds.has(id));

  useEffect(() => {
    if (allTodayRead && token) {
      axios.post(`${BACKEND_URL}/api/streak/read`, {}, { headers }).catch(() => {});
      fetchStreak();
    }
  }, [allTodayRead, token]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await axios.post(`${BACKEND_URL}/api/crawl?age_group=${ageGroup || '14-16'}`);
      await new Promise(r => setTimeout(r, 3000));
      await fetchArticles();
      await fetchMicroFacts();
    } catch (e) {}
    setRefreshing(false);
  };

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

  return (
    <div data-testid="feed-page" className="min-h-screen pb-28" style={{ background: '#F8FAFC' }}>
      <MilestoneBanner
        milestone={milestone}
        onDismiss={() => acknowledgeMilestone(milestone?.notification_id)}
        isKids={isKids}
      />

      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 60%, #EC4899 100%)',
          padding: '14px 20px 18px',
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1
              style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: 28,
                fontWeight: 900,
                color: '#FFFFFF',
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              The Drop
            </h1>
            <p
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 12,
                color: 'rgba(255,255,255,0.75)',
                marginTop: 2,
              }}
            >
              {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StreakBadge
              currentStreak={streak.current_streak}
              longestStreak={streak.longest_streak}
              readToday={streak.read_today}
              variant="compact"
            />
            <button
              data-testid="refresh-btn"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 12,
                border: 'none',
              }}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''}
                style={{ color: '#FFFFFF' }} />
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <CategoryTabs categories={categories} activeCategory={activeCategory}
        setActiveCategory={setActiveCategory} />

      {/* Progress dots for Today's Drop */}
      {activeCategory === 'today' && !loading && articles.length > 0 && (
        <ProgressDots articleIds={todayArticleIds} readArticleIds={readIds} />
      )}

      {/* Feed */}
      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin" size={32} style={{ color: '#3B82F6' }} />
          </div>
        ) : feedItems.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-lg" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
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
    </div>
  );
}
