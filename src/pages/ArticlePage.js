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

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="white">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const CopyLinkIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
  </svg>
);

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
