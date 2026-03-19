import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { ReactionBar } from '../components/ReactionBar';
import { ProfileButton } from '../components/ProfileButton';
import { ProfilePanel } from '../components/ProfilePanel';
import { PullQuote } from '../components/PullQuote';
import { getCategoryColor, CATEGORY_EMOJI, CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, Share2, Clock } from 'lucide-react';
import axios from 'axios';
import { markArticleRead } from '../hooks/useReadArticles';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ageGroup, band, token } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

  const isDark = band === 'sharp-aware' || band === 'editorial';
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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareTitle = article?.rewrite?.title || article?.original_title || 'Check this out on The Drop';
    if (navigator.share) {
      try { await navigator.share({ title: shareTitle, url: shareUrl }); return; } catch (e) {}
    }
    try { await navigator.clipboard.writeText(shareUrl); } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--drop-bg)' }}>
        <div className="w-full flex items-center justify-center" style={{ minHeight: 200, background: 'var(--drop-surface)' }}>
          <div className="skeleton-shimmer" style={{ width: 80, height: 80, borderRadius: '50%' }} />
        </div>
        <div className="px-5 pt-5 space-y-4">
          <div className="skeleton-shimmer" style={{ width: 80, height: 10, borderRadius: 5 }} />
          <div className="skeleton-shimmer" style={{ width: '100%', height: 24, borderRadius: 6 }} />
          <div className="skeleton-shimmer" style={{ width: '80%', height: 24, borderRadius: 6 }} />
          <div className="skeleton-shimmer" style={{ width: 120, height: 10, borderRadius: 5 }} />
          <div className="space-y-3 mt-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer" style={{ width: i === 5 ? '60%' : '100%', height: 12, borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--drop-bg)' }}>
        <p style={{ color: 'var(--drop-text-muted)', fontFamily: 'var(--drop-font-body)' }}>Article not found.</p>
      </div>
    );
  }

  const rw = article.rewrite;
  const title = rw?.title || article.original_title;
  const body = rw?.body || article.original_content || '';
  const summary = rw?.summary || '';
  const readingTime = rw?.reading_time || '2 min';
  const wonderQuestion = rw?.wonder_question || '';
  const catColor = getCategoryColor(article.category, band);
  const emoji = CATEGORY_EMOJI[article.category] || '📰';

  const bodyParagraphs = body.split('\n').filter(Boolean);
  let pullQuoteText = null;
  if (band === 'editorial' && bodyParagraphs.length >= 4) {
    const candidates = bodyParagraphs.slice(1, 3).join(' ').split(/[.!?]+/).filter(s => s.trim().length > 30);
    if (candidates.length > 0) {
      pullQuoteText = candidates.sort((a, b) => b.length - a.length)[0].trim();
    }
  }

  return (
    <div data-testid="article-page" className="min-h-screen pb-28" style={{ background: 'var(--drop-bg)' }}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ height: band === 'big-bold-bright' ? 6 : 2, background: 'color-mix(in srgb, var(--drop-primary) 10%, transparent)' }}>
        <div style={{
          width: `${readProgress}%`,
          height: '100%',
          background: 'var(--drop-primary)',
          borderRadius: (band === 'big-bold-bright' || band === 'cool-connected') ? '0 4px 4px 0' : 0,
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Hero area */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          background: `color-mix(in srgb, ${catColor} 15%, var(--drop-bg))`,
          minHeight: 200,
        }}
      >
        {band !== 'sharp-aware' && <span aria-hidden="true" style={{ fontSize: 80 }}>{emoji}</span>}
        {band === 'sharp-aware' && (
          <div style={{ width: 60, height: 3, background: catColor, borderRadius: 2 }} />
        )}

        <button data-testid="back-btn" aria-label="Go back" onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2.5 z-10"
          style={{
            background: 'var(--drop-surface)',
            borderRadius: 'var(--drop-radius-card)',
            border: '1px solid var(--drop-border)',
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <ChevronLeft size={22} style={{ color: 'var(--drop-text)' }} />
        </button>
        <div className="absolute top-4 right-4 z-10">
          <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
        </div>
      </div>

      {/* Content */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { y: 20, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
        className="px-5 pt-5"
      >
        {/* Category */}
        <div className="flex items-center gap-1.5 mb-3">
          {band !== 'sharp-aware' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: catColor, display: 'inline-block' }} />
          )}
          <span className="text-[11px] font-bold tracking-wider uppercase"
            style={{
              fontFamily: band === 'sharp-aware' ? 'var(--drop-font-heading)' : 'var(--drop-font-body)',
              color: catColor,
              letterSpacing: band === 'sharp-aware' ? '0.08em' : undefined,
            }}>
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-bold tracking-tight leading-tight mb-3"
          style={{
            fontFamily: 'var(--drop-font-heading)',
            color: 'var(--drop-text)',
            letterSpacing: 'var(--drop-letter-space-heading, normal)',
            fontWeight: band === 'editorial' ? 800 : 700,
          }}>
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm" style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text-muted)' }}>
            {article.source}
          </span>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--drop-text-muted)' }}>
            <Clock size={14} />
            <span style={{ fontFamily: 'var(--drop-font-body)' }}>
              {band === 'big-bold-bright' ? `⏱ ${readingTime}` : `${readingTime} read`}
            </span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="p-4 mb-5" style={{
            background: 'var(--drop-surface)',
            border: '1px solid var(--drop-border)',
            borderRadius: 'var(--drop-radius-card)',
          }}>
            <p className="text-sm font-medium leading-relaxed"
              style={{ fontFamily: 'var(--drop-font-body)', color: 'var(--drop-text)' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className={`space-y-4 ${band === 'editorial' ? 'article-body' : ''}`}
          style={{
            fontFamily: 'var(--drop-font-body)',
            color: band === 'editorial' ? 'var(--drop-text-body, var(--drop-text))' : 'var(--drop-text)',
            fontSize: 'var(--drop-text-body, 1rem)',
            lineHeight: 'var(--drop-line-height, 1.75)',
          }}>
          {bodyParagraphs.map((p, i) => (
            <div key={i}>
              <p>{p}</p>
              {i === 1 && pullQuoteText && <PullQuote text={pullQuoteText} />}
            </div>
          ))}
        </div>

        {/* Wonder Question */}
        {wonderQuestion && (
          <div data-testid="wonder-question" className="mt-8 p-5" style={{
            background: band === 'big-bold-bright' ? 'var(--drop-accent, #A259FF)' : 'var(--drop-surface)',
            border: band === 'big-bold-bright' ? 'none' : '1px solid var(--drop-border)',
            borderRadius: 'var(--drop-radius-card)',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl" aria-hidden="true">❓</span>
              <p className="text-xs font-bold tracking-wider uppercase"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  color: band === 'big-bold-bright' ? 'rgba(255,255,255,0.7)' : 'var(--drop-primary)',
                }}>
                Wonder Question
              </p>
            </div>
            <p className="text-base font-semibold leading-relaxed"
              style={{
                fontFamily: 'var(--drop-font-body)',
                color: band === 'big-bold-bright' ? '#FFFFFF' : 'var(--drop-text)',
              }}>
              {wonderQuestion}
            </p>
          </div>
        )}

        {/* Reaction Bar */}
        <ReactionBar articleId={article.id} />

        {/* Share Buttons */}
        <button
          data-testid="share-btn"
          aria-label="Share this story"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full mt-5 py-3 text-sm font-bold transition-all duration-200"
          style={{
            fontFamily: 'var(--drop-font-body)',
            background: 'color-mix(in srgb, var(--drop-primary) 10%, transparent)',
            color: 'var(--drop-primary)',
            border: '1px solid var(--drop-border)',
            borderRadius: 'var(--drop-radius-btn)',
          }}
        >
          <Share2 size={16} />
          Share this story
        </button>

        <button
          onClick={() => {
            const shareUrl = window.location.href;
            const shareTitle = article.rewrite?.title || article.original_title;
            window.open(`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`, '_blank');
          }}
          className="flex items-center justify-center gap-2 w-full mt-2 py-3 text-sm font-bold transition-all duration-200"
          style={{
            fontFamily: 'var(--drop-font-body)',
            background: '#25D366',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--drop-radius-btn)',
          }}
        >
          Share on WhatsApp
        </button>

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 mb-4 px-5 py-3 text-sm font-medium transition-all duration-200"
          style={{
            fontFamily: 'var(--drop-font-body)',
            background: 'var(--drop-surface)',
            border: '1px solid var(--drop-border)',
            borderRadius: 'var(--drop-radius-card)',
            color: 'var(--drop-text-muted)',
          }}>
          <ExternalLink size={16} />
          Read the original at {article.source} →
        </a>
      </motion.div>

      <BottomNav active="home" />
      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
