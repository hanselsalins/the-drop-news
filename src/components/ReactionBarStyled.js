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
import { ChevronLeft, ExternalLink, Share2, Bookmark } from 'lucide-react';
import axios from 'axios';
import { markArticleRead } from '../hooks/useReadArticles';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const ReactionBarStyled = ({ articleId }) => {
  // This is handled by the imported ReactionBar, just re-export with new styles
  return <ReactionBar articleId={articleId} />;
};
