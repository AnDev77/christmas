import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { drawSeal, findSeal, themeKeys, themes, type Seal, type Theme } from './seals';
import { saveSealImage } from './sealImage';
import styles from './App.module.css';

const storageKey = 'winter-seal:last';
const ornaments = [
  { x: 46, y: 29, motif: 'star', color: 'gold' },
  { x: 63, y: 43, motif: 'moon', color: 'blue' },
  { x: 32, y: 50, motif: 'heart', color: 'wine' },
  { x: 52, y: 62, motif: 'flower', color: 'gold' },
  { x: 72, y: 70, motif: 'star', color: 'wine' },
  { x: 27, y: 74, motif: 'moon', color: 'blue' },
] as const;

const symbols = { star: '✦', moon: '☾', heart: '♡', flower: '❋' };
const snow = Array.from({ length: 28 }, (_, index) => ({
  left: (index * 37.7) % 100,
  delay: -index * 1.7,
  duration: 12 + (index % 7) * 3,
  size: index % 4 === 0 ? 4 : 2,
}));

function readLastSeal() {
  try {
    return findSeal(localStorage.getItem(storageKey));
  } catch {
    return undefined;
  }
}

function sealFromUrl() {
  return findSeal(new URL(window.location.href).searchParams.get('seal'));
}

export function App() {
  const [theme, setTheme] = useState<Theme>('courage');
  const [lastSeal, setLastSeal] = useState(readLastSeal);
  const [result, setResult] = useState(() => sealFromUrl() ?? readLastSeal());
  const [opening, setOpening] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const revealTimer = useRef<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const tree = useRef<HTMLElement>(null);
  const lastOrnament = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!result) return;
    const modal = dialog.current;
    modal?.showModal();
    const timer = window.setTimeout(() => setRevealed(true),
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 850);
    return () => {
      window.clearTimeout(timer);
      modal?.close();
    };
  }, [result]);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  function closeResult() {
    const url = new URL(window.location.href);
    url.searchParams.delete('seal');
    window.history.replaceState(null, '', url);
    setResult(undefined);
    setRevealed(false);
    setNotice('');
    window.requestAnimationFrame(() => lastOrnament.current?.focus());
  }

  function openOrnament(index: number, button: HTMLButtonElement) {
    if (revealTimer.current !== null || result) return;
    lastOrnament.current = button;
    const pickedSeal = drawSeal(theme);
    setNotice('');
    setOpening(index);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    revealTimer.current = window.setTimeout(() => {
      revealTimer.current = null;
      setRevealed(false);
      setResult(pickedSeal);
      setLastSeal(pickedSeal);
      setOpening(null);
      try {
        localStorage.setItem(storageKey, pickedSeal.id);
      } catch {
        // Keep the draw available in memory when browser storage is restricted.
      }
    }, reduceMotion ? 0 : 850);
  }

  async function shareSeal(seal: Seal) {
    const url = new URL(window.location.href);
    url.searchParams.set('seal', seal.id);
    if (navigator.share) {
      try {
        await navigator.share({ title: seal.name + ' · 겨울의 행운', url: url.href });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url.href);
      setNotice('같은 씰을 여는 링크를 복사했어요.');
    } catch {
      setNotice(url.href);
    }
  }

  async function downloadSeal(seal: Seal) {
    if (saving) return;
    setSaving(true);
    setNotice('');
    try {
      await saveSealImage(seal);
      setNotice('씰 이미지를 저장했어요.');
    } catch {
      setNotice('이미지를 저장하지 못했어요. 잠시 후 다시 눌러주세요.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.world}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <div className={styles.snow} aria-hidden="true">
        {snow.map((flake, index) => <i key={index} style={{
          left: flake.left + '%', animationDelay: flake.delay + 's',
          animationDuration: flake.duration + 's', width: flake.size, height: flake.size,
        }} />)}
      </div>
      <header className={styles.header}>
        <a href={import.meta.env.BASE_URL} className={styles.brand}>
          <span aria-hidden="true">✧</span> 겨울의 행운
        </a>
        <button className={styles.saved} type="button" disabled={!lastSeal || opening !== null}
          onClick={() => { setNotice(''); setResult(lastSeal); }}>
          {lastSeal ? '간직한 씰' : '당신을 위한 작은 선물'}
        </button>
      </header>

      <main className={styles.main}>
        <section className={styles.invitation} aria-label="행운 씰 뽑기">
          <p className={styles.eyebrow}><span /> A LITTLE CHRISTMAS MAGIC</p>
          <h1>올겨울, <br />당신에게 도착할<br /><em>작은 행운.</em></h1>
          <p className={styles.description}>반짝이는 장식을 하나 열어보세요.<br />지금 당신에게 필요한 말이 기다리고 있어요.</p>
          <fieldset className={styles.choice} disabled={opening !== null}>
            <legend>어떤 마음을 담아드릴까요?</legend>
            <div className={styles.themes}>
              {themeKeys.map((key) => (
                <label key={key} className={styles.theme}>
                  <input type="radio" name="theme" checked={theme === key} onChange={() => setTheme(key)} />
                  <span>{themes[key].name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button className={styles.explore} type="button" disabled={opening !== null} onClick={() => {
            tree.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            tree.current?.querySelector('button')?.focus({ preventScroll: true });
          }}>
            트리에서 행운 찾기 <span aria-hidden="true">✧</span>
          </button>
        </section>

        <section ref={tree} className={styles.tree} aria-label="크리스마스 트리의 행운 장식" aria-busy={opening !== null}>
          <div className={styles.halo} aria-hidden="true" />
          <img className={styles.treeImage} src={import.meta.env.BASE_URL + 'images/enchanted-tree.webp'}
            width="960" height="1200" alt="" fetchPriority="high" />
          <div className={styles.ornaments}>
            {ornaments.map(({ x, y, motif, color }, index) => (
              <button key={index} type="button" className={styles.ornament} data-color={color}
                data-opening={opening === index} disabled={opening !== null || Boolean(result)}
                aria-label={`${index + 1}번째 트리 장식 열기`}
                style={{ left: x + '%', top: y + '%', '--sway-delay': -index * 0.7 + 's' } as CSSProperties}
                onClick={(event) => openOrnament(index, event.currentTarget)}>
                <span className={styles.thread} />
                <span className={styles.medallion}><span>{symbols[motif]}</span></span>
                <span className={styles.touchHint}>열어보기</span>
              </button>
            ))}
          </div>
          <p className={styles.treeHint} role="status">
            <span aria-hidden="true">✧</span>{opening === null ? '반짝이는 장식에 행운이 숨어 있어요' : '당신을 위한 선물을 열고 있어요'}
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>A small wish, just for you.</span>
        <span>CHRISTMAS · 2026</span>
      </footer>

      {result && <dialog ref={dialog} className={styles.dialog} aria-labelledby="seal-title"
        onCancel={(event) => { event.preventDefault(); if (!saving) closeResult(); }}>
        <button className={styles.close} type="button" aria-label="씰 닫기" disabled={saving} onClick={closeResult}>×</button>
        <p className={styles.resultIntro}>당신에게 도착한 행운</p>
        <div className={styles.cardScene}>
          <div className={styles.card} data-revealed={revealed}>
            <div className={styles.cardFront} aria-hidden="true">
              <div className={styles.frontBorder}>
                <span className={styles.frontStar}>✦</span>
                <span className={styles.frontName}>A little<br /><em>winter wish</em></span>
                <span className={styles.frontSmall}>당신을 위한 작은 선물</span>
              </div>
            </div>
            <article className={styles.cardBack} style={{ '--seal-color': themes[result.theme].color } as CSSProperties}>
              <p className={styles.cardEdition}>WINTER WISHES · 2026</p>
              <div className={styles.postage}>
                <img src={import.meta.env.BASE_URL + 'images/lantern-seal.webp'} alt="눈 내리는 밤, 전나무 가지에 걸린 따뜻한 등불 일러스트" width="640" height="640" />
                <div className={styles.postmark} aria-hidden="true">DEC<br /><strong>25</strong><br />2026</div>
              </div>
              <p className={styles.cardTheme}>{themes[result.theme].name}의 마음을 담아</p>
              <h2 id="seal-title">{result.name}</h2>
              <p className={styles.message}>{result.lines[0]}<br />{result.lines[1]}</p>
              <p className={styles.signature}>겨울의 행운 <span aria-hidden="true">✧</span></p>
            </article>
          </div>
        </div>
        <div className={styles.resultControls} data-revealed={revealed}>
          <div className={styles.actions}>
            <button className={styles.save} type="button" disabled={saving || !revealed} onClick={() => void downloadSeal(result)}>{saving ? '이미지 준비 중' : '씰 간직하기'}</button>
            <button className={styles.share} type="button" disabled={!revealed} onClick={() => void shareSeal(result)}>마음 나누기</button>
          </div>
          <button className={styles.again} type="button" disabled={saving} onClick={closeResult}>다른 행운도 만나볼까요?</button>
        </div>
        <div className={styles.notice} role="status">
          {notice.startsWith('https:') || notice.startsWith('http:')
            ? <input aria-label="공유 링크" readOnly value={notice} onFocus={(event) => event.currentTarget.select()} />
            : notice}
        </div>
      </dialog>}
    </div>
  );
}
