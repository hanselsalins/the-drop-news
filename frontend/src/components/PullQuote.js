export function PullQuote({ text }) {
  if (!text) return null;

  return (
    <blockquote className="pull-quote">
      <p style={{
        fontFamily: 'var(--drop-font-heading)',
        color: 'var(--drop-text)',
        margin: 0,
      }}>
        {text}
      </p>
    </blockquote>
  );
}
