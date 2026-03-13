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
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0E1A' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: '#3B82F6', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0E1A' }}>
        <p style={{ color: '#CBD5E1', fontFamily: 'Outfit, sans-serif' }}>Article not found.</p>
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

  return (
    <div data-testid="article-page" className="min-h-screen pb-28" style={{ background: '#0A0E1A' }}>
      {/* Hero Image */}
      <div className="relative">
        <div className="aspect-video w-full overflow-hidden">
          <img src={article.image_url} alt={title} className="w-full h-full object-cover"
            onError={(e) => { e.target.style.background = '#111827'; e.target.src = ''; }} />
        </div>
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(to top, #0A0E1A 0%, rgba(10,14,26,0.5) 50%, transparent 80%)',
        }} />
        <button data-testid="back-btn" onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2.5 rounded-2xl z-10"
          style={{ background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <ChevronLeft size={22} style={{ color: '#F1F5F9' }} />
        </button>
        <button data-testid="share-btn" onClick={handleShare}
          className="absolute top-4 right-4 p-2.5 rounded-2xl z-10"
          style={{ background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Share2 size={20} style={{ color: '#F1F5F9' }} />
        </button>
      </div>

      {/* Content */}
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
        className="px-5 -mt-10 relative z-10">

        {/* Category pill */}
        <span className="inline-block px-3.5 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase mb-4"
          style={{
            fontFamily: 'Outfit, sans-serif',
            background: catColor,
            color: ['#F59E0B', '#10B981', '#14B8A6'].includes(catColor) ? '#0A0E1A' : '#fff',
            boxShadow: `0 2px 16px ${catColor}44`,
          }}>
          {CATEGORY_LABELS[article.category] || article.category}
        </span>

        {/* Title */}
        <h1 className="text-[28px] md:text-[32px] font-bold tracking-tight leading-tight mb-4"
          style={{ fontFamily: 'Fredoka, sans-serif', color: '#F1F5F9' }}>
          {title}
        </h1>

        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          {article.source_logo && (
            <img src={article.source_logo} alt={article.source}
              className="w-5 h-5 rounded object-contain opacity-60"
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <span className="text-sm" style={{ fontFamily: 'Outfit, sans-serif', color: '#64748B' }}>
            {article.source}
          </span>
          <div className="flex items-center gap-1.5 text-sm" style={{ color: '#475569' }}>
            <Clock size={14} />
            <span style={{ fontFamily: 'Outfit, sans-serif' }}>{readingTime} read</span>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="p-5 rounded-2xl mb-6" style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
          }}>
            <p className="text-base font-medium leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif', color: '#E2E8F0' }}>
              {summary}
            </p>
          </div>
        )}

        {/* Body */}
        <div className="text-base leading-[1.8] space-y-4"
          style={{ fontFamily: 'Outfit, sans-serif', color: '#CBD5E1' }}>
          {body.split('\n').filter(Boolean).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {/* Wonder Question */}
        {wonderQuestion && (
          <div data-testid="wonder-question" className="mt-8 p-5 rounded-2xl" style={{
            background: catColor,
            boxShadow: `0 4px 24px ${catColor}33`,
          }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">❓</span>
              <p className="text-xs font-bold tracking-wider uppercase"
                style={{ fontFamily: 'Outfit, sans-serif', color: ['#F59E0B', '#10B981', '#14B8A6'].includes(catColor) ? '#0A0E1A' : 'rgba(255,255,255,0.8)' }}>
                Wonder Question
              </p>
            </div>
            <p className="text-base font-semibold leading-relaxed"
              style={{ fontFamily: 'Outfit, sans-serif', color: ['#F59E0B', '#10B981', '#14B8A6'].includes(catColor) ? '#0A0E1A' : '#fff' }}>
              {wonderQuestion}
            </p>
          </div>
        )}

        {/* Reaction Bar */}
        <ReactionBar articleId={article.id} categoryColor={catColor} />

        {/* Source Link */}
        <a data-testid="source-link" href={article.original_url} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-6 mb-4 px-5 py-3 rounded-2xl text-sm font-medium transition-all duration-200"
          style={{
            fontFamily: 'Outfit, sans-serif',
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#94A3B8',
          }}>
          <ExternalLink size={16} />
          Read the original at {article.source} →
        </a>
      </motion.div>

      <BottomNav active="home" />
    </div>
  );
}
