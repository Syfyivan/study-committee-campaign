// Replace these two values with the candidate's real information.
const profile = { name: '宋一凡', className: '' };
document.querySelectorAll('[data-profile]').forEach(el => {
  const key = el.dataset.profile;
  if (profile[key]) el.textContent = `${key === 'name' ? '竞选人' : '班级'}：${profile[key]}`;
});
const slides = [...document.querySelectorAll('.slide')];
const dots = document.querySelector('#dots');
let current = 0;
slides.forEach((slide, i) => {
  const button = document.createElement('button');
  button.setAttribute('aria-label', `第 ${i + 1} 页：${slide.querySelector('h1,h2').textContent}`);
  button.addEventListener('click', () => go(i));
  dots.append(button);
});
function go(index, updateHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, index));
  slides.forEach((slide, i) => { slide.classList.toggle('active', i === current); slide.setAttribute('aria-hidden', String(i !== current)); });
  [...dots.children].forEach((dot, i) => dot.setAttribute('aria-current', String(i === current)));
  document.querySelector('#counter').textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  document.querySelector('#progress').style.width = `${(current + 1) / slides.length * 100}%`;
  document.querySelector('#prev').disabled = current === 0;
  document.querySelector('#next').disabled = current === slides.length - 1;
  if (updateHash) history.replaceState(null, '', `#${current + 1}`);
  window.scrollTo(0, 0);
}
function fromHash() { const n = Number(location.hash.slice(1)); go(Number.isInteger(n) && n > 0 ? n - 1 : 0, false); }
async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { document.querySelector('#fullscreen').textContent = '请使用浏览器全屏'; }
}
document.querySelector('#prev').addEventListener('click', () => go(current - 1));
document.querySelector('#next').addEventListener('click', () => go(current + 1));
document.querySelector('#fullscreen').addEventListener('click', fullscreen);
document.addEventListener('fullscreenchange', () => { document.querySelector('#fullscreen').textContent = document.fullscreenElement ? '退出全屏 ↙' : '全屏 ↗'; });
document.addEventListener('keydown', event => {
  if (event.target.closest('input,textarea,select,[contenteditable="true"]') || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.target.closest('button,a') && [' ', 'Enter'].includes(event.key)) return;
  if (['ArrowRight', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); go(current + 1); }
  if (['ArrowLeft', 'PageUp'].includes(event.key)) { event.preventDefault(); go(current - 1); }
  if (event.key === 'Home') { event.preventDefault(); go(0); }
  if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
  if (event.key.toLowerCase() === 'f') fullscreen();
});
let touchStart = null;
document.querySelector('#deck').addEventListener('touchstart', event => { const t = event.changedTouches[0]; touchStart = [t.clientX, t.clientY]; }, { passive: true });
document.querySelector('#deck').addEventListener('touchend', event => {
  if (!touchStart) return;
  const t = event.changedTouches[0], dx = t.clientX - touchStart[0], dy = t.clientY - touchStart[1];
  if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
window.addEventListener('hashchange', fromHash);
fromHash();

