import { useNavigate } from 'react-router-dom';
import { light } from '../lib/haptic';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES_BY_BAND = {
  '8-10': [
    { id: 'world', name: 'Our World', desc: 'Big stories happening right now', img: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=80' },
    { id: 'people', name: 'People', desc: 'Stories about real people everywhere', img: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?w=300&q=80' },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&q=80' },
  ],
  '11-13': [
    { id: 'world', name: 'World', desc: 'Big stories from around the globe', img: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=300&q=80' },
    { id: 'fairornot', name: 'Fair or Not?', desc: 'Who makes the rules and why', img: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80' },
    { id: 'science', name: 'Science & Tech', desc: 'Discovery, innovation and what\'s next', img: 'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=300&q=80' },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80' },
  ],
  '14-16': [
    { id: 'world', name: 'World', desc: 'Big stories from around the globe', img: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=300&q=80' },
    { id: 'power', name: 'Power', desc: 'Governments, leaders and decisions', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80' },
    { id: 'business', name: 'Business', desc: 'Companies, markets and the economy', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
    { id: 'science', name: 'Science & Planet', desc: 'Earth, climate and discovery', img: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80' },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=300&q=80' },
    { id: 'tech', name: 'Tech', desc: 'Innovation, AI and what\'s next', img: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80' },
  ],
  '17-20': [
    { id: 'world', name: 'World', desc: 'Global affairs and international news', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' },
    { id: 'power', name: 'Power', desc: 'Politics, governance and elections', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80' },
    { id: 'business', name: 'Business', desc: 'Markets, economy and enterprise', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
    { id: 'science', name: 'Science & Tech', desc: 'Innovation, research and technology', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80' },
    { id: 'sports', name: 'Sports', desc: 'Results, records and analysis', img: 'https://images.unsplash.com/photo-1504016798967-54a825798c7d?w=300&q=80' },
    { id: 'culture', name: 'Culture', desc: 'Arts, society and human stories', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80' },
  ],
  '20+': [
    { id: 'world', name: 'World', desc: 'Global affairs and international news', img: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' },
    { id: 'power', name: 'Power', desc: 'Politics, governance and elections', img: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80' },
    { id: 'business', name: 'Business', desc: 'Markets, economy and enterprise', img: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&q=80' },
    { id: 'science', name: 'Science & Tech', desc: 'Innovation, research and technology', img: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80' },
    { id: 'sports', name: 'Sports', desc: 'Results, records and analysis', img: 'https://images.unsplash.com/photo-1504016798967-54a825798c7d?w=300&q=80' },
    { id: 'culture', name: 'Culture', desc: 'Arts, society and human stories', img: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80' },
  ],
};

const FONT_STACK = "'Rubik', -apple-system, 'SF Pro Text', system-ui, 'Helvetica Neue', Arial, sans-serif";

export const CategoryTabs = () => {
  const { ageGroup } = useTheme();
  const navigate = useNavigate();
  const cats = CATEGORIES_BY_BAND[ageGroup] || CATEGORIES_BY_BAND['14-16'];

  const handleTap = (catId) => {
    light();
    navigate(`/category/${catId}`);
  };

  const count = cats.length;

  const getDescription = () => {
    switch (ageGroup) {
      case '8-10':
        return <>Explore <span style={{ color: '#FF6B00', fontWeight: 600 }}>{count}</span> topics we picked just for you</>;
      case '11-13':
        return <>Dive into <span style={{ color: '#FF6B00', fontWeight: 600 }}>{count}</span> topics that matter right now</>;
      case '14-16':
        return <>Stay sharp across <span style={{ color: '#FF6B00', fontWeight: 600 }}>{count}</span> topics shaping the world</>;
      default:
        return <>Your <span style={{ color: '#FF6B00', fontWeight: 600 }}>{count}</span> essential topics — read them all</>;
    }
  };

  return (
    <div style={{ marginTop: 32, paddingBottom: 8 }}>
      <span style={{
        fontFamily: 'var(--font)',
        fontSize: 28,
        fontWeight: 600,
        color: 'var(--title-color)',
        display: 'block',
      }}>
        Categories
      </span>
      <p style={{
        fontFamily: FONT_STACK,
        fontSize: 15,
        fontWeight: 400,
        color: 'var(--text-color)',
        margin: 0,
        marginTop: -4,
        marginBottom: 8,
      }}>
        {getDescription()}
      </p>
      <style>{`.cat-slider::-webkit-scrollbar { display: none; }`}</style>
      <div
        className="cat-slider"
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          paddingBottom: 8,
          marginTop: 15,
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          justifyContent: cats.length <= 3 ? 'center' : 'flex-start',
        }}
      >
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleTap(cat.id)}
            style={{
              width: 125.2,
              minWidth: 125.2,
              borderRadius: 18,
              overflow: 'hidden',
              boxShadow: 'var(--block-shadow)',
              display: 'flex',
              flexDirection: 'column',
              background: '#f0f0f0',
              flexShrink: 0,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            {/* IMAGE SECTION */}
            <div style={{
              width: 125.2,
              height: 80,
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${cat.img})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'brightness(55%)',
              }} />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(24,24,24,0.85) 100%)',
              }} />
              <span style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '20px 10px 8px 10px',
                fontFamily: FONT_STACK,
                fontSize: 10,
                fontWeight: 500,
                color: '#ffffff',
                lineHeight: 1.3,
              }}>
                {cat.desc}
              </span>
            </div>
            {/* FOOTER SECTION */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              padding: '6px 10px',
              backgroundColor: '#f0f0f0',
            }}>
              <span style={{
                fontFamily: FONT_STACK,
                fontSize: 15,
                fontWeight: 600,
                color: 'var(--title-color)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {cat.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
