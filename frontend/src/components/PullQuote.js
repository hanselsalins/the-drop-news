export function PullQuote({ text }) {
  if (!text) return null;

  return (
    <blockquote className="pull-quote">
      <p style={{
        fontFamily: 'var(--font)',
        color: 'var(--accent)',
        margin: 0,
      }}>
        {text}
      </p>
    </blockquote>
  );
}
