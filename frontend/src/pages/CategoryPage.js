import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { F7Icon } from '../components/F7Icon';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const FONT_STACK = "'Rubik', -apple-system, 'SF Pro Text', system-ui, 'Helvetica Neue', Arial, sans-serif";
const CACHE_MAX_AGE_MS = 30 * 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 60 * 1000;
const PULL_TO_REFRESH_THRESHOLD = 72;
const MAX_PULL_DISTANCE = 108;
const DAY_MS = 24 * 60 * 60 * 1000;
const ARTICLE_DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

const BAND_DESCRIPTIONS = {
  '8-10': {
    'Our World': "Find out what's happening in big places far away",
    'People': 'Stories about real people doing amazing things',
    'Sports': 'Goals, wins, records and the best moments in sport',
  },
  '11-13': {
    World: 'The biggest stories happening across the globe right now',
    'Fair or Not?': 'Who makes the rules — and are they always fair?',
    'Science & Tech': 'From AI to space — stories that make you think',
    Sports: 'Results, records and the stories behind the scores',
  },
  '14-16': {
    World: "Global affairs don't stay global — they affect your future",
    Power: 'Elections, governments and the decisions that shape nations',
    Business: "Companies rise and fall. Here's why it matters to you",
    'Science & Planet': 'Climate, space, wildlife and the science of our world',
    Sports: 'Beyond the scores — sport, politics and performance',
    Tech: 'AI, startups and the technology reshaping every industry',
  },
  '17-20': {
    World: 'International affairs, geopolitics and global change',
    Power: 'Political decisions and the structural forces shaping nations',
    Business: 'Markets, monetary policy and economic forces explained',
    'Science & Tech': 'Research and innovation redefining human capability',
    Sports: 'Performance, strategy, economics and sport as a lens on the world',
    Culture: 'Art, identity and the human stories behind the headlines',
  },
};

function getBandDescription(ageGroup, categoryName) {
  const band = BAND_DESCRIPTIONS[ageGroup] || BAND_DESCRIPTIONS['14-16'];
  return band[categoryName] || '';
}

const CATEGORIES_BY_BAND = {
  '8-10': [
    { id: 'world', name: 'Our World', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=80' },
    { id: 'people', name: 'People', img: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=300&q=80' },
    { id: 'sports', name: 'Sports', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&q=80' },
  ],
  '11-13': [
    { id: 'world', name: 'World', img: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=300&q=80' },
    { id: 'fairornot', name: 'Fair or Not?', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80' },
    { id: 'science', name: 'Science & Tech', img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=300&q=80' },
    { id: 'sports', name: 'Sports', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80' },
  ],
  '14-16': [
    { id: 'world', name: 'World', img: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=300&q=80' },
    { id: 'power', name: 'Power', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80' },
    { id: 'business', name: 'Business', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
    { id: 'science', name: 'Science & Planet', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80' },
    { id: 'sports', name: 'Sports', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&q=80' },
    { id: 'tech', name: 'Tech', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80' },
  ],
  '17-20': [
    { id: 'world', name: 'World', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' },
    { id: 'power', name: 'Power', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80' },
    { id: 'business', name: 'Business', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
    { id: 'science', name: 'Science & Tech', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80' },
    { id: 'sports', name: 'Sports', img: 'https://images.unsplash.com/photo-1504016798967-54a825798c7d?w=300&q=80' },
    { id: 'culture', name: 'Culture', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80' },
  ],
};

function getCategoryInfo(categoryId, ageGroup) {
  const band = CATEGORIES_BY_BAND[ageGroup] || CATEGORIES_BY_BAND['14-16'];
  const cat = band.find((item) => item.id === categoryId);
  if (!cat) return { name: categoryId, img: '' };
  return { name: cat.name, img: cat.img };
}

function getArticleTimestamp(article) {
  const value = article?.crawled_at || article?.created_at || article?.published_at;
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function getArticleRecencyLabel(article) {
  const timestamp = getArticleTimestamp(article);
  if (!timestamp) return article?.time_ago || 'Recently';

  const ageMs = Date.now() - timestamp;
  if (ageMs < DAY_MS) return 'Today';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const articleDay = new Date(timestamp);
  articleDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((today.getTime() - articleDay.getTime()) / DAY_MS);
  if (dayDiff === 1) return 'Yesterday';

  return ARTICLE_DATE_FORMAT.format(new Date(timestamp));
}

function getArticleSourceName(article) {
  return article?.source || article?.source_name || 'The Drop';
}

function SkeletonPostCard() {
  return (
    <div style={{
      display: 'flex',
      padding: '15px 15px 15px 17px',
      borderRadius: 15,
      boxShadow: 'var(--block-shadow)',
      margin: '10px 15px',
      background: 'var(--surface)',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    }}>
      <div style={{ flex: 1, paddingRight: 10 }}>
        <div className="skeleton-shimmer" style={{ width: '40%', height: 14, borderRadius: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '90%', height: 14, borderRadius: 4, marginTop: 8 }} />
        <div className="skeleton-shimmer" style={{ width: '70%', height: 14, borderRadius: 4, marginTop: 4 }} />
        <div className="skeleton-shimmer" style={{ width: '50%', height: 14, borderRadius: 4, marginTop: 12 }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: 84, height: 84, borderRadius: 15, flexShrink: 0 }} />
    </div>
  );
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { ageGroup, countryCode, token } = useTheme();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionTitle, setActiveSectionTitle] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  const cleanupRef = useRef(null);
  const lastFetchAtRef = useRef(0);
  const isFetchingRef = useRef(false);
  const articlesRef = useRef([]);
  const pullStartYRef = useRef(null);
  const pullDistanceRef = useRef(0);

  const catInfo = getCategoryInfo(categoryId, ageGroup);
  const categoryName = location.state?.name || catInfo.name;
  const categoryDesc = getBandDescription(ageGroup, categoryName);

  const fetchArticles = useCallback(async ({ clearBeforeLoad = false, showRefreshing = false } = {}) => {
    if (isFetchingRef.current) return;

    const previousArticles = articlesRef.current;
    isFetchingRef.current = true;

    if (clearBeforeLoad) {
      articlesRef.current = [];
      setArticles([]);
    }

    if (clearBeforeLoad || previousArticles.length === 0) {
      setLoading(true);
    }

    if (showRefreshing) {
      setIsRefreshing(true);
    }

    const requestTimestamp = Date.now();

    try {
      const res = await axios.get(`${BACKEND_URL}/api/articles`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        params: {
          age_group: ageGroup,
          category: categoryId,
          country_code: countryCode,
          sort_by: 'crawled_at',
          sort_order: 'desc',
          _t: requestTimestamp,
        },
      });

      const nextArticles = Array.isArray(res.data) ? res.data : res.data?.articles || [];
      articlesRef.current = nextArticles;
      setArticles(nextArticles);
      lastFetchAtRef.current = requestTimestamp;
    } catch (err) {
      console.error('[CategoryPage] fetch error:', err);
      const fallbackArticles = clearBeforeLoad ? [] : previousArticles;
      articlesRef.current = fallbackArticles;
      setArticles(fallbackArticles);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      pullStartYRef.current = null;
      pullDistanceRef.current = 0;
      setPullDistance(0);
      isFetchingRef.current = false;
    }
  }, [ageGroup, categoryId, countryCode, token]);

  useEffect(() => {
    lastFetchAtRef.current = 0;
    articlesRef.current = [];
    setArticles([]);
    fetchArticles({ clearBeforeLoad: true });
  }, [fetchArticles, location.key]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      lastFetchAtRef.current = 0;
      articlesRef.current = [];
      setArticles([]);
      fetchArticles({ clearBeforeLoad: true });
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [fetchArticles]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!lastFetchAtRef.current || isFetchingRef.current) return;
      if (Date.now() - lastFetchAtRef.current < CACHE_MAX_AGE_MS) return;

      lastFetchAtRef.current = 0;
      articlesRef.current = [];
      setArticles([]);

      if (document.visibilityState === 'visible') {
        fetchArticles({ clearBeforeLoad: true });
      }
    }, STALE_CHECK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchArticles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const headings = document.querySelectorAll('[data-section-title]');
      if (headings.length === 0) return;

      const handleScroll = () => {
        if (window.scrollY < 60) {
          setActiveSectionTitle('');
          return;
        }

        const allHeadings = document.querySelectorAll('[data-section-title]');
        let lastHidden = '';
        allHeadings.forEach((el) => {
          if (el.getBoundingClientRect().top < 50) {
            lastHidden = el.getAttribute('data-section-title');
          }
        });
        setActiveSectionTitle(lastHidden);
      };

      const observer = new IntersectionObserver(() => handleScroll(), {
        root: null,
        threshold: 0,
        rootMargin: '-50px 0px 0px 0px',
      });

      headings.forEach((heading) => observer.observe(heading));
      window.addEventListener('scroll', handleScroll, { passive: true });

      cleanupRef.current = () => {
        observer.disconnect();
        window.removeEventListener('scroll', handleScroll);
      };
    }, 300);

    return () => {
      clearTimeout(timer);
      if (cleanupRef.current) cleanupRef.current();
    };
  }, [loading, articles]);

  const handleTouchStart = useCallback((event) => {
    if (window.scrollY > 0 || loading || isRefreshing || isFetchingRef.current) return;
    pullStartYRef.current = event.touches[0]?.clientY ?? null;
  }, [isRefreshing, loading]);

  const handleTouchMove = useCallback((event) => {
    if (pullStartYRef.current === null || window.scrollY > 0) return;

    const currentY = event.touches[0]?.clientY ?? pullStartYRef.current;
    const nextDistance = Math.max(0, Math.min(currentY - pullStartYRef.current, MAX_PULL_DISTANCE));
    pullDistanceRef.current = nextDistance;
    setPullDistance(nextDistance);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (pullStartYRef.current === null) return;

    const shouldRefresh = pullDistanceRef.current >= PULL_TO_REFRESH_THRESHOLD;
    pullStartYRef.current = null;

    if (shouldRefresh) {
      lastFetchAtRef.current = 0;
      fetchArticles({ showRefreshing: true });
      return;
    }

    pullDistanceRef.current = 0;
    setPullDistance(0);
  }, [fetchArticles]);

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg)' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      <div style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 430,
        zIndex: 100,
        height: 50,
        background: 'var(--header-bg, var(--bg))',
        borderBottom: activeSectionTitle ? '1px solid var(--light-gray)' : '1px solid transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        transition: 'border-color 0.2s ease',
      }}>
        <button
          onClick={() => navigate('/feed')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <F7Icon name="arrow_left" size={22} color="var(--title-color)" />
        </button>

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

      <div style={{ paddingTop: 50, paddingBottom: 68 }}>
        {(pullDistance > 0 || isRefreshing) && (
          <div style={{
            height: Math.max(28, Math.min(pullDistance, 44)),
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '8px 16px 0',
            fontFamily: FONT_STACK,
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-color)',
          }}>
            {isRefreshing
              ? 'Refreshing stories…'
              : pullDistance >= PULL_TO_REFRESH_THRESHOLD
                ? 'Release to refresh'
                : 'Pull to refresh'}
          </div>
        )}

        <h1 data-section-title={categoryName} style={{
          fontFamily: FONT_STACK,
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--title-color)',
          margin: '20px 15px 15px 15px',
        }}>
          {categoryName}
        </h1>

        <div style={{
          width: '100%',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
          margin: 0,
        }}>
          <img
            src={catInfo.img}
            alt={categoryName}
            style={{
              width: '100%',
              aspectRatio: '16/10',
              objectFit: 'cover',
              display: 'block',
              borderRadius: 0,
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '60px 18px 15px 18px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(24,24,24,0.95) 100%)',
          }}>
            <span style={{
              display: 'inline-block',
              background: '#FF6B00',
              color: '#ffffff',
              fontFamily: FONT_STACK,
              fontSize: 13,
              fontWeight: 500,
              padding: '2px 8px',
              borderRadius: 5,
              marginBottom: 10,
            }}>
              {categoryName}
            </span>
            <h2 style={{
              fontFamily: FONT_STACK,
              fontSize: 19,
              fontWeight: 500,
              lineHeight: '24px',
              color: '#ffffff',
              margin: 0,
            }}>
              {categoryDesc}
            </h2>
          </div>
        </div>

        <div data-section-title="Today's Articles" style={{
          fontFamily: FONT_STACK,
          fontSize: 18,
          fontWeight: 600,
          color: 'var(--title-color)',
          margin: '25px 15px 0 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          Today's Articles
        </div>

        {loading ? (
          <>
            <SkeletonPostCard />
            <SkeletonPostCard />
            <SkeletonPostCard />
          </>
        ) : articles.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            fontFamily: FONT_STACK,
            fontSize: 15,
            color: 'var(--text-color)',
          }}>
            No stories today — check back soon
          </div>
        ) : (
          articles.map((article) => (
            <div
              key={article.id || article._id}
              onClick={() => navigate(`/article/${article.id || article._id}`)}
              style={{
                display: 'flex',
                padding: '15px 15px 15px 17px',
                borderRadius: 15,
                boxShadow: 'var(--block-shadow)',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                margin: '10px 15px',
                background: 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: FONT_STACK,
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'var(--text-color)',
                }}>
                  {categoryName}
                </div>
                <div style={{
                  fontFamily: FONT_STACK,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--title-color)',
                  lineHeight: '22px',
                  margin: '2px 0 11px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.title || article.rewrite?.title || article.original_title || 'Untitled'}
                </div>
                <div style={{
                  fontFamily: FONT_STACK,
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'var(--text-color)',
                }}>
                  {getArticleSourceName(article)} · {getArticleRecencyLabel(article)}
                </div>
              </div>

              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  style={{
                    marginLeft: 10,
                    width: 84,
                    height: 84,
                    borderRadius: 15,
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav active="home" />
    </div>
  );
}
