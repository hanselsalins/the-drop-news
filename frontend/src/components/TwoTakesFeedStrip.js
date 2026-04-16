import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function TwoTakesFeedStrip() {
  const { ageGroup, countryCode, token } = useTheme();
  const [articles, setArticles] = useState([]);
  const navigate = useNavigate();

  const isOlder = ageGroup === '14-16' || ageGroup === '17-20';

  useEffect(() => {
    if (!isOlder) return;
    const hdrs = token ? { Authorization: `Bearer ${token}` } : {};
    fetch(`${BACKEND_URL}/api/two-takes?country_code=${countryCode || 'IN'}&age_group=${ageGroup || '17-20'}&_t=${Date.now()}`, { headers: hdrs })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => {
        console.log('[TwoTakesFeed] response:', data);
        const items = (data.articles || []).filter(a => a.two_takes);
        setArticles(items);
      })
      .catch(err => console.log('[TwoTakesFeed] error:', err));
  }, [ageGroup, countryCode, token, isOlder]);

  if (!isOlder || articles.length === 0) return null;

  return (
    <div style={{ marginTop: 20 }}>
      <div data-section-title="Two Takes" style={{ padding: '0 15px', marginBottom: 10 }}>
        <span style={{
          fontFamily: 'var(--font)', fontSize: 18, fontWeight: 700,
          color: 'var(--title-color)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          ⚖️ Two Takes
        </span>
      </div>

      <div style={{
        display: 'flex', gap: 12, overflowX: 'auto', padding: '0 15px 4px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
      }}>
        <style>{`.two-takes-strip::-webkit-scrollbar { display: none; }`}</style>
        {articles.map(article => (
          <button
            key={article.id}
            onClick={() => navigate(`/article/${article.id}`)}
            className="cursor-pointer"
            style={{
              flexShrink: 0, width: 200,
              padding: 14, borderRadius: 14,
              background: 'var(--surface)',
              border: '1px solid var(--border, var(--light-gray))',
              textAlign: 'left',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              minHeight: 100,
            }}
          >
            <p style={{
              fontFamily: 'var(--font)', fontSize: 14, fontWeight: 600,
              color: 'var(--title-color)', lineHeight: 1.4, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {article.title}
            </p>
            <span style={{
              marginTop: 10, display: 'inline-block',
              padding: '3px 8px', borderRadius: 6,
              background: '#FF6B00', color: '#FFFFFF',
              fontFamily: 'var(--font)', fontSize: 11, fontWeight: 700,
            }}>
              Two Takes
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
