// 和紙モチーフの手ざわりギミック
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== 袋とじ：ミシン目を指でなぞって開ける =====
// 使い方：<div class="fukuro" data-label="ひらいて読む"> 中身 </div>
document.querySelectorAll('.fukuro').forEach(box => {
  const seal = document.createElement('div');
  seal.className = 'fk-seal';
  seal.innerHTML = `
    <div class="fk-flap"><div class="fk-face">
      <span class="fk-label">${box.dataset.label || '袋とじ'}</span>
      <span class="fk-hint">点線を指でなぞって ひらく →</span>
    </div></div>
    <div class="fk-perf"><span class="fk-cut"></span></div>
    <button type="button" class="fk-open">ひらく</button>`;
  box.appendChild(seal);
  const cut = seal.querySelector('.fk-cut');
  const perf = seal.querySelector('.fk-perf');
  let startX = null, maxX = 0;

  const open = () => {
    box.classList.add('opened');
    setTimeout(() => seal.remove(), 900);
  };
  const progress = x => {
    const r = perf.getBoundingClientRect();
    maxX = Math.max(maxX, Math.min(1, (x - r.left) / r.width));
    cut.style.width = (maxX * 100) + '%';
    if (maxX > .92) open();
  };

  seal.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return;
    const r = perf.getBoundingClientRect();
    // ミシン目の近く（上下 40px）から始めたときだけ反応
    if (Math.abs(e.clientY - (r.top + r.height / 2)) > 40) return;
    startX = e.clientX;
    seal.setPointerCapture(e.pointerId);
    progress(e.clientX);
  });
  seal.addEventListener('pointermove', e => { if (startX !== null) progress(e.clientX); });
  const stop = () => {
    if (startX === null) return;
    startX = null;
    if (!box.classList.contains('opened')) {
      maxX = 0; cut.style.width = '0';
    }
  };
  seal.addEventListener('pointerup', stop);
  seal.addEventListener('pointercancel', stop);
  seal.querySelector('.fk-open').addEventListener('click', open);
  if (reduceMotion) seal.querySelector('.fk-open').textContent = 'ひらく';
});

// ===== スクロールバー：和紙のロール =====
(function washiRoll() {
  const bar = document.createElement('div');
  bar.className = 'roll-bar';
  bar.setAttribute('aria-hidden', 'true');
  bar.innerHTML = '<div class="roll-sheet"></div><div class="roll-core"><span></span></div>';
  document.body.appendChild(bar);
  document.documentElement.classList.add('has-roll');
  const sheet = bar.querySelector('.roll-sheet');
  const core = bar.querySelector('.roll-core');

  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    const track = bar.clientHeight;
    const y = p * (track - 34);
    sheet.style.height = (y + 17) + 'px';                 // ほどけた和紙
    core.style.transform = `translateY(${y}px)`;          // ロールが下へ転がる
    core.style.setProperty('--d', (30 - p * 14) + 'px');  // 紙がほどけるほど細くなる
    core.style.setProperty('--spin', (scrollY * .6) + 'deg');
  };
  addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  // ロールをつかんで引っぱるとスクロール
  let dragging = false;
  const toScroll = clientY => {
    const r = bar.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientY - r.top - 17) / (r.height - 34)));
    scrollTo({ top: p * (document.documentElement.scrollHeight - innerHeight), behavior: 'instant' });
  };
  bar.addEventListener('pointerdown', e => { dragging = true; bar.setPointerCapture(e.pointerId); bar.classList.add('grab'); toScroll(e.clientY); });
  bar.addEventListener('pointermove', e => { if (dragging) toScroll(e.clientY); });
  bar.addEventListener('pointerup', () => { dragging = false; bar.classList.remove('grab'); });
})();

// ===== 左上のセクション名（いまどこを読んでいるか） =====
(function sectionLabel() {
  const label = document.querySelector('.ed-section-label');
  if (!label) return;
  // data-label がない節は、見出しの英字（.en）から自動で名前をつける
  document.querySelectorAll('main section:not([data-label])').forEach(s => {
    const en = s.querySelector('.en');
    if (en) s.dataset.label = en.textContent.trim();
  });
  const secs = document.querySelectorAll('main section[data-label]');
  if (!secs.length) return;
  const io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) label.textContent = e.target.dataset.label; });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(s => io.observe(s));
})();
