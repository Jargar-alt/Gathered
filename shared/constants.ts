/** Gathered brand palette from promo / swatches */
export const palette = {
  slate: '#3D5462',
  mist: '#C8CECD',
  sage: '#9A9D86',
  clay: '#C1A390',
  blush: '#EAD5C9',
  cream: '#EBE3D9',
} as const;

export const AVATAR_COLORS = [
  'bg-stone-200', 'bg-stone-300', 'bg-stone-400',
  'bg-zinc-200', 'bg-zinc-300', 'bg-zinc-400',
  'bg-neutral-200', 'bg-neutral-300', 'bg-neutral-400',
  'bg-slate-200', 'bg-slate-300', 'bg-slate-400',
];

/** Avatar swatches remapped to the Gathered promo palette (keys kept for existing profiles). */
export const AVATAR_COLOR_MAP: Record<string, string> = {
  'bg-stone-200': palette.blush,
  'bg-stone-300': palette.clay,
  'bg-stone-400': '#A88978',
  'bg-zinc-200': palette.cream,
  'bg-zinc-300': palette.mist,
  'bg-zinc-400': '#9AA5A3',
  'bg-neutral-200': '#E4D9CE',
  'bg-neutral-300': palette.sage,
  'bg-neutral-400': '#7E826C',
  'bg-slate-200': '#D5DBDA',
  'bg-slate-300': '#A8B6BB',
  'bg-slate-400': palette.slate,
};

export const REACTIONS = ['👍', '❤️', '🙌', '🙏'] as const;

export const FIRESTORE_DATABASE_ID = 'ai-studio-8208d2b0-a74a-48ef-b802-330bc39f0036';
