import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { BottomNav } from '../components/BottomNav';
import { ReactionBar } from '../components/ReactionBar';
import { motion } from 'framer-motion';
import { ChevronLeft, ExternalLink, Share2, Clock } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const CATEGORY_COLORS = {
  world: '#3B82F6',
  science: '#10B981',
  sports: '#F97316',
  tech: '#8B5CF6',
  environment: '#14B8A6',
  'weird & wonderful': '#F59E0B',
  weird: '#F59E0B',
  entertainment: '#EC4899',
  money: '#F59E0B',
  history: '#F97316',
  local: '#14B8A6',
};

const CATEGORY_LIGHT_BG = {
  world: '#EFF6FF',
  science: '#ECFDF5',
  sports: '#FFF7ED',
  tech: '#F5F3FF',
  environment: '#F0FDFA',
  'weird & wonderful': '#FFFBEB',
  weird: '#FFFBEB',
  entertainment: '#FDF2F8',
  money: '#FFFBEB',
  history: '#FFF7ED',
  local: '#F0FDFA',
};

const CATEGORY_LABELS = {
  world: "World",
  science: "Science",
  sports: "Sports",
  tech: "Tech",
  environment: "Environment",
  'weird & wonderful': "Weird & Wonderful",
  weird: "Weird & Wonderful",
  entertainment: "Entertainment",
  money: "Money",
  history: "History",
  local: "Local",
};

const CATEGORY_EMOJI = {
  world: '🌍',
  science: '🔬',
  sports: '⚽',
  tech: '💻',
  environment: '🌱',
  'weird & wonderful': '🦄',
  weird: '🦄',
  entertainment: '🎬',
  money: '💰',
  history: '📜',
  local: '📍',
};

export default function ArticlePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { ageGroup, token } = useTheme();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

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
    if (!token || !article) return;
    axios.post(`${BACKEND_URL}/api/streak/read`, {}, { headers }).catch(() => {});
  }, [article, token]);

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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8FAFC' }}>
        <p style={{ color: '#64748B', fontFamily: 'Outfit, sans-serif' }}>Article not found.</p>
      </div>
    );
  }

  const rw = article.rewrite;
  const title = rw?.title || article.original_title;
  const body = rw?.body || article.original_content || '';
  const summary = rw?.summary || '';
  const readingTime = rw?.reading_time || '2 min';
  const wonderQuestion = rw?.wonder_question || '';
  const catColor = CATEGORY_COLORS[article.category] || '#3B82F6';
  const lightBg = CATEGORY_LIGHT_BG[article.category] || '#EFF6FF';
  const emoji = CATEGORY_EMOJI[article.category] || '📰';

  return (
    <div data-testid="article-page" className="min-h-screen pb-28" style={{ background: '#F8FAFC' }}>
      {/* Hero area with gradient */}
      <div
        className="relative w-full flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${catColor}22, ${catColor}44)`,
          minHeight: 200,
        }}
      >
        <span style={{ fontSize: 80 }}>{emoji}</span>

        <button data-testid="back-btn" onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2.5 z-10"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <ChevronLeft size={22} style={{ color: '#0F172A' }} />
        </button>
        <button data-testid="share-btn" onClick={handleShare}
          className="absolute top-4 right-4 p-2.5 z-10"
          style={{
            background: '#FFFFFF',
            borderRadius: 14,
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
          <Share2 size={20} style={{ color: '#0F172A' }} />
        </button>
      </div>

      {/* Content */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="px-5 pt-5">

        {/* Category pill */}
        <div className="flex items-center gap-1.5 mb-3">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: catColor,
              display: 'inline-block',
            }}
          />
          <span className="text-[11px] font-bold tracking-wider uppercase"
            style={{ fontFamily: 'Outfit, sans-serif', color: catColor }}>
            {CATEGORY_LABELS[article.category] || article.category}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-[26px] font-bold tracking-tight leading-tight mb-3"
          style={{ fontFamily: 'Fredoka, sans-serif', color: '#0F172A' }}>
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-5">
          <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#94A3B8' }}>
            {article.source}
          </span>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#94A3B8' }}>
            <Clock size={14} />
            <span style={{ fontFamily: 'Outfit, sans-serif' }}>{readingTime} read</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="p-4 mb-5" style={{
            background: lightBg,
            border: `1.5px solid ${catColor}22`,
            borderRadius: 18,
          }}>
            <p className="text-sm font-medium leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#334155' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="text-base leading-[1.8] space-y-4"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#475569' }}>
          {body.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Wonder Question */}
        {wonderQuestion && (
          <div data-testid="wonder-question" className="mt-8 p-5" style={{
            background: lightBg,
            border: `1.5px solid ${catColor}33`,
            borderRadius: 18,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">❓</span>
              <p className="text-xs font-bold tracking-wider uppercase"
                style={{ fontFamily: 'Outfit, sans-serif', color: catColor }}>
                Wonder Question
              </p>
            </div>
            <p className="text-base font-semibold leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#0F172A' }}>
              {wonderQuestion}
            </p>
          </div>
        )}

        {/* Reaction Bar */}
        <ReactionBar articleId={article.id} categoryColor={catColor} />

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 mb-4 px-5 py-3 text-sm font-medium transition-all duration-200"
          style={{
            fontFamily: 'Outfit, sans-serif',
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            borderRadius: 18,
            color: '#64748B',
          }}>
          <ExternalLink size={16} />
          Read the original at {article.source} →
        </a>
      </motion.div>

      <BottomNav active="home" />
    </div>
  );
}
