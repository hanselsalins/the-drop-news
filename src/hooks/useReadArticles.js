import { useState, useEffect, useCallback } from 'react';

const getStorageKey = () => {
  const d = new Date();
  return `readArticles_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function useReadArticles() {
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      return new Set(stored ? JSON.parse(stored) : []);
    } catch {
      return new Set();
    }
  });

  // Listen for storage changes (when returning from ArticlePage)
  const refresh = useCallback(() => {
    try {
      const stored = localStorage.getItem(getStorageKey());
      setReadIds(new Set(stored ? JSON.parse(stored) : []));
    } catch {
      setReadIds(new Set());
    }
  }, []);

  useEffect(() => {
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, [refresh]);

  // Also refresh on visibility change (more reliable for SPA)
  useEffect(() => {
    const handler = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [refresh]);

  return { readIds, refresh };
}

export function markArticleRead(articleId) {
  const key = getStorageKey();
  try {
    const stored = localStorage.getItem(key);
    const ids = stored ? JSON.parse(stored) : [];
    if (!ids.includes(String(articleId))) {
      ids.push(String(articleId));
      localStorage.setItem(key, JSON.stringify(ids));
    }
  } catch {}
}
