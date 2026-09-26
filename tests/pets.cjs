// Speech tests use an explicit browser API mock; they do not verify audible output.
// Reuse the locally installed Playwright module, as in verify.cjs.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const base = process.env.BASE_URL || 'http://127.0.0.1:8086/';
const themes = { clean: '小蓝', playful: '贴贴', midnight: '小芯', valley: '啾啾', forest: '小栗', ocean: '泡泡', lunar: '月月' };
const viewports = [[1366,768], [1280,720], [1920,1080], [800,600], [600,700],
  [768,1024], [390,844], [360,640], [320,568]];

function urlFor(theme = 'clean', chapter = 1) {
  const url = new URL(base);
  url.searchParams.set('theme', theme);
  url.hash = String(chapter);
  return url.href;
}

async function settle(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
}

async function installSpeechMock(page) {
  await page.addInitScript(() => {
    const records = [];
    const calls = [];
    class MockUtterance {
      constructor(text) { this.text = text; this.onstart = this.onend = this.onerror = null; }
    }
    const chineseVoice = { name: 'Test Chinese voice', lang: 'zh-CN', localService: true };
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: MockUtterance });
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => [chineseVoice],
        cancel: () => calls.push({ type: 'cancel' }),
        speak: utterance => {
          // Capture the old callbacks even if production clears utterance.onend:
          // this models an already-queued browser event arriving after cancel().
          const record = { utterance, start: utterance.onstart, end: utterance.onend, error: utterance.onerror };
          records.push(record);
          calls.push({ type: 'speak', index: records.length - 1, text: utterance.text });
          record.start?.({ type: 'start', target: utterance });
        },
      },
    });
    window.__speechMock = {
      calls,
      records,
      emit(index, kind) { records[index][kind]?.({ type: kind, error: 'synthesis-failed', target: records[index].utterance }); },
    };
  });
}

async function speechState(page) {
  return page.evaluate(() => ({
    calls: window.__speechMock.calls,
    spoken: window.__speechMock.records.map(({ utterance }) => ({ text: utterance.text, lang: utterance.lang, voice: utterance.voice?.lang })),
    status: document.querySelector('#pet-status').textContent,
    state: document.querySelector('#pet').dataset.state,
    chapter: document.querySelector('#pet').dataset.chapter,
    voice: document.querySelector('#pet-voice').getAttribute('aria-pressed'),
  }));
}

async function chooseTheme(page, theme) {
  await page.locator('#theme-toggle').click();
  await page.locator(`[data-theme-choice="${theme}"]`).click();
  await page.waitForFunction(theme => document.querySelector('#pet').dataset.pet === theme, theme);
  await settle(page);
}

async function assertNoPetMotion(page, label) {
  const running = await page.locator('#pet').evaluate(pet => pet.getAnimations({ subtree: true })
    .filter(animation => animation.playState === 'running').map(animation => animation.animationName || 'unnamed'));
  assert.deepEqual(running, [], label);
}

async function petLayoutProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const pet = document.querySelector('#pet');
    const bubble = document.querySelector('.pet-bubble');
    const pageArea = document.querySelector('.pages').getBoundingClientRect();
    const viewport = { left: 0, top: 0, right: innerWidth, bottom: innerHeight };
    const within = (r, bounds) => r.left >= bounds.left - 2 && r.right <= bounds.right + 2 &&
      r.top >= bounds.top - 2 && r.bottom <= bounds.bottom + 2;
    const overlaps = (a, b) => Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2;
    for (const element of [pet, bubble, ...pet.querySelectorAll('button')]) {
      const r = element.getBoundingClientRect();
      const label = element.id || element.className;
      if (!within(r, viewport)) problems.push(`${label} outside viewport`);
      if (overlaps(r, pageArea)) problems.push(`${label} overlaps the slide content area`);
      // The atlas includes transparent padding beyond its clickable avatar.
      // Test the avatar's actual position/hit target, not that padding's scroll box.
      if (element.id !== 'pet-replay' && (element.scrollWidth > element.clientWidth + 2 || element.scrollHeight > element.clientHeight + 2)) {
        problems.push(`${label} content overflows its box`);
      }
      if (element.matches('button') && !element.disabled) {
        const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (!hit || !element.contains(hit)) problems.push(`${label} is covered`);
      }
    }
    const bounds = bubble.getBoundingClientRect();
    const walker = document.createTreeWalker(bubble, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (!r.width || !r.height) continue;
        if (!within(r, bounds) || !within(r, viewport)) problems.push(`bubble text outside bounds: ${node.textContent.trim()}`);
      }
    }
    return [...new Set(problems)];
  });
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await installSpeechMock(page);
    await page.goto(urlFor());
    await settle(page);
    assert.equal(await page.locator('#pet-voice').getAttribute('aria-pressed'), 'false', 'sound is opt-in');
    assert.equal((await speechState(page)).spoken.length, 0, 'no speech on initial load');

    const narration = [];
    for (let number = 1; number <= 5; number++) {
      await page.locator('#dots button').nth(number - 1).click();
      assert.equal(await page.locator('#pet').getAttribute('data-chapter'), String(number));
      assert.equal(await page.locator('#pet-chapter').textContent(), await page.locator('.slide.active').getAttribute('data-chapter'));
      const text = await page.locator('#pet-text').textContent();
      assert.ok(text.trim().length > 10, `chapter ${number} has explanatory text`);
      narration.push(text);
      await page.locator('#pet-replay').click();
      assert.equal(await page.locator('#pet').getAttribute('data-chapter'), String(number), 'replay does not navigate');
      assert.equal(new URL(page.url()).hash, `#${number}`);
      assert.equal(await page.locator('#pet-text').textContent(), text);
      assert.equal((await speechState(page)).spoken.length, 0, 'muted replay stays silent');
    }
    assert.equal(new Set(narration).size, 5, 'each slide has distinct narration');
    for (const [theme, name] of Object.entries(themes)) {
      await chooseTheme(page, theme);
      assert.equal(await page.locator('#pet-name').textContent(), name);
      const sprite = await page.locator('.pet-sprite').evaluate(el => getComputedStyle(el).backgroundImage);
      assert.ok(sprite.includes(`/assets/pets/${theme}.png`), `${theme} uses its own sprite image`);
      await page.locator('.pet-sprite').evaluate(async element => {
        const image = new Image();
        image.src = getComputedStyle(element).backgroundImage.match(/url\(["']?(.*?)["']?\)/)[1];
        await image.decode();
        if (image.naturalWidth < 1000 || image.naturalWidth !== image.naturalHeight) throw new Error('Invalid pet sheet');
      });
      assert.equal(await page.locator('#pet-text').textContent(), narration[4], 'appearance preserves narration');
    }

    await page.locator('#dots button').first().click();
    await page.locator('#pet-voice').click();
    let state = await speechState(page);
    assert.equal(state.voice, 'true');
    assert.equal(state.spoken.length, 1, 'opting in starts one utterance');
    assert.deepEqual(state.spoken[0], { text: narration[0], lang: 'zh-CN', voice: 'zh-CN' });
    assert.match(state.status, /正在讲解/);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    state = await speechState(page);
    assert.deepEqual(state.calls.map(call => call.type), ['speak', 'cancel', 'speak', 'cancel', 'speak'], 'quick navigation cancels old speech before starting each new page');
    assert.equal(state.spoken.at(-1).text, narration[2]);
    const beforeStaleCallbacks = state;
    await page.evaluate(() => {
      window.__speechMock.emit(0, 'end');
      window.__speechMock.emit(1, 'error');
    });
    assert.deepEqual(await speechState(page), beforeStaleCallbacks, 'stale end/error cannot silence or alter the current explanation');

    // Appearance-only events must not cancel/restart the current utterance.
    // Dispatch through the actual picker, including its dialog lifecycle.
    const callsBeforeTheme = (await speechState(page)).calls;
    await chooseTheme(page, 'playful');
    assert.deepEqual((await speechState(page)).calls, callsBeforeTheme, 'theme switching preserves speech');
    await page.locator('#pet-voice').click();
    state = await speechState(page);
    assert.equal(state.voice, 'false');
    assert.equal(state.calls.at(-1).type, 'cancel', 'mute cancels active speech');
    const afterMute = state;
    await page.evaluate(() => window.__speechMock.emit(2, 'error'));
    assert.deepEqual(await speechState(page), afterMute, 'cancelled utterance error cannot change muted state');
    await page.locator('#pet-voice').click();
    assert.equal((await speechState(page)).voice, 'true');
    await page.reload();
    await settle(page);
    state = await speechState(page);
    assert.equal(state.voice, 'false', 'refresh never persists sound opt-in');
    assert.equal(state.spoken.length, 0, 'refresh does not speak automatically');

    await page.locator('#pet-voice').click();
    await page.evaluate(() => window.__speechMock.emit(0, 'error'));
    assert.equal(await page.locator('#pet-voice').getAttribute('aria-pressed'), 'false');
    assert.match(await page.locator('#pet-status').textContent(), /语音暂不可用/);
    assert.equal(await page.locator('#pet-text').textContent(), narration[2], 'speech failure retains current text');
    await page.locator('#pet-replay').click();
    assert.equal((await speechState(page)).spoken.length, 1, 'text replay after failure remains usable without another speech request');

    // A browser without speech APIs still provides all five text explanations.
    const noSpeech = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    await noSpeech.addInitScript(() => {
      Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: undefined });
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: undefined });
    });
    noSpeech.on('pageerror', error => errors.push(error.message));
    await noSpeech.goto(urlFor());
    await settle(noSpeech);
    assert.equal(await noSpeech.locator('#pet-voice').isDisabled(), true);
    assert.match(await noSpeech.locator('#pet-voice').textContent(), /文字讲解/);
    for (let number = 1; number <= 5; number++) {
      await noSpeech.locator('#dots button').nth(number - 1).click();
      assert.equal(await noSpeech.locator('#pet-text').textContent(), narration[number - 1]);
      await noSpeech.locator('#pet-replay').click();
      assert.equal(await noSpeech.locator('#pet').getAttribute('data-chapter'), String(number));
    }
    await noSpeech.close();
    console.log('PASS: five narration states, seven sprite identities, replay, and mocked speech opt-in/cancellation/stale callbacks/theme continuity/error fallback/default mute. No real audio was tested.');

    await assertNoPetMotion(page, 'system reduced motion disables all companion animations');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.waitForFunction(() => document.querySelector('#motion').getAttribute('aria-pressed') === 'true');
    await page.locator('#pet-replay').click();
    assert.ok(await page.locator('#pet').evaluate(pet => pet.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')), 'motion-enabled replay animates the pet');
    await page.locator('#motion').click();
    await assertNoPetMotion(page, 'presentation pause disables all companion animations');
    await page.locator('#pet-replay').click();
    await assertNoPetMotion(page, 'replay respects paused motion');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settle(page);
    await assertNoPetMotion(page, 'reduced motion remains disabled after interaction');

    // New artwork and the rabbit's pose-alignment animation obey both controls.
    await page.locator('#dots button').first().click();
    for (const theme of ['forest', 'ocean', 'lunar']) {
      await chooseTheme(page, theme);
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      if (await page.locator('#motion').getAttribute('aria-pressed') === 'false') await page.locator('#motion').click();
      await page.locator('#pet-replay').click();
      await settle(page);
      assert.equal(await page.locator('.slide.active .theme-art').evaluate(element => element.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')), true, `${theme} artwork animates`);
      await page.locator('#motion').click();
      await assertNoPetMotion(page, `${theme} companion respects pause`);
      assert.equal(await page.locator('.slide.active .theme-art').evaluate(element => element.getAnimations({ subtree: true }).some(animation => animation.playState === 'running')), false, `${theme} artwork respects pause`);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await assertNoPetMotion(page, `${theme} companion respects reduced motion`);
    }

    const failures = [];
    for (const theme of Object.keys(themes)) {
      await page.goto(urlFor(theme));
      await settle(page);
      for (const [width, height] of viewports) {
        await page.setViewportSize({ width, height });
        await settle(page);
        for (let number = 1; number <= 5; number++) {
          await page.locator('#dots button').nth(number - 1).click();
          await settle(page);
          const problems = await petLayoutProblems(page);
          if (problems.length) failures.push({ theme, viewport: `${width}x${height}`, chapter: number, problems });
        }
      }
    }
    assert.deepEqual(failures, [], 'pet/bubble text and buttons fit without covering slide content');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('#pet').isVisible(), false, 'printed slides hide the companion');
    assert.deepEqual(errors, [], 'no runtime or HTTP errors');
    console.log('PASS: pet animation controls, print hiding, and seven themes x nine viewports x five chapters companion bounds.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
