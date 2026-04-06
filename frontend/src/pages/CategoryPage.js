import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { F7Icon } from '../components/F7Icon';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const FONT_STACK = "'Rubik', -apple-system, 'SF Pro Text', system-ui, 'Helvetica Neue', Arial, sans-serif";

const BAND_DESCRIPTIONS = {
  '8-10': {
    'Our World': "Find out what's happening in big places far away",
    'People': "Stories about real people doing amazing things",
    'Sports': "Goals, wins, records and the best moments in sport",
  },
  '11-13': {
    'World': "The biggest stories happening across the globe right now",
    'Fair or Not?': "Who makes the rules — and are they always fair?",
    'Science & Tech': "From AI to space — stories that make you think",
    'Sports': "Results, records and the stories behind the scores",
  },
  '14-16': {
    'World': "Global affairs don't stay global — they affect your future",
    'Power': "Elections, governments and the decisions that shape nations",
    'Business': "Companies rise and fall. Here's why it matters to you",
    'Science & Planet': "Climate, space, wildlife and the science of our world",
    'Sports': "Beyond the scores — sport, politics and performance",
    'Tech': "AI, startups and the technology reshaping every industry",
  },
  '17-20': {
    'World': "International affairs, geopolitics and global change",
    'Power': "Political decisions and the structural forces shaping nations",
    'Business': "Markets, monetary policy and economic forces explained",
    'Science & Tech': "Research and innovation redefining human capability",
    'Sports': "Performance, strategy, economics and sport as a lens on the world",
    'Culture': "Art, identity and the human stories behind the headlines",
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
  const cat = band.find(c => c.id === categoryId);
  if (!cat) return { name: categoryId, img: '' };
  return { name: cat.name, img: cat.img };
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
  const { ageGroup, countryCode, token, darkMode } = useTheme();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSectionTitle, setActiveSectionTitle] = useState('');
  const cleanupRef = useRef(null);

  const catInfo = getCategoryInfo(categoryId, ageGroup);
  const categoryName = location.state?.name || catInfo.name;
  const categoryDesc = getBandDescription(ageGroup, categoryName);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${BACKEND_URL}/api/articles`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { age_group: ageGroup, category: categoryId, country_code: countryCode },
        });
        setArticles(Array.isArray(res.data) ? res.data : res.data?.articles || []);
      } catch (err) {
        console.error('[CategoryPage] fetch error:', err);
        setArticles([]);
      }
      setLoading(false);
    };
    fetchArticles();
  }, [categoryId, ageGroup, token]);

  // Sticky header collapsing title observer
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

      headings.forEach((h) => observer.observe(h));
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* ── FIXED HEADER ── */}
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

      {/* ── PAGE CONTENT ── */}
      <div style={{ paddingTop: 50, paddingBottom: 68 }}>

        {/* Category title — Yui h1 */}
        <h1 data-section-title={categoryName} style={{
          fontFamily: FONT_STACK,
          fontSize: 28,
          fontWeight: 600,
          color: 'var(--title-color)',
          margin: '20px 15px 15px 15px',
        }}>
          {categoryName}
        </h1>

        {/* Hero image — full bleed */}
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
          {/* Gradient overlay — Yui .card-image-footer */}
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            padding: '60px 18px 15px 18px',
            background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(24,24,24,0.95) 100%)',
          }}>
            {/* Category badge */}
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
            {/* Description */}
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

        {/* "Today's Articles" section header */}
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

        {/* ARTICLE LIST — Yui .post-horizontal */}
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
              {/* Text column */}
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
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--title-color)',
                  lineHeight: '22px',
                  margin: '2px 0 11px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {article.title}
                </div>
                <div style={{
                  fontFamily: FONT_STACK,
                  fontSize: 14,
                  fontWeight: 400,
                  color: 'var(--text-color)',
                }}>
                  {article.source || 'The Drop'} · {article.time_ago || 'Today'}
                </div>
              </div>

              {/* Thumbnail */}
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
