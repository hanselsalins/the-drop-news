import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { ReactionBar } from '../components/ReactionBar';
import { ProfilePanel } from '../components/ProfilePanel';
import { PullQuote } from '../components/PullQuote';
import { getCategoryColor, CATEGORY_LABELS } from '../lib/bandUtils';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, Share2, Clock, Bookmark } from 'lucide-react';
import axios from 'axios';
import { markArticleRead } from '../hooks/useReadArticles';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ageGroup, token } = useTheme();
  const prefersReducedMotion = useReducedMotion();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [readProgress, setReadProgress] = useState(0);

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
      <div className="min-h-screen" style={{ background: '#FFFFFF' }}>
        <div className="skeleton-shimmer-light" style={{ width: '100%', height: 505 }} />
        <div className="px-6 pt-6 space-y-4">
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
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#FFFFFF' }}>
        <p style={{ color: '#A2A2A2', fontFamily: "'Inter', sans-serif" }}>Article not found.</p>
      </div>
    );
  }

  const rw = article.rewrite;
  const title = rw?.title || article.original_title;
  const body = rw?.body || article.original_content || '';
  const summary = rw?.summary || '';
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
    <div data-testid="article-page" className="min-h-screen pb-28" style={{ background: '#FFFFFF' }}>
      {/* Reading progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50" style={{ height: 3, background: 'rgba(80,122,249,0.15)' }}>
        <div style={{
          width: `${readProgress}%`,
          height: '100%',
          background: '#507AF9',
          transition: 'width 0.1s',
        }} />
      </div>

      {/* Hero image */}
      <div className="relative w-full" style={{ height: 505, background: '#EFEFEB' }}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: '#EFEFEB' }} />
        )}

        {/* Nav over image */}
        <button
          data-testid="back-btn"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="absolute cursor-pointer"
          style={{ top: 16, left: 16, width: 28, height: 28 }}
        >
          <ChevronLeft size={28} style={{ color: '#FFFFFF' }} />
        </button>
        <button
          aria-label="Bookmark"
          className="absolute cursor-pointer"
          style={{ top: 16, right: 16, width: 28, height: 28 }}
        >
          <Bookmark size={28} style={{ color: '#FFFFFF' }} />
        </button>
      </div>

      {/* Article content — slides up */}
      <motion.div
        initial={prefersReducedMotion ? undefined : { y: 30, opacity: 0 }}
        animate={prefersReducedMotion ? undefined : { y: 0, opacity: 1 }}
        transition={prefersReducedMotion ? undefined : { duration: 0.4 }}
        style={{
          background: '#FFFFFF',
          borderRadius: '20px 20px 0 0',
          marginTop: -24,
          position: 'relative',
          zIndex: 10,
          padding: 24,
        }}
      >
        {/* Category badge */}
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 11,
          fontWeight: 600,
          color: '#FFFFFF',
          background: '#151924',
          borderRadius: 18,
          padding: '8px 16px',
          display: 'inline-block',
        }}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 20,
          fontWeight: 600,
          color: '#151924',
          lineHeight: 1.35,
          marginTop: 12,
          marginBottom: 8,
        }}>
          {title}
        </h1>

        {/* Meta row */}
        <div className="flex items-center gap-2 mb-5">
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 400, color: '#A2A2A2' }}>
            {readingTime} read
          </span>
          <span style={{ color: '#A2A2A2' }}>·</span>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 500, color: '#A2A2A2' }}>
            posted by {article.source}
          </span>
        </div>

        {/* Summary */}
        {summary && (
          <div style={{
            padding: 16,
            background: '#F5F5F5',
            borderRadius: 12,
            marginBottom: 20,
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: '#404551',
              lineHeight: '18px',
              margin: 0,
            }}>
              {summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="space-y-4">
          {bodyParagraphs.map((p, i) => (
            <div key={i}>
              <p style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                fontWeight: 400,
                color: '#404551',
                lineHeight: '18px',
                margin: 0,
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
            marginTop: 16,
            paddingLeft: 12,
            borderLeft: '3px solid #507AF9',
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              fontStyle: 'italic',
              color: '#507AF9',
              margin: 0,
            }}>
              {wonderQuestion}
            </p>
          </div>
        )}

        {/* Reaction Bar */}
        <ReactionBar articleId={article.id} />

        {/* Share */}
        <button
          data-testid="share-btn"
          aria-label="Share this story"
          onClick={handleShare}
          className="flex items-center justify-center gap-2 w-full mt-5 py-3 cursor-pointer transition-all duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            background: '#151924',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
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
          className="flex items-center justify-center gap-2 w-full mt-2 py-3 cursor-pointer transition-all duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 15,
            fontWeight: 600,
            background: '#25D366',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 12,
          }}
        >
          Share on WhatsApp
        </button>

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 mb-4 px-5 py-3 transition-all duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            background: '#F5F5F5',
            border: 'none',
            borderRadius: 12,
            color: '#A2A2A2',
            textDecoration: 'none',
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
