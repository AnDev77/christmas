export const themes = {
  courage: { name: '용기', symbol: '✦', color: '#8e3f32' },
  rest: { name: '휴식', symbol: '☾', color: '#465c72' },
  love: { name: '사랑', symbol: '♥', color: '#8b4557' },
  beginning: { name: '새로운 시작', symbol: '✺', color: '#365e4a' },
};

export type Theme = keyof typeof themes;
export const themeKeys = Object.keys(themes) as Theme[];

export type Seal = {
  id: string;
  theme: Theme;
  name: string;
  lines: readonly [string, string];
};

export const seals: readonly Seal[] = [
  { id: 'little-star', theme: 'courage', name: '작은 별', lines: ['겁이 나도 괜찮아.', '작은 한 걸음이면 충분해.'] },
  { id: 'winter-lantern', theme: 'courage', name: '겨울 등불', lines: ['지금 길이 다 보이지 않아도,', '내딛는 곳부터 밝아질 거야.'] },
  { id: 'quiet-moon', theme: 'rest', name: '고요한 달', lines: ['오늘 다 끝내지 않아도 돼.', '남은 일은 내일의 너에게 맡기자.'] },
  { id: 'warm-window', theme: 'rest', name: '따뜻한 창가', lines: ['오늘은 손을 녹일 만큼만,', '잠깐 쉬었다 가도 돼.'] },
  { id: 'red-mitten', theme: 'love', name: '빨간 벙어리장갑', lines: ['문득 떠오르는 얼굴이 있다면,', '오늘은 네가 먼저 안부를 물어봐.'] },
  { id: 'winter-letter', theme: 'love', name: '겨울 편지', lines: ['좋아하는 사람에게 하듯,', '너에게도 다정하게 말해줘.'] },
  { id: 'first-snow', theme: 'beginning', name: '첫눈', lines: ['처음부터 잘할 필요 없어.', '이번엔 가벼운 마음으로 시작해 봐.'] },
  { id: 'new-dawn', theme: 'beginning', name: '새벽의 별', lines: ['올해 못다 한 일이 있다면,', '내년에 다시 해 봐도 좋겠어.'] },
];

export function findSeal(id: string | null) {
  return seals.find((seal) => seal.id === id);
}

export function drawSeal(theme: Theme) {
  const choices = seals.filter((seal) => seal.theme === theme);
  return choices[Math.floor(Math.random() * choices.length)];
}
