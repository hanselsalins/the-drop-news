/**
 * Framework7 Icon component — replaces all Lucide/SVG icons.
 * Usage: <F7Icon name="house_fill" size={22} color="var(--accent)" />
 */
export const F7Icon = ({ name, size = 22, color, className = '', style = {}, ...rest }) => (
  <i
    className={`f7-icons ${className}`}
    style={{ fontSize: size, color, ...style }}
    {...rest}
  >
    {name}
  </i>
);
