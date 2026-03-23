import { useNavigate } from 'react-router-dom';
import { light } from '../lib/haptic';
import { useTheme } from '../contexts/ThemeContext';

const UNSPLASH = {
  globe: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80',
  government: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=300&q=80',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80',
  science: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=300&q=80',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&q=80',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=300&q=80',
  people: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=300&q=80',
  justice: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=300&q=80',
  culture: 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=300&q=80',
};

const CATEGORIES_BY_BAND = {
  '8-10': [
    { id: 'world', name: 'Our World', desc: 'Big stories happening right now', img: UNSPLASH.globe },
    { id: 'people', name: 'People', desc: 'Stories about real people everywhere', img: UNSPLASH.people },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: UNSPLASH.sports },
  ],
  '11-13': [
    { id: 'world', name: 'World', desc: 'Big stories from around the globe', img: UNSPLASH.globe },
    { id: 'fairornot', name: 'Fair or Not?', desc: 'Who makes the rules and why', img: UNSPLASH.justice },
    { id: 'science', name: 'Science & Tech', desc: 'Discovery, innovation and what\'s next', img: UNSPLASH.science },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: UNSPLASH.sports },
  ],
  '14-16': [
    { id: 'world', name: 'World', desc: 'Big stories from around the globe', img: UNSPLASH.globe },
    { id: 'power', name: 'Power', desc: 'Governments, leaders and decisions', img: UNSPLASH.government },
    { id: 'business', name: 'Business', desc: 'Companies, markets and the economy', img: UNSPLASH.business },
    { id: 'science', name: 'Science & Planet', desc: 'Earth, climate and discovery', img: UNSPLASH.science },
    { id: 'sports', name: 'Sports', desc: 'Results, records and rivalries', img: UNSPLASH.sports },
    { id: 'tech', name: 'Tech', desc: 'Innovation, AI and what\'s next', img: UNSPLASH.tech },
  ],
  '17-20': [
    { id: 'world', name: 'World', desc: 'Global affairs and international news', img: UNSPLASH.globe },
    { id: 'power', name: 'Power', desc: 'Politics, governance and elections', img: UNSPLASH.government },
    { id: 'business', name: 'Business', desc: 'Markets, economy and enterprise', img: UNSPLASH.business },
    { id: 'science', name: 'Science & Tech', desc: 'Innovation, research and technology', img: UNSPLASH.science },
    { id: 'sports', name: 'Sports', desc: 'Results, records and analysis', img: UNSPLASH.sports },
    { id: 'culture', name: 'Culture', desc: 'Arts, society and human stories', img: UNSPLASH.culture },
  ],
  '20+': [
    { id: 'world', name: 'World', desc: 'Global affairs and international news', img: UNSPLASH.globe },
    { id: 'power', name: 'Power', desc: 'Politics, governance and elections', img: UNSPLASH.government },
    { id: 'business', name: 'Business', desc: 'Markets, economy and enterprise', img: UNSPLASH.business },
    { id: 'science', name: 'Science & Tech', desc: 'Innovation, research and technology', img: UNSPLASH.science },
    { id: 'sports', name: 'Sports', desc: 'Results, records and analysis', img: UNSPLASH.sports },
    { id: 'culture', name: 'Culture', desc: 'Arts, society and human stories', img: UNSPLASH.culture },
  ],
};

export const CategoryTabs = () => {
  const { ageGroup } = useTheme();
  const navigate = useNavigate();
  const cats = CATEGORIES_BY_BAND[ageGroup] || CATEGORIES_BY_BAND['14-16'];

  const handleTap = (catId) => {
    light();
    navigate(`/category/${catId}`);
  };

  return (
    <div
      className="w-full overflow-x-auto"
      style={{
        WebkitOverflowScrolling: 'touch',
        marginTop: 15,
        paddingBottom: 8,
        scrollbarWidth: 'none',
      }}
    >
      <style>{`.cat-slider::-webkit-scrollbar { display: none; }`}</style>
      <div className="cat-slider flex" style={{ gap: 10, minWidth: 'max-content', overflow: 'auto', scrollbarWidth: 'none', padding: 0 }}>
        {cats.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleTap(cat.id)}
            style={{
              width: 110,
              height: 100,
              borderRadius: 15,
              position: 'relative',
              overflow: 'hidden',
              flexShrink: 0,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: 'none',
            }}
          >
            {/* Background image */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${cat.img})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'brightness(55%)',
              borderRadius: 15,
            }} />
            {/* Content */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              padding: 10,
            }}>
              <span style={{
                display: 'inline-block',
                alignSelf: 'flex-start',
                background: 'rgba(255,255,255,0.92)',
                color: '#2a2a2a',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'Rubik, var(--font), sans-serif',
                padding: '3px 8px',
                borderRadius: 4,
              }}>
                {cat.name}
              </span>
              <span style={{
                fontSize: 11,
                fontWeight: 500,
                fontFamily: 'Rubik, var(--font), sans-serif',
                color: '#ffffff',
                lineHeight: 1.35,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                textAlign: 'left',
              }}>
                {cat.desc}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
