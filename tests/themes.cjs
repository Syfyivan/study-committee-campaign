// Use the same existing Playwright installation as verify.cjs; no new dependency.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.BASE_URL || 'http://127.0.0.1:8086/';
const output = process.env.SCREENSHOT_DIR;
const themes = ['clean', 'playful', 'midnight', 'valley', 'forest', 'ocean', 'lunar'];
const viewports = [[1366, 768], [1280, 720], [1920, 1080], [800, 600],
  [600, 700], [768, 1024], [390, 844], [360, 640], [320, 568]];

function urlFor(theme, slide = 4) {
  const url = new URL(base);
  url.searchParams.delete('theme');
  url.searchParams.set('campaign-check', 'kept');
  if (theme !== undefined) url.searchParams.set('theme', theme);
  url.hash = String(slide);
  return url.href;
}

const otherQuery = [...new URL(urlFor()).searchParams];

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
  });
}

async function assertTheme(page, expected) {
  await page.waitForFunction(theme => document.body.dataset.theme === theme, expected);
  const choices = await page.locator('#theme-dialog button[data-theme-choice]').evaluateAll(buttons =>
    buttons.map(button => [button.dataset.themeChoice, button.getAttribute('aria-pressed')]));
  assert.deepEqual(choices.map(([theme]) => theme).sort(), [...themes].sort(), 'exactly seven theme choices');
  assert.deepEqual(choices.filter(([, pressed]) => pressed === 'true').map(([theme]) => theme), [expected],
    `only ${expected} has aria-pressed=true`);
  assert.ok(choices.every(([theme, pressed]) => pressed === String(theme === expected)), 'explicit pressed states');
}

async function assertSlide(page, number) {
  assert.equal(await page.locator('.slide.active').count(), 1, 'one active slide');
  assert.equal(await page.locator('.slide').nth(number - 1).getAttribute('aria-hidden'), 'false');
  assert.equal(await page.locator('#counter').textContent(), `${String(number).padStart(2, '0')} / 05`);
  assert.equal(new URL(page.url()).hash, `#${number}`, 'slide hash is preserved');
}

async function assertClosed(page) {
  await page.locator('#theme-dialog').waitFor({ state: 'hidden' });
  assert.equal(await page.locator('#theme-dialog').evaluate(dialog => dialog.open), false);
  assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('#theme-toggle')), true,
    'closing the picker returns focus to its trigger');
}

async function openPicker(page) {
  await page.locator('#theme-toggle').click();
  await page.locator('#theme-dialog').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#theme-dialog').evaluate(dialog => dialog instanceof HTMLDialogElement && dialog.open), true,
    'theme picker is an open native dialog');
  assert.equal(await page.locator('#theme-dialog').evaluate(dialog => dialog.contains(document.activeElement)), true,
    'opening the dialog moves keyboard focus inside');
  await settle(page);
}

async function chooseTheme(page, theme, keyboard = false) {
  await openPicker(page);
  const choice = page.locator(`#theme-dialog button[data-theme-choice="${theme}"]`);
  if (keyboard) {
    await choice.focus();
    await page.keyboard.press('Enter');
  } else {
    await choice.click();
  }
  await assertTheme(page, theme);
  await assertClosed(page);
  await settle(page);
}

// Check rendered rectangles and text runs as well as scroll dimensions: hiding
// overflow alone must not make clipped content pass the viewport checks.
async function layoutProblems(page, picker = false, choiceKey = null) {
  return page.evaluate(({ pickerOpen, choiceKey }) => {
    const problems = [];
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const label = element => element.id ? `#${element.id}` :
      `${element.tagName.toLowerCase()}.${[...element.classList].join('.')}`;
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const inside = (rect, bounds) => rect.left >= bounds.left - 2 && rect.top >= bounds.top - 2 &&
      rect.right <= bounds.right + 2 && rect.bottom <= bounds.bottom + 2;
    const overflow = (element, mustFit = false) => {
      const style = getComputedStyle(element);
      const clips = value => ['hidden', 'clip', 'scroll', 'auto'].includes(value);
      // Visible glyph overhang and rotated decoration need not fit their own
      // line boxes. Their actual rendered bounds are checked separately below.
      if (((mustFit || clips(style.overflowX)) && element.scrollWidth > element.clientWidth + 1) ||
          ((mustFit || clips(style.overflowY)) && element.scrollHeight > element.clientHeight + 1)) {
        problems.push(`${label(element)} scroll ${element.scrollWidth}x${element.scrollHeight} > client ${element.clientWidth}x${element.clientHeight}`);
      }
    };
    for (const element of [document.documentElement, document.body]) {
      if (element.scrollWidth > innerWidth + 1 || element.scrollHeight > innerHeight + 1) {
        problems.push(`${label(element)} exceeds viewport: ${element.scrollWidth}x${element.scrollHeight}`);
      }
    }
    const slide = document.querySelector('.slide.active');
    const root = pickerOpen ? document.querySelector('#theme-dialog') : slide;
    const rootBounds = root.getBoundingClientRect();
    const interfaceSelector = pickerOpen ? `#theme-dialog,#theme-close,[data-theme-choice="${choiceKey}"]` :
      '.topbar,.journal,.pages,.controls,.tools button,.controls button';
    for (const element of document.querySelectorAll(interfaceSelector)) {
      if (!visible(element)) continue;
      const rect = element.getBoundingClientRect();
      if (!inside(rect, viewport)) problems.push(`${label(element)} outside viewport`);
      if (pickerOpen && !inside(rect, rootBounds)) problems.push(`${label(element)} outside dialog`);
      // .pages also contains inactive, previously sized slide-stage wrappers.
      // Their unscaled layout boxes can inflate its scroll metrics; the active
      // slide and rendered text below are the content that must actually fit.
      if (!element.matches('.pages')) overflow(element, element.matches('button,.controls'));
      if (element.matches('button') && !element.disabled) {
        const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
        if (!hit || !element.contains(hit)) problems.push(`${label(element)} is covered at its center`);
      }
    }
    if (!inside(rootBounds, viewport)) problems.push(`${label(root)} outside viewport`);
    if (!pickerOpen && !inside(rootBounds, document.querySelector('.pages').getBoundingClientRect())) {
      problems.push('active slide outside its page area');
    }
    overflow(root, true);
    const contentSelector = 'h1,h2,h3,p,.page-note,.candidate,.candidate-seal,.class-name,.vote,.cover-footer,.thanks-seal,.quest,.trait,.action-card';
    for (const element of root.querySelectorAll(contentSelector)) {
      if (!visible(element)) continue;
      if (!inside(element.getBoundingClientRect(), rootBounds)) problems.push(`${label(element)} outside content area`);
      overflow(element);
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let text;
    while ((text = walker.nextNode())) {
      if (!text.textContent.trim() || !visible(text.parentElement)) continue;
      // The gallery intentionally scrolls; inspect the card scrolled into view,
      // and always inspect the fixed dialog heading, close button and footer.
      const option = text.parentElement.closest('[data-theme-choice]');
      if (pickerOpen && option && option.dataset.themeChoice !== choiceKey) continue;
      const range = document.createRange();
      range.selectNodeContents(text);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        const excerpt = text.textContent.trim().slice(0, 24);
        if (!inside(rect, rootBounds) || !inside(rect, viewport)) problems.push(`text outside content area: ${excerpt}`);
        for (let parent = text.parentElement; parent && root.contains(parent); parent = parent.parentElement) {
          const style = getComputedStyle(parent);
          const clipsX = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowX);
          const clipsY = ['hidden', 'clip', 'scroll', 'auto'].includes(style.overflowY);
          const bounds = parent.getBoundingClientRect();
          if ((clipsX && (rect.left < bounds.left - 2 || rect.right > bounds.right + 2)) ||
              (clipsY && (rect.top < bounds.top - 2 || rect.bottom > bounds.bottom + 2))) {
            problems.push(`text clipped by ${label(parent)}: ${excerpt}`);
            break;
          }
        }
      }
    }
    return [...new Set(problems)];
  }, { pickerOpen: picker, choiceKey });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    if (output) fs.mkdirSync(output, { recursive: true });

    await page.goto(urlFor(undefined, 1));
    await settle(page);
    await assertTheme(page, 'clean');
    assert.equal(await page.locator('.slide').count(), 5);
    assert.equal(await page.locator('#theme-dialog').isVisible(), false);
    await page.locator('#dots button').nth(3).click();
    await assertSlide(page, 4);

    await openPicker(page);
    await page.locator('[data-theme-choice="clean"]').focus();
    await page.keyboard.press('Tab');
    assert.equal(await page.locator('#theme-dialog').evaluate(dialog => dialog.contains(document.activeElement)), true);
    await page.keyboard.press('Shift+Tab');
    for (const key of ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp']) {
      await page.keyboard.press(key);
      await assertSlide(page, 4);
    }
    await page.keyboard.press('Escape');
    await assertClosed(page);
    await assertSlide(page, 4);
    await openPicker(page);
    await page.locator('#theme-close').click();
    await assertClosed(page);

    for (const theme of themes) {
      await chooseTheme(page, theme, theme === 'playful');
      await assertSlide(page, 4);
      const url = new URL(page.url());
      assert.equal(url.searchParams.get('theme'), theme, 'selected theme is shareable in the URL');
      assert.deepEqual([...url.searchParams].filter(([name]) => name !== 'theme'), otherQuery, 'unrelated query parameters survive');
      assert.equal(await page.evaluate(() => localStorage.getItem('campaign-theme')), theme, 'selection is remembered');
    }
    await page.reload();
    await settle(page);
    await assertTheme(page, 'lunar');
    await assertSlide(page, 4);
    await page.goto(urlFor());
    await settle(page);
    await assertTheme(page, 'lunar');
    await assertSlide(page, 4);
    await page.goto(urlFor('midnight'));
    await settle(page);
    await assertTheme(page, 'midnight');
    await assertSlide(page, 4);

    // Invalid storage is setup data, not an alternate path for changing themes.
    await page.evaluate(() => localStorage.setItem('campaign-theme', 'playful'));
    for (const invalid of ['unknown', '__proto__', 'constructor']) {
      await page.goto(urlFor(invalid));
      await settle(page);
      await assertTheme(page, 'playful');
      await assertSlide(page, 4);
    }
    await page.evaluate(() => localStorage.setItem('campaign-theme', 'invalid-stored-theme'));
    await page.goto(urlFor('unknown'));
    await settle(page);
    await assertTheme(page, 'clean');
    await page.evaluate(() => localStorage.removeItem('campaign-theme'));
    await page.goto(urlFor('unknown'));
    await settle(page);
    await assertTheme(page, 'clean');
    console.log('PASS: default, all theme selections, URL/hash preservation, storage, URL priority, invalid values, native dialog focus/keyboard/close.');

    await page.locator('#fullscreen').click();
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true);
    await chooseTheme(page, 'midnight');
    await assertSlide(page, 4);
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true, 'switching styles keeps fullscreen');
    await openPicker(page);
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), true, 'presentation shortcuts stay inactive in the picker');
    await page.locator('#theme-close').click();
    await page.keyboard.press('f');
    assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), false);
    console.log('PASS: fullscreen theme switching and dialog shortcut isolation.');

    const failures = [];
    for (const theme of themes) {
      await page.goto(urlFor(theme, 1));
      await settle(page);
      await assertTheme(page, theme);
      if (['forest', 'ocean', 'lunar'].includes(theme)) {
        const artwork = await page.locator('.slide.active .theme-art').evaluate(async element => {
          const source = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
          const image = new Image(); image.src = source;
          await image.decode();
          return { source, width: image.naturalWidth, height: image.naturalHeight };
        });
        assert.ok(artwork.source.endsWith(`/assets/themes/${theme}.png`));
        assert.ok(artwork.width > 500 && artwork.height > 500, 'illustrated artwork decodes');
      }
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height });
        await settle(page);
        await page.keyboard.press('Home');
        for (let number = 1; number <= 5; number++) {
          await settle(page);
          await assertSlide(page, number);
          const problems = await layoutProblems(page);
          if (problems.length) failures.push({ theme, viewport: `${width}x${height}`, slide: number, problems });
          const screenshot = (width === 1366 && [1, 3, 4, 5].includes(number)) ||
            (width === 390 && [1, 4].includes(number));
          if (output && screenshot) await page.screenshot({ path: path.join(output, `theme-${theme}-${width}-${number}.png`), fullPage: true });
          if (number < 5) await page.keyboard.press('ArrowRight');
        }
      }
      // All seven cards must be reachable in the small-screen gallery while
      // its close button and status stay in the viewport.
      await page.locator('#dots button').nth(3).click();
      await openPicker(page);
      for (const choice of themes) {
        await page.locator(`[data-theme-choice="${choice}"]`).scrollIntoViewIfNeeded();
        const pickerProblems = await layoutProblems(page, true, choice);
        if (pickerProblems.length) failures.push({ theme, viewport: '320x568', picker: choice, problems: pickerProblems });
      }
      if (output) await page.screenshot({ path: path.join(output, `theme-${theme}-320-picker.png`), fullPage: true });
      await page.locator(`[data-theme-choice="${theme}"]`).click();
      await assertClosed(page);
      await assertTheme(page, theme);
      await assertSlide(page, 4);
      console.log(`Checked ${theme}: nine viewports, five slides, and the 320px picker.`);
    }
    assert.deepEqual(failures, [], 'theme layout failures (real text/control bounds and scroll dimensions)');
    assert.deepEqual(errors, [], 'runtime or HTTP errors');
    console.log('PASS: seven themes x nine viewports x five slides; illustrations decoded; no page scrolling, clipped text, off-screen or covered controls; all seven gallery cards reachable.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
