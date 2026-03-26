import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export function useReportStatus(articleId) {
  const { token } = useTheme();
  const [reported, setReported] = useState(false);

  useEffect(() => {
    if (!articleId || !token) return;
    axios.get(`${BACKEND_URL}/api/report-status/${articleId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(res => {
      if (res.data?.reported) setReported(true);
    }).catch(() => {});
  }, [articleId, token]);

  const markReported = useCallback(() => setReported(true), []);

  return { reported, markReported };
}
