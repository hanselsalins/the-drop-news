import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { ReactionBar } from '../components/ReactionBar';
import { ProfileButton } from '../components/ProfileButton';
import { ProfilePanel } from '../components/ProfilePanel';
import { getCategoryColor, CATEGORY_EMOJI, CATEGORY_LABELS } from '../lib/bandUtils';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, Share2, Clock } from 'lucide-react';
import axios from 'axios';
import { markArticleRead } from '../hooks/useReadArticles';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ageGroup, band, token } = useTheme();
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

  // Reading progress bar for band 4
  useEffect(() => {
    if (band !== 'editorial') return;
    const handleScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [band]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.rewrite?.title || article.original_title,
          url: window.location.href,
        });
      } catch (e) {}
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--drop-bg)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--drop-accent, #3B82F6)', borderTopColor: 'transparent' }} />
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

  return (
    <div data-testid="article-page" className="min-h-screen pb-28" style={{ background: 'var(--drop-bg)' }}>
      {/* Reading progress bar — band 4 only */}
      {band === 'editorial' && (
        <div className="fixed top-0 left-0 right-0 z-50" style={{ height: 2, background: 'rgba(0,212,255,0.1)' }}>
          <div style={{ width: `${readProgress}%`, height: '100%', background: '#00D4FF', transition: 'width 0.1s' }} />
        </div>
      )}

      {/* Hero area */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${catColor}22, ${catColor}44)`
            : `linear-gradient(135deg, ${catColor}22, ${catColor}44)`,
          minHeight: 200,
        }}
      >
        {/* No emoji for band 3 */}
        {band !== 'sharp-aware' && <span style={{ fontSize: 80 }}>{emoji}</span>}
        {band === 'sharp-aware' && (
          <div style={{ width: 60, height: 3, background: catColor, borderRadius: 2 }} />
        )}

        <button data-testid="back-btn" onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2.5 z-10"
          style={{
            background: 'var(--drop-surface)',
            borderRadius: 'var(--drop-radius-card, 14px)',
            border: `1px solid var(--drop-border)`,
            boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <ChevronLeft size={22} style={{ color: 'var(--drop-text)' }} />
        </button>
        <div className="absolute top-4 right-4 z-10">
          <ProfileButton onClick={() => setProfileOpen(true)} size={34} />
        </div>
      </div>

      {/* Content */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="px-5 pt-5">

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
            background: isDark ? 'var(--drop-surface)' : `${catColor}08`,
            border: `1px solid var(--drop-border)`,
            borderRadius: 'var(--drop-radius-card, 18px)',
          }}>
            <p className="text-sm font-medium leading-relaxed"
              style={{ fontFamily: 'var(--drop-font-body)', color: isDark ? 'var(--drop-text)' : '#334155' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="space-y-4"
          style={{
            fontFamily: 'var(--drop-font-body)',
            color: band === 'editorial' ? 'var(--drop-text-body, #B0BEC5)' : 'var(--drop-text)',
            fontSize: band === 'big-bold-bright' ? '1.25rem' : 'var(--drop-text-body, 1rem)',
            lineHeight: 'var(--drop-line-height, 1.75)',
          }}>
          {body.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Wonder Question — band 1 gets special purple box */}
        {wonderQuestion && (
          <div data-testid="wonder-question" className="mt-8 p-5" style={{
            background: band === 'big-bold-bright' ? '#A259FF' : isDark ? 'var(--drop-surface)' : `${catColor}08`,
            border: band === 'big-bold-bright' ? 'none' : `1px solid var(--drop-border)`,
            borderRadius: band === 'big-bold-bright' ? 20 : 'var(--drop-radius-card, 18px)',
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">❓</span>
              <p className="text-xs font-bold tracking-wider uppercase"
                style={{
                  fontFamily: 'var(--drop-font-body)',
                  color: band === 'big-bold-bright' ? 'rgba(255,255,255,0.7)' : catColor,
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
        <ReactionBar articleId={article.id} categoryColor={catColor} />

        {/* Share Button */}
        <button
          data-testid="share-btn"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full mt-5 py-3 text-sm font-bold transition-all duration-200"
          style={{
            fontFamily: 'var(--drop-font-body)',
            background: isDark ? 'var(--drop-surface)' : `${catColor}10`,
            color: catColor,
            border: `1px solid var(--drop-border)`,
            borderRadius: 'var(--drop-radius-btn, 16px)',
          }}
        >
          <Share2 size={16} />
          Share this story
        </button>

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 mb-4 px-5 py-3 text-sm font-medium transition-all duration-200"
          style={{
            fontFamily: 'var(--drop-font-body)',
            background: 'var(--drop-surface)',
            border: `1px solid var(--drop-border)`,
            borderRadius: 'var(--drop-radius-card, 18px)',
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
