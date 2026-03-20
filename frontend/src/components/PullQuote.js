export function PullQuote({ text }) {
  if (!text) return null;

  return (
    <blockquote className="pull-quote">
      <p style={{
        fontFamily: "'Inter', sans-serif",
        color: '#507AF9',
        margin: 0,
      }}>
        {text}
      </p>
    </blockquote>
  );
}
