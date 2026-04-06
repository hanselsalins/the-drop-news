import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function timeAgo(dateStr) {
  const now = new Date();
  const then = new Date(dateStr);
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function BreakingCard({ article, ageGroup }) {
  const navigate = useNavigate();
  const rewrite = article.age_band_rewrites?.[ageGroup] || article.age_band_rewrites?.['14-16'] || {};
  const title = rewrite.title || article.title || '';
  const source = article.source || '';
  const category = rewrite.category || article.category || '';
  const countryCode = article.country_code || '';
  const published = article.published_at;

  const flag = countryCode
    ? String.fromCodePoint(...[...countryCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
    : '';

  return (
    <div
      onClick={() => navigate(`/article/${article.id}`)}
      style={{
        flex: '0 0 100%',
        scrollSnapAlign: 'start',
        height: 120,
        borderRadius: 14,
        background: 'var(--surface)',
        borderLeft: '3px solid #FF6B00',
        boxShadow: '0 0 0 1px rgba(255,107,0,0.2)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {/* Top row: source + time */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{
          fontFamily: 'Rubik, sans-serif',
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--text-color)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}>
          {source}
        </span>
        <span style={{
          fontFamily: 'Rubik, sans-serif',
          fontSize: 11,
          color: 'var(--text-color)',
        }}>
          {published ? timeAgo(published) : ''}
        </span>
      </div>

      {/* Headline */}
      <p style={{
        fontFamily: 'Rubik, sans-serif',
        fontSize: 15,
        fontWeight: 700,
        color: 'var(--title-color)',
        lineHeight: '20px',
        margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {title}
      </p>

      {/* Bottom: category pill + flag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {category && (
          <span style={{
            fontFamily: 'Rubik, sans-serif',
            fontSize: 10,
            fontWeight: 600,
            color: '#FF6B00',
            background: 'rgba(255,107,0,0.12)',
            padding: '2px 8px',
            borderRadius: 20,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}>
            {category}
          </span>
        )}
        {flag && <span style={{ fontSize: 13 }}>{flag}</span>}
      </div>
    </div>
  );
}

function SkeletonBreakingCard() {
  return (
    <div style={{
      width: '100%',
      height: 120,
      borderRadius: 14,
      background: 'var(--surface)',
      borderLeft: '3px solid rgba(255,107,0,0.3)',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div className="skeleton-shimmer" style={{ width: 60, height: 10, borderRadius: 5 }} />
        <div className="skeleton-shimmer" style={{ width: 40, height: 10, borderRadius: 5 }} />
      </div>
      <div>
        <div className="skeleton-shimmer" style={{ width: '90%', height: 14, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 14, borderRadius: 6, marginTop: 6 }} />
      </div>
      <div className="skeleton-shimmer" style={{ width: 50, height: 16, borderRadius: 10 }} />
    </div>
  );
}

export default function BreakingNewsCarousel() {
  const { ageGroup, token } = useTheme();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef(null);
  const refreshTimer = useRef(null);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchBreaking = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/breaking-news`, {
        params: { age_group: ageGroup || '14-16', country_code: countryCode },
        headers,
      });
      const data = res.data?.articles || res.data || [];
      setArticles(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch (e) {
      console.error('Breaking news fetch error:', e);
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [ageGroup, token]);

  useEffect(() => {
    fetchBreaking();
    refreshTimer.current = setInterval(fetchBreaking, 30 * 60 * 1000);
    return () => clearInterval(refreshTimer.current);
  }, [fetchBreaking]);

  // Track scroll position for dot indicator
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const cardWidth = el.offsetWidth;
      if (cardWidth === 0) return;
      const idx = Math.round(el.scrollLeft / cardWidth);
      setActiveIndex(idx);
    };
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [articles]);

  if (!loading && articles.length === 0) return null;

  return (
    <div style={{ marginTop: 20, marginBottom: 8 }}>
      {/* Section label */}
      <div style={{ padding: '0 16px', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'Rubik, sans-serif',
          fontSize: 11,
          fontWeight: 700,
          color: '#FF6B00',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#FF3B30',
            marginRight: 6,
            animation: 'pulse-dot 1.5s ease-in-out infinite',
            verticalAlign: 'middle',
          }} />
          BREAKING
        </span>
      </div>

      {/* Carousel */}
      {loading ? (
        <div style={{ padding: '0 16px' }}>
          <SkeletonBreakingCard />
        </div>
      ) : (
        <>
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 12,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              padding: '0 16px',
              WebkitOverflowScrolling: 'touch',
            }}
            className="hide-scrollbar"
          >
            {articles.map((article) => (
              <BreakingCard key={article.id} article={article} ageGroup={ageGroup} />
            ))}
          </div>

          {/* Dot indicator */}
          {articles.length > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 5,
              marginTop: 8,
            }}>
              {articles.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i === activeIndex ? 16 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === activeIndex ? '#FF6B00' : 'var(--text-color)',
                    opacity: i === activeIndex ? 1 : 0.3,
                    transition: 'width 0.3s ease, opacity 0.3s ease',
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
