const REACTIONS = [
  { id: 'mind_blown', emoji: '🤯' },
  { id: 'surprising', emoji: '😮' },
  { id: 'angry', emoji: '😡' },
  { id: 'sad', emoji: '😢' },
  { id: 'inspiring', emoji: '💪' },
];

export const ReactionMini = ({ counts }) => {
  const total = Object.values(counts || {}).reduce((a, b) => a + Math.max(0, b), 0);
  if (total === 0) return null;

  const sorted = Object.entries(counts || {})
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2);

  return (
    <div data-testid="reaction-mini" className="flex items-center gap-1">
      {sorted.map(([key]) => {
        const r = REACTIONS.find(r => r.id === key);
        return r ? <span key={key} className="text-xs">{r.emoji}</span> : null;
      })}
      <span
        className="text-[10px] font-bold"
        style={{
          fontFamily: 'Outfit, sans-serif',
          color: '#64748B',
        }}
      >
        {total}
      </span>
    </div>
  );
};
