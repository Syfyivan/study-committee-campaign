(() => {
  const pet = document.querySelector('#pet');
  const text = document.querySelector('#pet-text');
  const status = document.querySelector('#pet-status');
  const replay = document.querySelector('#pet-replay');
  const voiceButton = document.querySelector('#pet-voice');
  const pets = {
    clean: { name: '小蓝', animal: '蓝白小海豹' },
    playful: { name: '贴贴', animal: '贴纸小猫' },
    midnight: { name: '小芯', animal: '发光机器人' },
    valley: { name: '啾啾', animal: '像素小鸡' },
  };
  const narration = [
    '这是宋如一的学习委员竞选。接下来，聊聊竞选理由和工作打算。',
    '想帮大家理清通知、向老师问清问题，也借这个机会锻炼自己。',
    '不确定就先问，答应的事继续跟进。做得不合适，欢迎直接提醒。',
    '先把通知和资料整理好，再帮忙问清疑问。复习讨论，自愿参加。',
    '介绍到这里啦！如果你认可这些想法，请支持宋如一。谢谢大家！',
  ];
  const synth = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window ? window.speechSynthesis : null;
  let chapter = 0;
  let voiceEnabled = false; // Sound always starts muted, including after a reload.
  let utterance = null;
  let speechRun = 0;
  let greetingTimer;
  let idleTimer;
  let voiceTimer;

  const canMove = () => !document.hidden && !document.body.classList.contains('motion-paused');

  function stopMotion() {
    clearTimeout(greetingTimer);
    clearTimeout(idleTimer);
    pet.dataset.state = 'idle';
  }

  function animateExplanation() {
    stopMotion();
    if (!canMove()) return;
    pet.dataset.state = chapter === narration.length - 1 ? 'happy' : 'pointing';
    greetingTimer = setTimeout(() => { if (canMove()) pet.dataset.state = 'talking'; }, 650);
    idleTimer = setTimeout(() => { pet.dataset.state = 'idle'; }, Math.max(6500, narration[chapter].length * 220));
  }

  function stopSpeech() {
    speechRun++;
    clearTimeout(voiceTimer);
    if (utterance) {
      utterance.onstart = utterance.onend = utterance.onerror = null;
      utterance = null;
      synth?.cancel();
    }
  }

  function updateVoiceButton() {
    voiceButton.setAttribute('aria-pressed', String(voiceEnabled));
    voiceButton.querySelector('span').textContent = voiceEnabled ? '关声音' : '开声音';
    voiceButton.setAttribute('aria-label', voiceEnabled ? '关闭桌宠语音讲解' : '开启桌宠语音讲解');
    voiceButton.title = voiceEnabled ? '关闭声音，保留文字讲解' : '开启后，翻页会讲解当前内容';
  }

  function speechUnavailable() {
    stopSpeech();
    voiceEnabled = false;
    updateVoiceButton();
    voiceButton.querySelector('span').textContent = '暂不可用';
    voiceButton.setAttribute('aria-label', '语音暂不可用，点击重试');
    voiceButton.title = '这台设备暂时无法朗读中文，文字讲解仍可使用';
    status.textContent = '语音暂不可用，先看文字讲解吧';
    animateExplanation();
  }

  function speak() {
    if (!synth || !voiceEnabled || document.hidden) return;
    const run = ++speechRun;
    const next = new SpeechSynthesisUtterance(narration[chapter]);
    // Keep a strong reference until completion; cancel stale callbacks on a page change.
    utterance = next;
    const voices = synth.getVoices();
    next.voice = voices.find(v => /^zh[-_]CN$/i.test(v.lang) && v.localService)
      || voices.find(v => /^zh[-_]CN$/i.test(v.lang))
      || voices.find(v => /^(zh|cmn)([-_]|$)/i.test(v.lang)) || null;
    next.lang = 'zh-CN';
    next.rate = .95;
    next.pitch = 1.08;
    next.onstart = () => {
      if (run !== speechRun) return;
      clearTimeout(greetingTimer);
      clearTimeout(idleTimer);
      pet.dataset.state = canMove() ? 'talking' : 'idle';
      status.textContent = '正在讲解这一页';
    };
    next.onend = () => {
      if (run !== speechRun) return;
      clearTimeout(voiceTimer);
      utterance = null;
      stopMotion();
      status.textContent = '讲完啦，点我可以再讲一遍';
    };
    next.onerror = () => { if (run === speechRun) speechUnavailable(); };
    voiceTimer = setTimeout(() => { if (run === speechRun) speechUnavailable(); }, 25000);
    try { synth.speak(next); } catch { speechUnavailable(); }
  }

  function explain() {
    stopSpeech();
    status.textContent = voiceEnabled ? '准备讲解这一页' : '点桌宠，可以再讲一遍';
    animateExplanation();
    speak();
  }

  function updateTheme() {
    const buddy = pets[document.body.dataset.theme] || pets.clean;
    pet.dataset.pet = document.body.dataset.theme;
    document.querySelector('#pet-name').textContent = buddy.name;
    pet.setAttribute('aria-label', `${buddy.animal}${buddy.name}的本页讲解`);
    replay.setAttribute('aria-label', `让${buddy.name}再讲一遍本页`);
    // Keep the current narration and audio position when only changing appearance.
    if (utterance && canMove()) pet.dataset.state = 'talking';
    else animateExplanation();
  }

  function updateChapter() {
    const slides = [...document.querySelectorAll('.slide')];
    chapter = Math.max(0, slides.findIndex(slide => slide.classList.contains('active')));
    pet.dataset.chapter = String(chapter + 1);
    text.textContent = narration[chapter];
    document.querySelector('#pet-chapter').textContent = slides[chapter].dataset.chapter;
    explain();
  }

  replay.addEventListener('click', explain);
  voiceButton.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    updateVoiceButton();
    explain();
  });
  document.addEventListener('campaign:slide', updateChapter);
  document.addEventListener('campaign:theme', updateTheme);
  document.addEventListener('campaign:motion', () => {
    if (!canMove()) stopMotion();
    else if (utterance) pet.dataset.state = 'talking';
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopSpeech();
      stopMotion();
      status.textContent = '点我，继续讲这一页';
    }
  });
  for (const event of ['pagehide', 'beforeprint']) window.addEventListener(event, () => { stopSpeech(); stopMotion(); });
  updateTheme();
  updateChapter();
  updateVoiceButton();
  if (!synth) {
    voiceButton.disabled = true;
    voiceButton.querySelector('span').textContent = '文字讲解';
    voiceButton.title = '当前浏览器支持文字讲解，未提供语音功能';
    voiceButton.setAttribute('aria-label', voiceButton.title);
  }
})();
