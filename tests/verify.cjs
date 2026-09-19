// Use an existing Playwright installation; this project has no runtime dependencies.
// PLAYWRIGHT_MODULE can point to a locally installed Playwright module.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8086/';
const output = process.env.SCREENSHOT_DIR;
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    if (output) fs.mkdirSync(output, { recursive: true });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    assert.equal(await page.locator('.slide').count(), 7);
    assert.ok((await page.locator('body').innerText()).includes('宋如一'));
    assert.ok(!(await page.content()).includes('宋一凡'));
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('#prev').isDisabled(), true);
    for (const [width, height] of [[1366,768], [1280,720], [1920,1080], [768,1024], [390,844], [320,740]]) {
      await page.setViewportSize({ width, height });
      await page.keyboard.press('Home');
      for (let i = 1; i <= 7; i++) {
        assert.equal(await page.locator('.slide.active').count(), 1);
        assert.equal(await page.locator('#counter').textContent(), `${String(i).padStart(2, '0')} / 07`);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), true, `horizontal overflow at ${width}, slide ${i}`);
        const clipped = await page.locator('.slide.active').evaluate(slide => {
          const rect = slide.getBoundingClientRect();
          return [...slide.querySelectorAll('h1,h2,h3,p,.page-note,.promise,.trait-footer')].filter(el => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && (r.right > rect.right + 2 || r.left < rect.left - 2 || r.bottom > rect.bottom + 2);
          }).map(el => el.textContent.slice(0, 25));
        });
        assert.deepEqual(clipped, [], `clipped text at ${width}, slide ${i}`);
        if (width >= 1280) assert.equal(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 3), true, `desktop vertical overflow slide ${i} at ${width}`);
        if (output && [1366,390].includes(width)) await page.screenshot({ path: path.join(output, `${width}-${i}.png`), fullPage: true });
        await page.keyboard.press('ArrowRight');
      }
      assert.equal(await page.locator('#next').isDisabled(), true);
    }
    await page.goto(`${base}#5`);
    assert.equal(await page.locator('#counter').textContent(), '05 / 07');
    await page.locator('#dots button').first().click();
    assert.equal(await page.locator('#counter').textContent(), '01 / 07');
    await page.locator('#deck').evaluate(el => {
      const start = new Touch({ identifier: 1, target: el, clientX: 270, clientY: 200 });
      const end = new Touch({ identifier: 1, target: el, clientX: 60, clientY: 205 });
      el.dispatchEvent(new TouchEvent('touchstart', { touches: [start], changedTouches: [start] }));
      el.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [end] }));
    });
    assert.equal(await page.locator('#counter').textContent(), '02 / 07');
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    await page.locator('#lighting').click();
    assert.equal(await page.locator('body').getAttribute('data-scene'), 'night');
    await page.locator('#lighting').click();
    assert.equal(await page.locator('body').getAttribute('data-scene'), 'morning');
    for (let i = 0; i < 10; i++) { await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight'); }
    await page.keyboard.press('End');
    await page.waitForTimeout(850);
    assert.equal(await page.locator('.slide.active').count(), 1);
    assert.equal(await page.locator('.leaving').count(), 0);
    assert.equal(await page.locator('#counter').textContent(), '07 / 07');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'false');
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length), 0);
    await page.reload();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'false');
    await page.locator('#motion').click();
    assert.equal(await page.locator('#motion').getAttribute('aria-pressed'), 'true');
    await page.locator('#fullscreen').click();
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true);
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), false);
    await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
    assert.equal(await page.locator('.slide:visible').count(), 7);
    assert.deepEqual(errors, []);
    console.log('PASS: seven slides at six viewport sizes, no clipped text, name, font/assets, keyboard, touch, hashes, rapid transitions, daylight toggle, pause persistence, reduced motion, fullscreen, print visibility, no runtime/HTTP errors.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
