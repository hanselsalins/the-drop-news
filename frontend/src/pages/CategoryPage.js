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
    'Our World': "Find out what's happening in big places far away — wars, weather, animals and people making news all around the world.",
    'People': "Meet real people doing amazing, brave or surprising things. Every story here is about someone just like you — or very different from you.",
    'Sports': "Goals, wins, records and the best moments in sport. From cricket in Mumbai to football in London — it's all here.",
  },
  '11-13': {
    'World': "The biggest stories happening across the globe right now — from conflicts to discoveries, politics to natural disasters. Stay in the loop.",
    'Fair or Not?': "Governments make rules. Leaders make decisions. But are they always fair? This is where we ask the hard questions about power, rights and justice.",
    'Science & Tech': "From AI to space exploration, climate science to the latest inventions — the stories here will make you think about what's coming next.",
    'Sports': "Results, records and the stories behind the scores. The biggest sporting moments from around the world, every day.",
  },
  '14-16': {
    'World': "Global affairs don't stay global for long — they affect your city, your economy and your future. Here's what's happening and why it matters.",
    'Power': "Elections, governments, wars and the decisions made by people in power. Understanding power is understanding the world.",
    'Business': "Companies rise and fall. Markets move. Economies shift. This is where you start to understand why — and what it means for you.",
    'Science & Planet': "The science of our world — from climate change to deep space, from new species to new cures. Evidence-based, no noise.",
    'Sports': "Beyond the scores — the business of sport, the politics of sport, and the performances that define generations.",
    'Tech': "AI, startups, breakthroughs and the technology reshaping every industry. The future is being built right now.",
  },
  '17-20': {
    'World': "International affairs, geopolitics and the stories driving global change. Read beyond the headline.",
    'Power': "Political decisions, governance failures, elections and the structural forces that shape nations. No spin.",
    'Business': "Markets, monetary policy, corporate strategy and economic forces. The stories behind the numbers.",
    'Science & Tech': "Research, innovation and the technology redefining industries, societies and human capability.",
    'Sports': "Performance, strategy, economics and culture — sport as a lens on the wider world.",
    'Culture': "Art, identity, social movements and the human stories that don't fit anywhere else — but matter most.",
  },
  '20+': {
    'World': "International affairs, geopolitics and the stories driving global change. Read beyond the headline.",
    'Power': "Political decisions, governance failures, elections and the structural forces that shape nations. No spin.",
    'Business': "Markets, monetary policy, corporate strategy and economic forces. The stories behind the numbers.",
    'Science & Tech': "Research, innovation and the technology redefining industries, societies and human capability.",
    'Sports': "Performance, strategy, economics and culture — sport as a lens on the wider world.",
    'Culture': "Art, identity, social movements and the human stories that don't fit anywhere else — but matter most.",
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
  '20+': [
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

function SkeletonArticleCard() {
  return (
    <div style={{
      margin: '0 15px 20px 15px',
      borderRadius: 18,
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      <div className="skeleton-shimmer" style={{ width: '100%', aspectRatio: '16/9' }} />
      <div style={{ padding: 20 }}>
        <div className="skeleton-shimmer" style={{ width: '85%', height: 20, borderRadius: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: 14, borderRadius: 6, marginTop: 10 }} />
        <div className="skeleton-shimmer" style={{ width: '60%', height: 14, borderRadius: 6, marginTop: 6 }} />
        <div className="skeleton-shimmer" style={{ width: '100%', height: 44, borderRadius: 22, marginTop: 15 }} />
      </div>
    </div>
  );
}

export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { ageGroup, token, darkMode } = useTheme();

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
          params: { age_group: ageGroup, category: categoryId },
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
          if (el.getBoundingClientRect().top < 68) {
            lastHidden = el.getAttribute('data-section-title');
          }
        });
        setActiveSectionTitle(lastHidden);
      };

      const observer = new IntersectionObserver(() => handleScroll(), {
        root: null,
        threshold: 0,
        rootMargin: '-68px 0px 0px 0px',
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

  const pageBg = darkMode ? 'var(--bg)' : '#FEFEFF';
  const cardBg = darkMode ? 'var(--surface)' : '#FFFFFF';

  return (
    <div style={{ minHeight: '100vh', background: pageBg }}>
      {/* ── FIXED HEADER (matches home page) ── */}
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
        {/* LEFT: back arrow */}
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

        {/* CENTRE: collapsing section title */}
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

        {/* RIGHT: THE DROP wordmark */}
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
      <div style={{ paddingTop: 68, paddingBottom: 68 }}>

        {/* Hero header */}
        <div data-section-title={categoryName} style={{
          width: '100%',
          height: 180,
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 0,
        }}>
          <img
            src={catInfo.img}
            alt={categoryName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 20,
          }}>
            <span style={{
              display: 'inline-block',
              background: '#FF6B00',
              color: '#ffffff',
              fontFamily: 'Rubik, sans-serif',
              fontSize: 10,
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 4,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}>
              {categoryName}
            </span>
            <div style={{
              fontFamily: "'Big Shoulders Display', sans-serif",
              fontWeight: 900,
              fontSize: 32,
              color: '#ffffff',
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {categoryName}
            </div>
            <div style={{
              fontFamily: 'Rubik, sans-serif',
              fontSize: 12,
              fontWeight: 400,
              color: 'rgba(255,255,255,0.85)',
              lineHeight: 1.4,
            }}>
              {categoryDesc}
            </div>
          </div>
        </div>

        {/* spacing before articles */}
        <div style={{ height: 30 }} />


        {/* ARTICLE LIST */}
        {loading ? (
          <>
            <SkeletonArticleCard />
            <SkeletonArticleCard />
            <SkeletonArticleCard />
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
              style={{
                margin: '0 15px 20px 15px',
                borderRadius: 18,
                overflow: 'hidden',
                background: cardBg,
                boxShadow: 'var(--block-shadow)',
              }}
            >
              {/* Article image */}
              {article.image_url && (
                <img
                  src={article.image_url}
                  alt={article.title}
                  style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              )}
              {/* Big footer */}
              <div style={{
                background: cardBg,
                padding: 20,
              }}>
                <h2 style={{
                  fontFamily: FONT_STACK,
                  fontSize: 20,
                  fontWeight: 600,
                  color: 'var(--title-color)',
                  lineHeight: 1.5,
                  marginBottom: 8,
                  margin: '0 0 8px 0',
                }}>
                  {article.title}
                </h2>
                <p style={{
                  fontFamily: FONT_STACK,
                  fontSize: 15,
                  fontWeight: 400,
                  color: 'var(--text-color)',
                  lineHeight: '1.8em',
                  margin: '0 0 0 0',
                }}>
                  {article.summary || article.description || ''}
                </p>
                <button
                  onClick={() => navigate(`/article/${article.id || article._id}`)}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 22,
                    background: '#FF6B00',
                    color: '#ffffff',
                    fontFamily: FONT_STACK,
                    fontSize: 14,
                    fontWeight: 500,
                    marginTop: 15,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  Read More →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav active="home" />
    </div>
  );
}
