import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ReactionBar } from '../components/ReactionBar';
import { PullQuote } from '../components/PullQuote';
import { CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { F7Icon } from '../components/F7Icon';
import { BottomNav } from '../components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { markArticleRead } from '../hooks/useReadArticles';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const SHARE_OPTIONS = [
  { label: 'Share to WhatsApp', icon: 'bubble_left_fill', getUrl: (t, u) => `https://wa.me/?text=${encodeURIComponent(t + ' ' + u)}` },
  { label: 'Share to Twitter/X', icon: 'at', getUrl: (t, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}` },
  { label: 'Copy Link', icon: 'link', action: 'copy' },
];

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ageGroup, token } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/articles/${id}`, {
          params: { age_group: ageGroup || '14-16' }, headers,
        });
        setArticle(res.data);
      } catch (e) {
        console.error('Failed to fetch article:', e);
      }
      setLoading(false);
    };
    fetchArticle();
  }, [id, ageGroup]);

  useEffect(() => {
    if (!article) return;
    markArticleRead(article.id);
  }, [article]);

  useEffect(() => {
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shareTitle = article?.rewrite?.title || article?.original_title || 'Check this out on The Drop';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShareOption = (option) => {
    if (option.action === 'copy') {
      navigator.clipboard.writeText(shareUrl).then(() => {
        setCopied(true);
        setTimeout(() => { setCopied(false); setMenuOpen(false); }, 1200);
      });
    } else if (option.getUrl) {
      window.open(option.getUrl(shareTitle, shareUrl), '_blank');
      setMenuOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
        <div className="skeleton-shimmer-light" style={{ width: '100%', height: '45vh' }} />
        <div style={{ padding: '24px 15px' }} className="space-y-4">
          <div className="skeleton-shimmer-light" style={{ width: 80, height: 10, borderRadius: 5 }} />
          <div className="skeleton-shimmer-light" style={{ width: '100%', height: 20, borderRadius: 6 }} />
          <div className="skeleton-shimmer-light" style={{ width: '80%', height: 20, borderRadius: 6 }} />
          <div className="skeleton-shimmer-light" style={{ width: 120, height: 10, borderRadius: 5 }} />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer-light" style={{ width: i === 5 ? '60%' : '100%', height: 12, borderRadius: 4 }} />
            ))}
          </div>
        </div>
        <BottomNav active="" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg)' }}>
        <p style={{ color: 'var(--text-color)', fontFamily: 'var(--font)' }}>Article not found.</p>
        <BottomNav active="" />
      </div>
    );
  }

  const rw = article.rewrite;
  const title = rw?.title || article.original_title;
  const body = rw?.body || article.original_content || '';
  const readingTime = rw?.reading_time || '2 min';
  const wonderQuestion = rw?.wonder_question || '';
  const imageUrl = article.image_url;

  const bodyParagraphs = body.split('\n').filter(Boolean);
  let pullQuoteText = null;
  if (bodyParagraphs.length >= 4) {
    const candidates = bodyParagraphs.slice(1, 3).join(' ').split(/[.!?]+/).filter(s => s.trim().length > 30);
    if (candidates.length > 0) {
      pullQuoteText = candidates.sort((a, b) => b.length - a.length)[0].trim();
    }
  }

  return (
    <div data-testid="article-page" className="min-h-screen" style={{ backgroundColor: 'var(--bg)', paddingBottom: 68 }}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ height: 3, background: 'var(--light-gray)' }}>
        <div style={{ width: `${readProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width 0.1s' }} />
      </div>

      {/* Hero image — full bleed, 45vh */}
      <div className="relative w-full" style={{ height: '45vh', background: 'var(--light-gray)' }}>
        {imageUrl ? (
          <img src={imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'var(--light-gray)' }} />
        )}

        {/* Back arrow */}
        <button data-testid="back-btn" aria-label="Go back" onClick={() => navigate(-1)}
          className="absolute cursor-pointer"
          style={{
            top: 16, left: 16, width: 36, height: 36,
            background: 'rgba(0,0,0,0.4)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
          }}>
          <F7Icon name="arrow_left" size={22} color="#FFFFFF" />
        </button>
        {/* Three-dot menu */}
        <button aria-label="More options" onClick={() => setMenuOpen(true)} className="absolute cursor-pointer"
          style={{
            top: 16, right: 16, width: 36, height: 36,
            background: 'rgba(0,0,0,0.4)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none',
          }}>
          <F7Icon name="ellipsis_vertical" size={22} color="#FFFFFF" />
        </button>
      </div>

      {/* Article content — slides up */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { y: 30, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
        style={{
          background: 'var(--bg)', borderRadius: '20px 20px 0 0',
          marginTop: -24, position: 'relative', zIndex: 10, padding: 24,
        }}
      >
        {/* Category badge */}
        <span style={{
          fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
          color: 'var(--title-color)', background: 'var(--light-gray)',
          borderRadius: 6, padding: '4px 10px', display: 'inline-block',
          marginTop: 15,
        }}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>

        {/* Headline */}
        <h1 style={{
          fontFamily: 'var(--font)', fontSize: 28, fontWeight: 600,
          color: 'var(--title-color)', lineHeight: 1.35,
          marginTop: 10, marginBottom: 15,
        }}>
          {title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-5">
          <span style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 400, color: 'var(--text-color)' }}>
            {readingTime} read
          </span>
          <span style={{ color: 'var(--text-color)' }}>·</span>
          <span style={{ fontFamily: 'var(--font)', fontSize: 16, fontWeight: 400, color: 'var(--text-color)' }}>
            posted by {article.source}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-4">
          {bodyParagraphs.map((p, i) => (
            <div key={i}>
              <p style={{
                fontFamily: 'var(--font)', fontSize: 15, fontWeight: 400,
                color: 'var(--text-color)', lineHeight: '1.8em', margin: 0,
              }}>
                {p}
              </p>
              {i === 1 && pullQuoteText && <PullQuote text={pullQuoteText} />}
            </div>
          ))}
        </div>

        {/* Wonder Question */}
        {wonderQuestion && (
          <div data-testid="wonder-question" style={{
            marginTop: 20, paddingLeft: 12, padding: 12,
            borderLeft: '4px solid var(--accent)',
            background: 'rgba(255,107,0,0.06)',
            borderRadius: '0 8px 8px 0',
          }}>
            <p style={{
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
              fontStyle: 'italic', color: 'var(--accent)', margin: 0,
            }}>
              {wonderQuestion}
            </p>
          </div>
        )}

        {/* Reaction Bar */}
        <ReactionBar articleId={article.id} />

        {/* Share */}
        <button data-testid="share-btn" aria-label="Share this story" onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center gap-2 w-full mt-5 cursor-pointer"
          style={{
            fontFamily: 'var(--font)', fontSize: 14, fontWeight: 500,
            height: 44, borderRadius: 10,
            background: 'var(--accent)', color: '#FFFFFF', border: 'none',
          }}>
          <F7Icon name="square_arrow_up" size={16} color="#FFFFFF" />
          Share this story
        </button>

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 mb-4 px-5 py-3"
          style={{
            fontFamily: 'var(--font)', fontSize: 15, fontWeight: 500,
            background: 'var(--light-gray)', borderRadius: 10,
            color: 'var(--text-color)', textDecoration: 'none',
          }}>
          <F7Icon name="arrow_up_right_square" size={16} color="var(--text-color)" />
          Read the original at {article.source} →
        </a>
      </motion.div>

      {/* Bottom Tab Bar */}
      <BottomNav active="" />

      {/* Share Bottom Sheet */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-[60]"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-[70]"
              style={{ background: 'var(--surface)', borderRadius: '20px 20px 0 0', padding: 20 }}
            >
              {/* Drag handle */}
              <div style={{
                width: 40, height: 5, background: 'var(--light-gray)',
                borderRadius: 3, margin: '0 auto 16px',
              }} />
              {SHARE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleShareOption(opt)}
                  className="flex items-center gap-3 w-full cursor-pointer"
                  style={{
                    background: 'none', border: 'none',
                    padding: '14px 0',
                    borderBottom: '1px solid var(--light-gray)',
                  }}
                >
                  <F7Icon name={opt.icon} size={20} color="var(--title-color)" />
                  <span style={{
                    fontFamily: "'Rubik', var(--font)",
                    fontSize: 15, fontWeight: 500,
                    color: 'var(--title-color)',
                  }}>
                    {opt.action === 'copy' && copied ? 'Copied!' : opt.label}
                  </span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
