import memojiBoy1 from '../assets/memoji-boy-1.png';
import memojiGirl1 from '../assets/memoji-girl-1.png';
import memojiGirl2 from '../assets/memoji-girl-2.png';
import memojiBoy2 from '../assets/memoji-boy-2.png';
import memojiBoy3 from '../assets/memoji-boy-3.png';
import memojiGirl3 from '../assets/memoji-girl-3.png';
import memoji4 from '../assets/memoji-4.png';
import memoji5 from '../assets/memoji-5.png';
import memoji6 from '../assets/memoji-6.png';
import memoji7 from '../assets/memoji-7.png';
import memoji8 from '../assets/memoji-8.png';
import memoji9 from '../assets/memoji-9.png';
import memoji10 from '../assets/memoji-10.png';
import memoji11 from '../assets/memoji-11.png';
import memoji12 from '../assets/memoji-12.png';

export const MEMOJI_BANK = [
  { id: 'boy-1', src: memojiBoy1, label: 'Curly hair boy' },
  { id: 'girl-1', src: memojiGirl1, label: 'Blonde girl' },
  { id: 'girl-2', src: memojiGirl2, label: 'Buns girl' },
  { id: 'boy-2', src: memojiBoy2, label: 'Wavy hair boy' },
  { id: 'boy-3', src: memojiBoy3, label: 'Bob hair' },
  { id: 'girl-3', src: memojiGirl3, label: 'Red curly girl' },
  { id: 'avatar-4', src: memoji4, label: 'Fade haircut boy' },
  { id: 'avatar-5', src: memoji5, label: 'Hijab girl' },
  { id: 'avatar-6', src: memoji6, label: 'Glasses boy' },
  { id: 'avatar-7', src: memoji7, label: 'Styled hair boy' },
  { id: 'avatar-8', src: memoji8, label: 'Braids girl' },
  { id: 'avatar-9', src: memoji9, label: 'Short hair boy' },
  { id: 'avatar-10', src: memoji10, label: 'Purple hair girl' },
  { id: 'avatar-11', src: memoji11, label: 'Curly boy' },
  { id: 'avatar-12', src: memoji12, label: 'Ginger girl' },
];

export function getMemoji(name) {
  if (!name) return MEMOJI_BANK[0].src;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMOJI_BANK[Math.abs(hash) % MEMOJI_BANK.length].src;
}

export function getMemojiById(id) {
  const found = MEMOJI_BANK.find(m => m.id === id);
  return found ? found.src : MEMOJI_BANK[0].src;
}
