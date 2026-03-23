import memojiBoy1 from '../assets/memoji-boy-1.png';
import memojiGirl1 from '../assets/memoji-girl-1.png';
import memojiGirl2 from '../assets/memoji-girl-2.png';
import memojiBoy2 from '../assets/memoji-boy-2.png';
import memojiBoy3 from '../assets/memoji-boy-3.png';
import memojiGirl3 from '../assets/memoji-girl-3.png';

const MEMOJIS = [memojiBoy1, memojiGirl1, memojiGirl2, memojiBoy2, memojiBoy3, memojiGirl3];

export function getMemoji(name) {
  if (!name) return MEMOJIS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMOJIS[Math.abs(hash) % MEMOJIS.length];
}
