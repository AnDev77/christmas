import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { drawSeal, findSeal, themeKeys, themes, type Seal, type Theme } from './seals';
import styles from './App.module.css';

const storageKey = 'winter-seal:last';
const ornaments = [
  { x: 44, y: 33, color: 'red' },
  { x: 60, y: 47, color: 'gold' },
  { x: 35, y: 54, color: 'gold' },
  { x: 53, y: 66, color: 'red' },
  { x: 70, y: 70, color: 'gold' },
  { x: 30, y: 72, color: 'red' },
] as const;

function readLastSeal() {
  try {
    return findSeal(localStorage.getItem(storageKey));
  } catch {
    return undefined;
  }
}

export function App() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [lastSeal, setLastSeal] = useState(readLastSeal);
  const [result, setResult] = useState(() => {
    const url = new URL(window.location.href);
    return findSeal(url.searchParams.get('seal')) ?? readLastSeal();
  });
  const [opening, setOpening] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const revealTimer = useRef<number | null>(null);
  const tree = useRef<HTMLElement>(null);
  const resultTitle = useRef<HTMLHeadingElement>(null);
  const firstTheme = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (result) resultTitle.current?.focus({ preventScroll: true });
  }, [result]);

  useEffect(() => () => {
    if (revealTimer.current !== null) window.clearTimeout(revealTimer.current);
  }, []);

  function reset() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('seal')) {
      url.searchParams.delete('seal');
      window.history.replaceState(null, '', url);
    }
    setNotice('');
    setResult(undefined);
    setTheme(null);
    window.requestAnimationFrame(() => firstTheme.current?.focus());
  }

  function openOrnament(index: number) {
    if (!theme) {
      firstTheme.current?.focus();
      setNotice('먼저 지금 받고 싶은 말을 골라주세요.');
      return;
    }
    if (revealTimer.current !== null || result) return;

    const pickedSeal = drawSeal(theme);
    setOpening(index);
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    revealTimer.current = window.setTimeout(() => {
      revealTimer.current = null;
      setResult(pickedSeal);
      setLastSeal(pickedSeal);
      setOpening(null);
      try {
        localStorage.setItem(storageKey, pickedSeal.id);
      } catch {
        // The current draw is still available when storage is restricted.
      }
      if (window.matchMedia('(max-width: 760px)').matches) {
        window.requestAnimationFrame(() => resultTitle.current?.scrollIntoView({ block: 'center' }));
      }
    }, reduceMotion ? 0 : 520);
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
      setNotice('씰 링크를 복사했어요.');
    } catch {
      setNotice(url.href);
    }
  }

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <a className={styles.brand} href={import.meta.env.BASE_URL}>
          <span className={styles.brandMark} aria-hidden="true">✦</span>
          겨울의 행운
        </a>
        {lastSeal && !result ? (
          <button className={styles.saved} type="button" disabled={opening !== null} onClick={() => {
            setNotice('');
            setResult(lastSeal);
          }}>지난 씰 보기 ↗</button>
        ) : null}
      </header>

      <main className={styles.main}>
        <section className={styles.copy} aria-label={result ? '뽑은 행운 씰' : '받고 싶은 말 선택'}>
          {result ? (
            <div className={styles.result} style={{ '--seal-color': themes[result.theme].color } as CSSProperties}>
              <div className={styles.stamp} aria-hidden="true">
                <span>{themes[result.theme].symbol}</span>
              </div>
              <p className={styles.kicker}>{themes[result.theme].name}의 씰</p>
              <h1 ref={resultTitle} tabIndex={-1}>{result.name}</h1>
              <p className={styles.message}>{result.lines[0]}<br />{result.lines[1]}</p>
              <div className={styles.actions}>
                <button className={styles.primary} type="button" onClick={() => void shareSeal(result)}>친구에게 보내기 ↗</button>
                <button className={styles.secondary} type="button" onClick={reset}>나도 뽑기</button>
              </div>
            </div>
          ) : (
            <>
              <p className={styles.kicker}>CHRISTMAS SEALS</p>
              <h1>오늘 당신에게<br />필요한 <em>한마디.</em></h1>
              <p className={styles.description}>마음에 드는 트리 장식을 열어보세요.<br />그 안에 작은 행운이 숨어 있어요.</p>
              <div className={styles.choice}>
                <p id="theme-label">지금 어떤 말이 필요해요?</p>
                <div className={styles.themes} role="group" aria-labelledby="theme-label">
                  {themeKeys.map((key, index) => (
                    <button key={key} ref={index === 0 ? firstTheme : undefined} type="button"
                      className={styles.theme} aria-pressed={theme === key} disabled={opening !== null}
                      onClick={() => {
                        setTheme(key);
                        setNotice('');
                      }}>
                      <span aria-hidden="true">{themes[key].symbol}</span>{themes[key].name}
                    </button>
                  ))}
                </div>
                <button className={styles.jump} type="button" disabled={!theme || opening !== null} onClick={() => {
                  tree.current?.scrollIntoView({ block: 'center' });
                  tree.current?.querySelector('button')?.focus({ preventScroll: true });
                }}>트리에서 장식 고르기 <span aria-hidden="true">↓</span></button>
              </div>
            </>
          )}
          <p className={styles.notice} role="status">
            {notice.startsWith('https:') || notice.startsWith('http:') ? <input aria-label="공유 링크" readOnly value={notice} onFocus={(event) => event.currentTarget.select()} /> : notice}
          </p>
        </section>

        <section ref={tree} className={styles.tree} aria-label="크리스마스 트리" aria-busy={opening !== null}>
          <img className={styles.treeImage} src={import.meta.env.BASE_URL + 'images/winter-tree.webp'} alt="" width="768" height="960" fetchPriority="high" />
          <div className={styles.glow} aria-hidden="true" />
          {!result && ornaments.map(({ x, y, color }, index) => (
            <button key={index} className={styles.ornament} data-color={color}
              data-opening={opening === index} type="button" aria-label={`${index + 1}번째 트리 장식 열기`}
              disabled={opening !== null} style={{ left: x + '%', top: y + '%' }}
              onClick={() => openOrnament(index)}><span /></button>
          ))}
          <p className={styles.treeLabel}>
            <span aria-hidden="true">✧</span>
            {result ? '당신에게 닿은 작은 행운' : '마음에 드는 장식을 하나 골라보세요'}
            <span aria-hidden="true">✧</span>
          </p>
        </section>
      </main>
      <footer className={styles.footer}><span>겨울의 행운</span><span>CHRISTMAS 2026</span></footer>
    </div>
  );
}
