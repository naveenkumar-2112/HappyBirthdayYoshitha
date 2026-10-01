/* ============================================================
   BIRTHDAY JOURNEY — script.js
   Gamified birthday wishing website
   Pure HTML5 + CSS3 + Vanilla JS (ES modules)
   ============================================================ */

/* ============================================================
   CONFIG — Edit this object to personalize everything
   ============================================================ */
const CONFIG = {
  name: 'Sarah',
  nickname: 'Sar',
  age: 25,
  senderName: 'Your Best Friend',
  themeColors: {
    c1: '#ff6ec7', // pink
    c2: '#7873f5', // purple
    c3: '#ffd93d', // gold
    c4: '#6ee7b7', // mint
    c5: '#f97316', // orange
    c6: '#38bdf8', // sky
  },
  musicUrl: '', // paste a royalty-free MP3 URL here (optional)
  photos: [
    { src: 'https://images.pexels.com/photos/12616001/pexels-photo-12616001.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Sweet beginnings 🎂' },
    { src: 'https://images.pexels.com/photos/25956380/pexels-photo-25956380.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Make a wish! 🕯️' },
    { src: 'https://images.pexels.com/photos/3859921/pexels-photo-3859921.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Light it up ✨' },
    { src: 'https://images.pexels.com/photos/7600420/pexels-photo-7600420.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Party time! 🎉' },
    { src: 'https://images.pexels.com/photos/23384637/pexels-photo-23384637.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Sparkle & shine 🌟' },
    { src: 'https://images.pexels.com/photos/137485/pexels-photo-137485.jpeg?auto=compress&cs=tinysrgb&h=400&w=600', caption: 'Forever glowing 💫' },
  ],
  mainMessage: [
    `Dear ${'{name}'},`,
    `On this special day, I want you to know how incredibly much you mean to the people around you. Your laughter lights up every room, your kindness touches every heart, and your spirit inspires everyone lucky enough to call you a friend.`,
    `Another year of wonderful memories, growth, and adventures awaits. May this birthday mark the beginning of your best chapter yet — full of love, success, and dreams coming true.`,
    `Happy Birthday! 🎂🎈`,
  ],
  wishes: [
    'May this year bring you endless joy and unforgettable adventures! 🌈',
    'Wishing you love that grows deeper with every passing day! 💕',
    'May success follow you in everything you pursue! 🌟',
    'Wishing you health, peace, and boundless energy! 💪',
    'May your dreams take flight and soar higher than ever! 🚀',
    'Wishing you friendships that last a lifetime and beyond! 🤝',
  ],
  finalNote: `And so, the journey continues — but this time, with another year of wisdom, grace, and you being amazing. Never forget how loved you are. Here's to you, ${'{name}'} — today, tomorrow, and always. 💖`,
  // Per-game difficulty
  difficulty: {
    ticTacToe: { smartChance: 0.7 },
    memory: { cols: 4, rows: 3 },
    catchGifts: { target: 15, speed: 2.2, bombChance: 0.18 },
    shootBottles: { target: 6, timeLimit: 45 },
    fruitNinja: { targetScore: 120, time: 45 },
    archery: { arrows: 5, windMax: 3 },
    balloonPop: { target: 13 },
    whackGift: { target: 15, time: 30 },
    snake: { speed: 140 },
    flappyBalloon: { gap: 160 },
    slidingPuzzle: { size: 3 },
    reactionTap: { rounds: 5 },
  },
};

/* ============================================================
   UTILITIES
   ============================================================ */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const randInt = (a, b) => Math.floor(rand(a, b + 1));
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function getURLParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function applyThemeColors() {
  const root = document.documentElement;
  Object.entries(CONFIG.themeColors).forEach(([k, v]) => {
    root.style.setProperty(`--${k}`, v);
  });
}

function saveProgress(state) {
  try { localStorage.setItem('birthdayJourney', JSON.stringify(state)); } catch (e) {}
}
function loadProgress() {
  try { return JSON.parse(localStorage.getItem('birthdayJourney') || '{}'); } catch (e) { return {}; }
}
function saveSetting(key, val) {
  try {
    const s = loadProgress();
    s[key] = val;
    localStorage.setItem('birthdayJourney', JSON.stringify(s));
  } catch (e) {}
}
function getSetting(key, fallback) {
  const s = loadProgress();
  return s[key] !== undefined ? s[key] : fallback;
}

/* ============================================================
   AUDIO ENGINE — Web Audio API synthesized SFX + music
   ============================================================ */
class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.muted = false;
    this.musicEl = null;
    this.musicPlaying = false;
  }

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch (e) { /* audio not available */ }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
    saveSetting('muted', m);
  }

  // Generic tone
  tone(freq, dur, type = 'sine', vol = 0.3, attack = 0.01, release = 0.1) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + release);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + release + 0.05);
  }

  // Frequency sweep
  sweep(f1, f2, dur, type = 'sine', vol = 0.3) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(f1, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // Noise burst
  noise(dur, vol = 0.2, filterFreq = 1000) {
    if (!this.ctx || this.muted) return;
    const bufSize = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufSize);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.value = vol;
    src.connect(filter); filter.connect(gain); gain.connect(this.master);
    src.start();
  }

  // Named SFX
  click() { this.tone(800, 0.05, 'square', 0.15); }
  pop() { this.sweep(600, 200, 0.1, 'sine', 0.25); }
  win() {
    [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.15, 'triangle', 0.3), i * 80));
  }
  lose() { this.sweep(400, 100, 0.3, 'sawtooth', 0.2); }
  slice() { this.noise(0.15, 0.15, 3000); this.sweep(1200, 400, 0.1, 'sawtooth', 0.1); }
  arrow() { this.sweep(800, 200, 0.2, 'sine', 0.2); this.noise(0.1, 0.1, 2000); }
  candleBlow() { this.noise(0.4, 0.2, 800); }
  fireworks() {
    this.noise(0.1, 0.2, 2000);
    setTimeout(() => this.sweep(2000, 100, 0.3, 'sine', 0.25), 50);
  }
  levelUp() {
    [523, 659, 784, 1047, 1319].forEach((f, i) => setTimeout(() => this.tone(f, 0.12, 'triangle', 0.25), i * 60));
  }
  coin() { this.tone(988, 0.05, 'square', 0.2); setTimeout(() => this.tone(1319, 0.1, 'square', 0.2), 50); }

  // Music
  startMusic() {
    if (this.musicPlaying || !CONFIG.musicUrl) return;
    if (!this.musicEl) {
      this.musicEl = new Audio(CONFIG.musicUrl);
      this.musicEl.loop = true;
      this.musicEl.volume = 0.3;
    }
    this.musicEl.play().catch(() => {});
    this.musicPlaying = true;
  }
  stopMusic() {
    if (this.musicEl) { this.musicEl.pause(); this.musicPlaying = false; }
  }
  toggleMusic() {
    if (this.musicPlaying) this.stopMusic();
    else this.startMusic();
    return this.musicPlaying;
  }
}

const audio = new AudioEngine();

/* ============================================================
   PARTICLE ENGINE — ambient background particles
   ============================================================ */
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.running = false;
    this.lastTime = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', this._debouncedResize.bind(this));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (this._shouldRun) this.start();
    });
  }

  _debouncedResize() {
    clearTimeout(this._rt);
    this._rt = setTimeout(() => this.resize(), 200);
  }

  resize() {
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }

  start() {
    if (prefersReducedMotion) return;
    this._shouldRun = true;
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.spawn();
    this.loop();
  }

  stop() {
    this._shouldRun = false;
    this.running = false;
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  spawn() {
    const count = Math.min(window.innerWidth / 20, 40);
    const types = ['balloon', 'star', 'petal'];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.makeParticle(pick(types)));
    }
  }

  makeParticle(type) {
    const colors = [CONFIG.themeColors.c1, CONFIG.themeColors.c2, CONFIG.themeColors.c3, CONFIG.themeColors.c4];
    return {
      type,
      x: Math.random() * window.innerWidth,
      y: type === 'balloon' ? window.innerHeight + rand(0, 200) : rand(0, window.innerHeight),
      vx: rand(-0.3, 0.3),
      vy: type === 'balloon' ? rand(-0.6, -0.3) : rand(0.2, 0.6),
      size: rand(6, 16),
      color: pick(colors),
      rotation: rand(0, Math.PI * 2),
      rotSpeed: rand(-0.02, 0.02),
      opacity: rand(0.3, 0.7),
    };
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rotation += p.rotSpeed * dt;
      if (p.y < -30 || p.y > window.innerHeight + 30 || p.x < -30 || p.x > window.innerWidth + 30) {
        this.particles[i] = this.makeParticle(p.type);
        continue;
      }
      this.draw(p);
    }
    this._raf = requestAnimationFrame(this.loop.bind(this));
  }

  draw(p) {
    this.ctx.save();
    this.ctx.globalAlpha = p.opacity;
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate(p.rotation);
    if (p.type === 'balloon') {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, p.size * 0.7, p.size, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, p.size);
      this.ctx.lineTo(0, p.size + 8);
      this.ctx.stroke();
    } else if (p.type === 'star') {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? p.size : p.size * 0.4;
        this.ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      this.ctx.closePath();
      this.ctx.fill();
    } else if (p.type === 'petal') {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }
}

/* ============================================================
   CURSOR SPARKLE TRAIL (desktop only)
   ============================================================ */
class SparkleTrail {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sparkles = [];
    this.running = false;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (!isTouch && !prefersReducedMotion) {
      window.addEventListener('mousemove', e => this.addSparkle(e.clientX, e.clientY));
      this.start();
    }
  }
  resize() {
    this.canvas.width = window.innerWidth * this.dpr;
    this.canvas.height = window.innerHeight * this.dpr;
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.ctx.scale(this.dpr, this.dpr);
  }
  addSparkle(x, y) {
    const colors = [CONFIG.themeColors.c1, CONFIG.themeColors.c3, CONFIG.themeColors.c4, CONFIG.themeColors.c6];
    this.sparkles.push({ x, y, size: rand(3, 7), life: 1, color: pick(colors), vx: rand(-1, 1), vy: rand(-2, 0) });
    if (this.sparkles.length > 50) this.sparkles.shift();
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.loop();
  }
  loop() {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.05;
      s.life -= 0.03;
      if (s.life <= 0) { this.sparkles.splice(i, 1); continue; }
      this.ctx.save();
      this.ctx.globalAlpha = s.life;
      this.ctx.fillStyle = s.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = s.color;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size * s.life, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }
    requestAnimationFrame(this.loop.bind(this));
  }
}

/* ============================================================
   GAME BASE CLASS
   ============================================================ */
class GameBase {
  constructor(container) {
    this.container = container;
    this.rafId = null;
    this.running = false;
    this.paused = false;
    this.lastTime = 0;
    this.failCount = 0;
    this.onWin = null;
    this.onQuit = null;
    this.attemptEl = null;
  }

  showControls(extraHTML = '') {
    const controls = document.createElement('div');
    controls.className = 'game-controls';
    controls.innerHTML = `
      ${extraHTML}
      <button class="btn btn-secondary" data-act="pause">Pause</button>
      <button class="btn btn-secondary" data-act="restart">Restart</button>
      <button class="btn btn-ghost" data-act="quit">Quit</button>
    `;
    controls.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => this.handleControl(btn.dataset.act));
    });
    return controls;
  }

  handleControl(act) {
    audio.click();
    if (act === 'pause') { this.paused = !this.paused; }
    else if (act === 'restart') { this.stop(); this.start(); }
    else if (act === 'quit') { this.destroy(); if (this.onQuit) this.onQuit(); }
  }

  showSkip(onSkip) {
    if (this.failCount >= 2) {
      let skip = this.container.querySelector('.btn-skip');
      if (!skip) {
        skip = document.createElement('button');
        skip.className = 'btn btn-skip';
        skip.textContent = 'Skip ⏭';
        skip.addEventListener('click', () => { audio.click(); this.destroy(); if (this.onWin) this.onWin(true); });
        this.container.appendChild(skip);
      }
    }
  }

  fail() {
    this.failCount++;
    audio.lose();
    this.showSkip();
  }

  start() {}
  stop() { this.running = false; if (this.rafId) cancelAnimationFrame(this.rafId); }
  destroy() { this.stop(); this.container.innerHTML = ''; }
}

/* ============================================================
   JOURNEY CONTROLLER
   ============================================================ */
class Journey {
  constructor() {
    this.app = $('#app');
    this.overlay = $('#game-overlay');
    this.gameContainer = $('#game-container');
    this.topbar = $('#topbar');
    this.tracker = $('#progress-tracker');
    this.sections = ['hero', 'message', 'photos', 'cake', 'wishes', 'celebration', 'arcade'];
    this.labels = ['🎂', '💌', '📸', '🎂', '🎁', '🎆', '🎮'];
    this.unlocked = new Set(getSetting('unlocked', ['hero']));
    this.current = 'hero';
    this.activeGame = null;
    this.progress = loadProgress();
  }

  save() {
    saveSetting('unlocked', [...this.unlocked]);
  }

  init() {
    this.renderTracker();
    this.show('hero');
  }

  renderTracker() {
    this.tracker.innerHTML = '';
    this.sections.forEach((s, i) => {
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      dot.setAttribute('role', 'button');
      dot.setAttribute('aria-label', `Go to ${s}`);
      dot.title = s.charAt(0).toUpperCase() + s.slice(1);
      if (this.unlocked.has(s)) dot.classList.add('completed');
      if (s === this.current) dot.classList.add('current');
      if (!this.unlocked.has(s)) dot.classList.add('locked');
      dot.addEventListener('click', () => {
        if (this.unlocked.has(s)) this.show(s);
      });
      this.tracker.appendChild(dot);
    });
  }

  show(section) {
    if (!this.unlocked.has(section) && section !== 'hero') return;
    this.current = section;
    this.renderTracker();
    this.app.innerHTML = '';
    this.stopGame();
    this.app.scrollTop = 0;

    switch (section) {
      case 'hero': this.showHero(); break;
      case 'message': this.showMessage(); break;
      case 'photos': this.showPhotos(); break;
      case 'cake': this.showCake(); break;
      case 'wishes': this.showWishes(); break;
      case 'celebration': this.showCelebration(); break;
      case 'arcade': this.showArcade(); break;
    }
  }

  openGame(gameFactory, section, onComplete) {
    this.overlay.classList.remove('hidden');
    this.gameContainer.innerHTML = '';
    const game = gameFactory(this.gameContainer);
    this.activeGame = game;
    game.onWin = (skipped) => {
      this.stopGame();
      this.unlocked.add(section);
      this.save();
      this.renderTracker();
      audio.win();
      if (onComplete) onComplete(skipped);
    };
    game.onQuit = () => {
      this.stopGame();
      this.show(this.current);
    };
    game.start();
  }

  stopGame() {
    if (this.activeGame) { this.activeGame.destroy(); this.activeGame = null; }
    this.overlay.classList.add('hidden');
  }

  // ---- HERO ----
  showHero() {
    const name = getURLParam('name') || CONFIG.name;
    const sec = document.createElement('section');
    sec.className = 'section';
    sec.innerHTML = `
      <div class="hero-balloons">
        <span class="hero-balloon">🎈</span>
        <span class="hero-balloon">🎈</span>
        <span class="hero-balloon">🎈</span>
        <span class="hero-balloon">🎈</span>
        <span class="hero-balloon">🎈</span>
      </div>
      <h1 class="hero-title">Happy Birthday<br>${name}!</h1>
      <p class="hero-subtitle">A special journey awaits you… 🎁</p>
      <button class="btn btn-primary hero-tap" id="hero-begin">Tap to Begin ✨</button>
      <p style="margin-top:20px;color:var(--text-faint);font-size:0.8rem;">From ${CONFIG.senderName}</p>
    `;
    this.app.appendChild(sec);
    $('#hero-begin').addEventListener('click', () => {
      audio.init();
      audio.resume();
      audio.click();
      audio.startMusic();
      this.unlocked.add('message');
      this.save();
      this.show('message');
    });
  }

  // ---- MESSAGE (Gate: Tic-Tac-Toe) ----
  showMessage() {
    const name = getURLParam('name') || CONFIG.name;
    const sec = document.createElement('section');
    sec.className = 'section';
    if (this.progress.messageSeen) {
      this.renderMessage(sec, name);
    } else {
      sec.innerHTML = `
        <h2 class="section-title">A Letter For You 💌</h2>
        <p class="section-subtitle">Win a quick game of Tic-Tac-Toe to unlock your message!</p>
        <button class="btn btn-primary" id="play-ttt">Play Tic-Tac-Toe ❌⭕</button>
      `;
      this.app.appendChild(sec);
      $('#play-ttt').addEventListener('click', () => {
        audio.click();
        this.openGame(c => new TicTacToe(c), 'message', () => {
          this.progress.messageSeen = true;
          saveProgress(this.progress);
          this.show('message');
        });
      });
    }
    if (this.progress.messageSeen) this.app.appendChild(sec);
  }

  renderMessage(sec, name) {
    sec.innerHTML = `
      <h2 class="section-title">A Letter For You 💌</h2>
      <div class="message-card glass">
        <div class="message-body" id="message-body"></div>
        <div class="message-signature">— ${CONFIG.senderName}</div>
      </div>
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-secondary" id="msg-next">Next: Photos 📸</button>
      </div>
    `;
    this.app.appendChild(sec);
    this.typewriter($('#message-body'), CONFIG.mainMessage.map(p => p.replace(/{name}/g, name)));
    $('#msg-next').addEventListener('click', () => {
      audio.click();
      this.unlocked.add('photos');
      this.save();
      this.show('photos');
    });
  }

  typewriter(el, paragraphs) {
    let pIdx = 0, cIdx = 0;
    let currentP = document.createElement('p');
    el.appendChild(currentP);
    const cursor = document.createElement('span');
    cursor.className = 'typewriter-cursor';
    el.appendChild(cursor);
    function step() {
      if (pIdx >= paragraphs.length) { cursor.remove(); return; }
      const text = paragraphs[pIdx];
      if (cIdx < text.length) {
        currentP.textContent += text[cIdx];
        cIdx++;
        setTimeout(step, 25);
      } else {
        pIdx++;
        cIdx = 0;
        if (pIdx < paragraphs.length) {
          el.removeChild(cursor);
          currentP = document.createElement('p');
          el.appendChild(currentP);
          el.appendChild(cursor);
          setTimeout(step, 100);
        } else {
          cursor.remove();
        }
      }
    }
    step();
  }

  // ---- PHOTOS (Gate: Memory) ----
  showPhotos() {
    const sec = document.createElement('section');
    sec.className = 'section';
    if (this.progress.photosSeen) {
      this.renderPhotos(sec);
    } else {
      sec.innerHTML = `
        <h2 class="section-title">Photo Memories 📸</h2>
        <p class="section-subtitle">Match all 6 pairs in the memory game to unlock the gallery!</p>
        <button class="btn btn-primary" id="play-memory">Play Memory Match 🃏</button>
      `;
      this.app.appendChild(sec);
      $('#play-memory').addEventListener('click', () => {
        audio.click();
        this.openGame(c => new MemoryGame(c), 'photos', () => {
          this.progress.photosSeen = true;
          saveProgress(this.progress);
          this.show('photos');
        });
      });
    }
    if (this.progress.photosSeen) this.app.appendChild(sec);
  }

  renderPhotos(sec) {
    sec.innerHTML = `
      <h2 class="section-title">Photo Memories 📸</h2>
      <div class="photo-gallery" id="gallery"></div>
      <div class="gallery-nav" id="gallery-nav"></div>
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-secondary" id="photo-next">Next: Cake 🎂</button>
      </div>
    `;
    this.app.appendChild(sec);
    const gallery = $('#gallery');
    const nav = $('#gallery-nav');
    CONFIG.photos.forEach((p, i) => {
      const polaroid = document.createElement('div');
      polaroid.className = 'photo-polaroid';
      polaroid.style.display = i === 0 ? 'block' : 'none';
      polaroid.innerHTML = `
        <img src="${p.src}" alt="Birthday photo ${i + 1}: ${p.caption}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%23ff6ec7%22 width=%22400%22 height=%22300%22/><text x=%22200%22 y=%22150%22 text-anchor=%22middle%22 font-size=%2260%22>🎂</text></svg>'" />
        <div class="photo-caption">${p.caption}</div>
      `;
      polaroid.addEventListener('click', () => this.openLightbox(p.src, p.caption));
      gallery.appendChild(polaroid);
      const dot = document.createElement('div');
      dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => this.swipeTo(i));
      nav.appendChild(dot);
    });
    // Swipe support
    let startX = 0, currentIdx = 0;
    gallery.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    gallery.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) {
        const dir = dx < 0 ? 1 : -1;
        currentIdx = clamp(currentIdx + dir, 0, CONFIG.photos.length - 1);
        this.swipeTo(currentIdx);
      }
    });
    this._galleryIdx = 0;
    $('#photo-next').addEventListener('click', () => {
      audio.click();
      this.unlocked.add('cake');
      this.save();
      this.show('cake');
    });
  }

  swipeTo(idx) {
    const cards = $$('.photo-polaroid');
    const dots = $$('.gallery-dot');
    cards.forEach((c, i) => c.style.display = i === idx ? 'block' : 'none');
    dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    this._galleryIdx = idx;
    audio.pop();
  }

  openLightbox(src, caption) {
    const lb = $('#lightbox');
    $('#lightbox-img').src = src;
    $('#lightbox-img').alt = caption;
    $('#lightbox-caption').textContent = caption;
    lb.classList.remove('hidden');
    $('.lightbox-close').onclick = () => lb.classList.add('hidden');
  }

  // ---- CAKE (Gate: Catch Gifts + Candle blowing) ----
  showCake() {
    const sec = document.createElement('section');
    sec.className = 'section';
    if (this.progress.cakeSeen) {
      this.renderCake(sec);
    } else {
      sec.innerHTML = `
        <h2 class="section-title">Cake Time! 🎂</h2>
        <p class="section-subtitle">Catch 15 falling gifts in the basket to unlock the cake!</p>
        <button class="btn btn-primary" id="play-catch">Play Catch the Gifts 🎁</button>
      `;
      this.app.appendChild(sec);
      $('#play-catch').addEventListener('click', () => {
        audio.click();
        this.openGame(c => new CatchGifts(c), 'cake', () => {
          this.progress.cakeSeen = true;
          saveProgress(this.progress);
          this.show('cake');
        });
      });
    }
    if (this.progress.cakeSeen) this.app.appendChild(sec);
  }

  renderCake(sec) {
    const age = CONFIG.age;
    const candleCount = clamp(age, 1, 10);
    sec.innerHTML = `
      <h2 class="section-title">Make a Wish! 🎂</h2>
      <div class="cake-stage">
        <div class="cake-emoji">🎂</div>
        <div class="candle-row" id="candle-row"></div>
        <p class="blow-instruction" id="blow-instruction">Tap each candle to blow it out, or hold to blow all at once! 💨</p>
        <button class="btn btn-secondary" id="cake-mic">🎤 Use Microphone</button>
        <button class="btn btn-primary" id="cake-next" style="display:none;">Next: Wishes 🎁</button>
      </div>
    `;
    this.app.appendChild(sec);
    const row = $('#candle-row');
    let out = 0;
    for (let i = 0; i < candleCount; i++) {
      const c = document.createElement('span');
      c.className = 'candle';
      c.textContent = '🕯️';
      c.dataset.idx = i;
      c.addEventListener('click', () => this.blowCandle(c, () => this.checkAllOut()));
      row.appendChild(c);
    }
    // Mic button
    $('#cake-mic').addEventListener('click', () => this.startMicBlow(row, () => this.checkAllOut()));
    $('#cake-next').addEventListener('click', () => {
      audio.click();
      this.unlocked.add('wishes');
      this.save();
      this.show('wishes');
    });
  }

  blowCandle(candleEl, onAllOut) {
    if (candleEl.classList.contains('out')) return;
    candleEl.classList.add('out');
    audio.candleBlow();
    const smoke = document.createElement('span');
    smoke.className = 'smoke';
    smoke.textContent = '💨';
    smoke.style.position = 'absolute';
    smoke.style.left = candleEl.offsetLeft + 'px';
    smoke.style.top = candleEl.offsetTop + 'px';
    candleEl.parentElement.style.position = 'relative';
    candleEl.parentElement.appendChild(smoke);
    setTimeout(() => smoke.remove(), 1500);
    this.checkAllOut();
  }

  checkAllOut() {
    const candles = $$('.candle');
    const allOut = [...candles].every(c => c.classList.contains('out'));
    if (allOut) {
      audio.win();
      this.confettiBurst();
      const next = $('#cake-next');
      if (next) next.style.display = 'inline-flex';
      const inst = $('#blow-instruction');
      if (inst) inst.textContent = 'All candles out! Your wish has been made! ✨';
    }
  }

  startMicBlow(row, onAllOut) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone not available on this device. Use tap instead!');
      return;
    }
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const ac = new (window.AudioContext || window.webkitAudioContext)();
        const src = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let blowing = false;
        const check = () => {
          analyser.getByteFrequencyData(data);
          const vol = data.reduce((a, b) => a + b, 0) / data.length;
          if (vol > 30 && !blowing) {
            blowing = true;
            const candles = [...$$('.candle')].filter(c => !c.classList.contains('out'));
            if (candles.length) {
              this.blowCandle(candles[0], () => this.checkAllOut());
              setTimeout(() => { blowing = false; }, 500);
            }
          } else if (vol < 15) {
            blowing = false;
          }
          if ([...$$('.candle')].some(c => !c.classList.contains('out'))) {
            requestAnimationFrame(check);
          } else {
            stream.getTracks().forEach(t => t.stop());
            ac.close();
          }
        };
        check();
        $('#blow-instruction').textContent = 'Blow into your microphone! 🎤💨';
      })
      .catch(() => {
        alert('Microphone permission denied. Use tap instead!');
      });
  }

  confettiBurst() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:400;';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const colors = Object.values(CONFIG.themeColors);
    const particles = [];
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: window.innerWidth / 2, y: window.innerHeight / 2,
        vx: rand(-8, 8), vy: rand(-12, -4),
        size: rand(4, 10), color: pick(colors),
        life: 1, rotation: rand(0, Math.PI * 2), rotSpeed: rand(-0.2, 0.2),
      });
    }
    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach(p => {
        if (p.life <= 0) return;
        alive = true;
        p.x += p.vx; p.y += p.vy; p.vy += 0.3; p.life -= 0.015; p.rotation += p.rotSpeed;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      if (alive) requestAnimationFrame(animate);
      else canvas.remove();
    }
    animate();
  }

  // ---- WISHES (Gate: Shoot Bottles) ----
  showWishes() {
    const sec = document.createElement('section');
    sec.className = 'section';
    if (this.progress.wishesSeen) {
      this.renderWishes(sec);
    } else {
      sec.innerHTML = `
        <h2 class="section-title">Birthday Wishes 🎁</h2>
        <p class="section-subtitle">Break all 6 bottles to reveal your birthday wishes!</p>
        <button class="btn btn-primary" id="play-shoot">Play Shoot the Bottles 🍾</button>
      `;
      this.app.appendChild(sec);
      $('#play-shoot').addEventListener('click', () => {
        audio.click();
        this.openGame(c => new ShootBottles(c), 'wishes', () => {
          this.progress.wishesSeen = true;
          saveProgress(this.progress);
          this.show('wishes');
        });
      });
    }
    if (this.progress.wishesSeen) this.app.appendChild(sec);
  }

  renderWishes(sec) {
    sec.innerHTML = `
      <h2 class="section-title">Your Birthday Wishes 🎁</h2>
      <div class="wishes-grid" id="wishes-grid"></div>
      <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center;">
        <button class="btn btn-primary" id="wishes-next">Next: Celebration 🎆</button>
      </div>
    `;
    this.app.appendChild(sec);
    const grid = $('#wishes-grid');
    const icons = ['🌈', '💕', '🌟', '💪', '🚀', '🤝'];
    CONFIG.wishes.forEach((w, i) => {
      const card = document.createElement('div');
      card.className = 'wish-card';
      card.innerHTML = `<span class="wish-icon">${icons[i] || '🎁'}</span>${w}`;
      card.style.animationDelay = (i * 0.15) + 's';
      grid.appendChild(card);
    });
    $('#wishes-next').addEventListener('click', () => {
      audio.click();
      this.unlocked.add('celebration');
      this.save();
      this.show('celebration');
    });
  }

  // ---- CELEBRATION (Gate: Fruit Ninja) ----
  showCelebration() {
    const sec = document.createElement('section');
    sec.className = 'section';
    if (this.progress.celebrationSeen) {
      this.renderCelebration(sec);
    } else {
      sec.innerHTML = `
        <h2 class="section-title">Grand Finale 🎆</h2>
        <p class="section-subtitle">Slice enough fruits to unlock the grand celebration!</p>
        <button class="btn btn-primary" id="play-ninja">Play Fruit Slicer 🍉</button>
      `;
      this.app.appendChild(sec);
      $('#play-ninja').addEventListener('click', () => {
        audio.click();
        this.openGame(c => new FruitNinja(c), 'celebration', () => {
          this.progress.celebrationSeen = true;
          saveProgress(this.progress);
          this.show('celebration');
        });
      });
    }
    if (this.progress.celebrationSeen) this.app.appendChild(sec);
  }

  renderCelebration(sec) {
    const name = getURLParam('name') || CONFIG.name;
    sec.innerHTML = `
      <h2 class="section-title">Happy Birthday ${name}! 🎆</h2>
      <canvas id="fireworks-canvas" style="position:fixed;inset:0;z-index:300;pointer-events:none;"></canvas>
      <div class="finale-note glass" style="margin-top:20px;">${CONFIG.finalNote.replace(/{name}/g, name)}</div>
      <div class="finale-buttons">
        <button class="btn btn-primary" id="finale-replay">Replay 🔄</button>
        <button class="btn btn-secondary" id="finale-share">Share 🔗</button>
        <button class="btn btn-secondary" id="finale-arcade">Bonus Arcade 🎮</button>
      </div>
    `;
    this.app.appendChild(sec);
    this.startFireworks();
    $('#finale-replay').addEventListener('click', () => {
      audio.click();
      this.progress = {};
      saveProgress(this.progress);
      this.unlocked = new Set(['hero']);
      this.save();
      this.show('hero');
    });
    $('#finale-share').addEventListener('click', () => {
      audio.click();
      this.openShare();
    });
    $('#finale-arcade').addEventListener('click', () => {
      audio.click();
      this.unlocked.add('arcade');
      this.save();
      this.show('arcade');
    });
  }

  startFireworks() {
    const canvas = $('#fireworks-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const colors = Object.values(CONFIG.themeColors);
    const rockets = [];
    let running = true;
    function launch() {
      if (!running) return;
      const x = rand(canvas.width * 0.2, canvas.width * 0.8);
      rockets.push({
        x, y: canvas.height,
        vy: -rand(8, 14),
        targetY: rand(canvas.height * 0.2, canvas.height * 0.5),
        color: pick(colors),
        exploded: false,
        particles: [],
      });
      setTimeout(launch, rand(300, 800));
    }
    launch();
    function animate() {
      if (!running) return;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        if (!r.exploded) {
          r.y += r.vy;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
          ctx.fill();
          if (r.y <= r.targetY) {
            r.exploded = true;
            audio.fireworks();
            for (let j = 0; j < 40; j++) {
              const a = (j / 40) * Math.PI * 2;
              const sp = rand(2, 6);
              r.particles.push({
                x: r.x, y: r.y,
                vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                life: 1, color: r.color,
              });
            }
          }
        } else {
          let alive = false;
          r.particles.forEach(p => {
            if (p.life <= 0) return;
            alive = true;
            p.x += p.vx; p.y += p.vy; p.vy += 0.08; p.life -= 0.015;
            ctx.save();
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = 10;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
          if (!alive) rockets.splice(i, 1);
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
    this._stopFireworks = () => { running = false; if (canvas) canvas.remove(); };
  }

  openShare() {
    const modal = $('#share-modal');
    const link = window.location.href;
    $('#share-link').value = link;
    modal.classList.remove('hidden');
    $('#share-copy').onclick = () => {
      $('#share-link').select();
      navigator.clipboard.writeText(link).then(() => {
        $('#share-copy').textContent = 'Copied! ✓';
        setTimeout(() => $('#share-copy').textContent = 'Copy Link', 2000);
      }).catch(() => {});
    };
    $('#share-native').onclick = () => {
      if (navigator.share) {
        navigator.share({ title: 'Happy Birthday!', text: 'Check out this birthday journey!', url: link });
      } else {
        $('#share-copy').click();
      }
    };
    $('#share-close').onclick = () => modal.classList.add('hidden');
  }

  // ---- ARCADE ----
  showArcade() {
    const sec = document.createElement('section');
    sec.className = 'section';
    sec.innerHTML = `
      <h2 class="section-title">Bonus Arcade 🎮</h2>
      <p class="section-subtitle">Replay your favorite games anytime!</p>
      <div class="arcade-hub" id="arcade-hub"></div>
      <div style="margin-top:24px;">
        <button class="btn btn-ghost" id="arcade-back">Back to Journey 🏠</button>
      </div>
    `;
    this.app.appendChild(sec);
    const hub = $('#arcade-hub');
    const games = [
      { id: 'archery', name: 'Archery', icon: '🏹', cls: Archery },
      { id: 'balloon', name: 'Balloon Pop', icon: '🎈', cls: BalloonPop },
      { id: 'whack', name: 'Whack-a-Gift', icon: '🎁', cls: WhackGift },
      { id: 'snake', name: 'Snake', icon: '🐍', cls: SnakeGame },
      { id: 'flappy', name: 'Flappy Balloon', icon: '🎈', cls: FlappyBalloon },
      { id: 'puzzle', name: 'Sliding Puzzle', icon: '🧩', cls: SlidingPuzzle },
      { id: 'reaction', name: 'Reaction Tap', icon: '⚡', cls: ReactionTap },
    ];
    games.forEach(g => {
      const card = document.createElement('div');
      card.className = 'arcade-card';
      const hs = getSetting('hs_' + g.id, 0);
      card.innerHTML = `
        <div class="arcade-card-icon">${g.icon}</div>
        <div class="arcade-card-name">${g.name}</div>
        <div class="arcade-card-score">High Score: ${hs}</div>
      `;
      card.addEventListener('click', () => {
        audio.click();
        this.openGame(c => new g.cls(c), 'arcade', () => {
          this.show('arcade');
        });
      });
      hub.appendChild(card);
    });
    $('#arcade-back').addEventListener('click', () => {
      audio.click();
      this.show('celebration');
    });
  }

  saveHighScore(gameId, score) {
    const cur = getSetting('hs_' + gameId, 0);
    if (score > cur) saveSetting('hs_' + gameId, score);
  }
}

/* ============================================================
   GAME 1: TIC-TAC-TOE (Gate for Message)
   ============================================================ */
class TicTacToe extends GameBase {
  start() {
    this.board = Array(9).fill(null);
    this.gameOver = false;
    this.playerTurn = true;
    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title">Tic-Tac-Toe ❌⭕</div>
      </div>
      <p class="game-instruction">Get 3 in a row to win! You are ❌</p>
      <div class="ttt-board" id="ttt-board"></div>
      <div class="game-stats" id="ttt-status"></div>
    `;
    const board = $('#ttt-board', this.container);
    for (let i = 0; i < 9; i++) {
      const cell = document.createElement('div');
      cell.className = 'ttt-cell';
      cell.dataset.idx = i;
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `Cell ${i + 1}`);
      cell.addEventListener('click', () => this.playerMove(i));
      board.appendChild(cell);
    }
    this.statusEl = $('#ttt-status', this.container);
    this.statusEl.innerHTML = '<span>Your turn!</span>';
    this.container.appendChild(this.showControls());
  }

  playerMove(idx) {
    if (this.board[idx] || this.gameOver || !this.playerTurn || this.paused) return;
    this.board[idx] = 'X';
    this.renderCell(idx, 'X');
    audio.pop();
    if (this.checkWin('X')) { this.endGame('win'); return; }
    if (this.board.every(c => c)) { this.endGame('draw'); return; }
    this.playerTurn = false;
    this.statusEl.innerHTML = '<span>AI thinking…</span>';
    setTimeout(() => this.aiMove(), 500);
  }

  aiMove() {
    if (this.gameOver || this.paused) return;
    const smart = Math.random() < CONFIG.difficulty.ticTacToe.smartChance;
    let idx;
    if (smart) {
      idx = this.findBestMove('O') ?? this.findBestMove('X') ?? this.findRandom();
    } else {
      idx = this.findRandom();
    }
    if (idx === null || idx === undefined) return;
    this.board[idx] = 'O';
    this.renderCell(idx, 'O');
    audio.click();
    if (this.checkWin('O')) { this.endGame('lose'); return; }
    if (this.board.every(c => c)) { this.endGame('draw'); return; }
    this.playerTurn = true;
    this.statusEl.innerHTML = '<span>Your turn!</span>';
  }

  findBestMove(player) {
    for (let i = 0; i < 9; i++) {
      if (!this.board[i]) {
        this.board[i] = player;
        if (this.checkWin(player)) { this.board[i] = null; return i; }
        this.board[i] = null;
      }
    }
    return null;
  }

  findRandom() {
    const empty = this.board.map((c, i) => c ? null : i).filter(i => i !== null);
    return empty.length ? pick(empty) : null;
  }

  renderCell(idx, sym) {
    const cell = this.container.querySelector(`.ttt-cell[data-idx="${idx}"]`);
    if (cell) { cell.textContent = sym === 'X' ? '❌' : '⭕'; cell.classList.add('taken'); }
  }

  checkWin(player) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(line => line.every(i => this.board[i] === player));
  }

  getWinLine(player) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.find(line => line.every(i => this.board[i] === player));
  }

  endGame(result) {
    this.gameOver = true;
    if (result === 'win') {
      const line = this.getWinLine('X');
      if (line) line.forEach(i => this.container.querySelector(`.ttt-cell[data-idx="${i}"]`)?.classList.add('win'));
      this.statusEl.innerHTML = '<span class="game-stat-value">You win! 🎉</span>';
      setTimeout(() => { this.destroy(); if (this.onWin) this.onWin(); }, 1200);
    } else if (result === 'lose') {
      this.statusEl.innerHTML = '<span>AI wins! Try again 💪</span>';
      this.fail();
      setTimeout(() => this.start(), 1500);
    } else {
      this.statusEl.innerHTML = '<span>Draw! Auto-retry 🔄</span>';
      setTimeout(() => this.start(), 1200);
    }
  }
}

/* ============================================================
   GAME 2: MEMORY CARD MATCH (Gate for Photos)
   ============================================================ */
class MemoryGame extends GameBase {
  start() {
    this.cards = [];
    this.flipped = [];
    this.matched = 0;
    this.moves = 0;
    this.locked = false;
    const photos = CONFIG.photos.slice(0, 6);
    const pairs = [...photos, ...photos].map((p, i) => ({ ...p, id: i }));
    // Shuffle
    for (let i = pairs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
    }
    this.cards = pairs;

    this.container.innerHTML = `
      <div class="game-header">
        <div class="game-title">Memory Match 🃏</div>
      </div>
      <p class="game-instruction">Find all 6 matching pairs!</p>
      <div class="game-stats"><span>Moves: <span class="game-stat-value" id="mem-moves">0</span></span><span>Matched: <span class="game-stat-value" id="mem-matched">0</span>/6</span></div>
      <div class="memory-grid" id="mem-grid"></div>
    `;
    const grid = $('#mem-grid', this.container);
    this.cards.forEach((card, idx) => {
      const el = document.createElement('div');
      el.className = 'memory-card';
      el.dataset.idx = idx;
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', 'Memory card');
      el.innerHTML = `
        <div class="memory-card-inner">
          <div class="memory-face memory-back">🎁</div>
          <div class="memory-face memory-front">
            <img src="${card.src}" alt="${card.caption}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23ff6ec7%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 font-size=%2240%22>🎂</text></svg>'" />
          </div>
        </div>
      `;
      el.addEventListener('click', () => this.flip(idx, el));
      grid.appendChild(el);
    });
    this.container.appendChild(this.showControls());
  }

  flip(idx, el) {
    if (this.locked || this.paused) return;
    if (el.classList.contains('flipped') || el.classList.contains('matched')) return;
    el.classList.add('flipped');
    audio.pop();
    this.flipped.push({ idx, el, card: this.cards[idx] });
    if (this.flipped.length === 2) {
      this.moves++;
      $('#mem-moves', this.container).textContent = this.moves;
      this.locked = true;
      const [a, b] = this.flipped;
      if (a.card.src === b.card.src) {
        setTimeout(() => {
          a.el.classList.add('matched');
          b.el.classList.add('matched');
          this.matched++;
          $('#mem-matched', this.container).textContent = this.matched;
          audio.coin();
          this.flipped = [];
          this.locked = false;
          if (this.matched === 6) {
            setTimeout(() => { this.destroy(); if (this.onWin) this.onWin(); }, 800);
          }
        }, 400);
      } else {
        setTimeout(() => {
          a.el.classList.remove('flipped');
          b.el.classList.remove('flipped');
          this.flipped = [];
          this.locked = false;
        }, 800);
      }
    }
  }
}

/* ============================================================
   GAME 3: CATCH THE FALLING GIFTS (Gate for Cake)
   ============================================================ */
class CatchGifts extends GameBase {
  start() {
    this.score = 0;
    this.lives = 3;
    this.gifts = [];
    this.basket = { x: 0, w: 80, h: 20 };
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Catch the Gifts 🎁</div></div>
      <p class="game-instruction">Move the basket — catch ${CONFIG.difficulty.catchGifts.target} gifts, avoid 💣!</p>
      <div class="game-stats">
        <span>Caught: <span class="game-stat-value" id="cg-score">0</span>/${CONFIG.difficulty.catchGifts.target}</span>
        <span>Lives: <span class="game-stat-value" id="cg-lives">3</span></span>
      </div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="cg-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#cg-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.basket.x = w / 2 - this.basket.w / 2;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.loop();
  }

  setupInput() {
    const canvas = this.canvas;
    this._move = (clientX) => {
      const rect = canvas.getBoundingClientRect();
      this.basket.x = clamp(clientX - rect.left - this.basket.w / 2, 0, this.cw - this.basket.w);
    };
    this._touch = (e) => { e.preventDefault(); this._move(e.touches[0].clientX); };
    this._mouse = (e) => { this._move(e.clientX); };
    this._key = (e) => {
      if (e.key === 'ArrowLeft') this.basket.x = Math.max(0, this.basket.x - 30);
      if (e.key === 'ArrowRight') this.basket.x = Math.min(this.cw - this.basket.w, this.basket.x + 30);
    };
    canvas.addEventListener('touchmove', this._touch, { passive: false });
    canvas.addEventListener('touchstart', this._touch, { passive: false });
    canvas.addEventListener('mousemove', this._mouse);
    window.addEventListener('keydown', this._key);
  }

  loop() {
    if (!this.running || this.paused) { if (this.running) this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Draw basket
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧺', this.basket.x + this.basket.w / 2, this.ch - 10);
    // Spawn
    this.spawnTimer += dt;
    if (this.spawnTimer > 45) {
      this.spawnTimer = 0;
      const isBomb = Math.random() < CONFIG.difficulty.catchGifts.bombChance;
      this.gifts.push({
        x: rand(20, this.cw - 20),
        y: -20,
        vy: CONFIG.difficulty.catchGifts.speed * rand(0.8, 1.3),
        emoji: isBomb ? '💣' : pick(['🎁', '🎈', '🎉', '🎀', '💝']),
        bomb: isBomb,
      });
    }
    // Update & draw
    for (let i = this.gifts.length - 1; i >= 0; i--) {
      const g = this.gifts[i];
      g.y += g.vy * dt;
      ctx.fillText(g.emoji, g.x, g.y);
      // Catch
      if (g.y > this.ch - 35 && g.y < this.ch - 5 && g.x > this.basket.x && g.x < this.basket.x + this.basket.w) {
        if (g.bomb) {
          this.lives--;
          audio.lose();
          $('#cg-lives', this.container).textContent = this.lives;
          if (this.lives <= 0) { this.fail(); setTimeout(() => this.start(), 1000); return; }
        } else {
          this.score++;
          audio.coin();
          $('#cg-score', this.container).textContent = this.score;
          if (this.score >= CONFIG.difficulty.catchGifts.target) {
            this.running = false;
            this.destroy();
            if (this.onWin) this.onWin();
            return;
          }
        }
        this.gifts.splice(i, 1);
      } else if (g.y > this.ch + 20) {
        this.gifts.splice(i, 1);
      }
    }
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('touchmove', this._touch);
      this.canvas.removeEventListener('touchstart', this._touch);
      this.canvas.removeEventListener('mousemove', this._mouse);
      window.removeEventListener('keydown', this._key);
    }
    super.destroy();
  }
}

/* ============================================================
   GAME 4: SHOOT THE BOTTLES (Gate for Wishes)
   ============================================================ */
class ShootBottles extends GameBase {
  start() {
    this.score = 0;
    this.target = CONFIG.difficulty.shootBottles.target;
    this.bottles = [];
    this.crosshair = { x: 0, y: 0 };
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Shoot the Bottles 🍾</div></div>
      <p class="game-instruction">Tap to aim and break ${this.target} bottles!</p>
      <div class="game-stats"><span>Broken: <span class="game-stat-value" id="sb-score">0</span>/${this.target}</span></div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="sb-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#sb-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.shards = [];
    this.loop();
  }

  setupInput() {
    this._tap = (e) => {
      if (this.paused) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      this.crosshair = { x: cx, y: cy };
      audio.arrow();
      for (let i = this.bottles.length - 1; i >= 0; i--) {
        const b = this.bottles[i];
        if (Math.abs(cx - b.x) < 30 && Math.abs(cy - b.y) < 40) {
          this.shards.push({ x: b.x, y: b.y, life: 1, emoji: '💥' });
          this.bottles.splice(i, 1);
          this.score++;
          audio.pop();
          $('#sb-score', this.container).textContent = this.score;
          if (this.score >= this.target) {
            this.running = false;
            this.destroy();
            if (this.onWin) this.onWin();
            return;
          }
          break;
        }
      }
    };
    this.canvas.addEventListener('click', this._tap);
    this.canvas.addEventListener('touchstart', this._tap, { passive: false });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Spawn
    this.spawnTimer += dt;
    if (this.spawnTimer > 60 && this.bottles.length < 4) {
      this.spawnTimer = 0;
      this.bottles.push({
        x: rand(30, this.cw - 30),
        y: rand(40, this.ch - 60),
        vx: rand(-1, 1),
        emoji: pick(['🍾', '🍷', '🍶', '🥃']),
        wobble: rand(0, Math.PI * 2),
      });
    }
    // Draw bottles
    this.bottles.forEach(b => {
      b.x += b.vx * dt;
      b.wobble += 0.05 * dt;
      if (b.x < 20 || b.x > this.cw - 20) b.vx *= -1;
      ctx.save();
      ctx.translate(b.x, b.y + Math.sin(b.wobble) * 5);
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.emoji, 0, 0);
      ctx.restore();
    });
    // Draw shards
    for (let i = this.shards.length - 1; i >= 0; i--) {
      const s = this.shards[i];
      s.life -= 0.04 * dt;
      if (s.life <= 0) { this.shards.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = s.life;
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.fillText(s.emoji, s.x, s.y);
      ctx.restore();
    }
    // Crosshair
    if (this.crosshair.x) {
      ctx.strokeStyle = CONFIG.themeColors.c1;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.crosshair.x, this.crosshair.y, 20, 0, Math.PI * 2);
      ctx.moveTo(this.crosshair.x - 25, this.crosshair.y);
      ctx.lineTo(this.crosshair.x + 25, this.crosshair.y);
      ctx.moveTo(this.crosshair.x, this.crosshair.y - 25);
      ctx.lineTo(this.crosshair.x, this.crosshair.y + 25);
      ctx.stroke();
    }
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('click', this._tap);
      this.canvas.removeEventListener('touchstart', this._tap);
    }
    super.destroy();
  }
}

/* ============================================================
   GAME 5: FRUIT NINJA SLICER (Gate for Celebration)
   ============================================================ */
class FruitNinja extends GameBase {
  start() {
    this.score = 0;
    this.target = CONFIG.difficulty.fruitNinja.targetScore;
    this.time = CONFIG.difficulty.fruitNinja.time;
    this.fruits = [];
    this.splashes = [];
    this.trail = [];
    this.combo = 0;
    this.comboTimer = 0;
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Fruit Slicer 🍉</div></div>
      <p class="game-instruction">Swipe to slice fruits, avoid 💣! Reach ${this.target} points!</p>
      <div class="game-stats">
        <span>Score: <span class="game-stat-value" id="fn-score">0</span>/${this.target}</span>
        <span>Time: <span class="game-stat-value" id="fn-time">${this.time}</span>s</span>
        <span>Combo: <span class="game-stat-value" id="fn-combo">0</span>x</span>
      </div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="fn-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#fn-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.timeLeft = this.time;
    this.loop();
  }

  setupInput() {
    let slicing = false;
    this._down = (e) => {
      if (this.paused) return;
      e.preventDefault();
      slicing = true;
      this.addTrailPoint(e);
    };
    this._move = (e) => {
      if (!slicing || this.paused) return;
      e.preventDefault();
      this.addTrailPoint(e);
      this.checkSlice();
    };
    this._up = () => { slicing = false; };
    this.canvas.addEventListener('mousedown', this._down);
    this.canvas.addEventListener('mousemove', this._move);
    this.canvas.addEventListener('mouseup', this._up);
    this.canvas.addEventListener('touchstart', this._down, { passive: false });
    this.canvas.addEventListener('touchmove', this._move, { passive: false });
    this.canvas.addEventListener('touchend', this._up);
  }

  addTrailPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
    this.trail.push({ x, y, life: 1 });
    if (this.trail.length > 15) this.trail.shift();
  }

  checkSlice() {
    const last = this.trail[this.trail.length - 1];
    if (!last) return;
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      if (Math.abs(last.x - f.x) < 30 && Math.abs(last.y - f.y) < 30) {
        if (f.bomb) {
          audio.lose();
          this.timeLeft = Math.max(0, this.timeLeft - 5);
          this.fruits.splice(i, 1);
          this.combo = 0;
          $('#fn-combo', this.container).textContent = '0';
        } else {
          this.fruits.splice(i, 1);
          this.combo++;
          this.comboTimer = 60;
          const pts = 10 * Math.max(1, Math.floor(this.combo / 2));
          this.score += pts;
          audio.slice();
          $('#fn-score', this.container).textContent = this.score;
          $('#fn-combo', this.container).textContent = this.combo;
          this.splashes.push({ x: f.x, y: f.y, color: f.color, life: 1, particles: this.makeSplash(f.x, f.y, f.color) });
          if (this.score >= this.target) {
            this.running = false;
            this.destroy();
            if (this.onWin) this.onWin();
            return;
          }
        }
        break;
      }
    }
  }

  makeSplash(x, y, color) {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({ x, y, vx: rand(-4, 4), vy: rand(-4, 4), size: rand(3, 8), life: 1 });
    }
    return arr;
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Time
    this.timeLeft -= dt / 60;
    $('#fn-time', this.container).textContent = Math.ceil(this.timeLeft);
    if (this.timeLeft <= 0) {
      this.fail();
      setTimeout(() => this.start(), 1000);
      return;
    }
    // Combo decay
    if (this.comboTimer > 0) { this.comboTimer -= dt; if (this.comboTimer <= 0) { this.combo = 0; $('#fn-combo', this.container).textContent = '0'; } }
    // Spawn
    this.spawnTimer += dt;
    if (this.spawnTimer > 50) {
      this.spawnTimer = 0;
      const isBomb = Math.random() < 0.15;
      this.fruits.push({
        x: rand(40, this.cw - 40),
        y: this.ch + 20,
        vx: rand(-2, 2),
        vy: -rand(8, 12),
        emoji: isBomb ? '💣' : pick(['🍉', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🥭']),
        color: pick([CONFIG.themeColors.c1, CONFIG.themeColors.c3, CONFIG.themeColors.c4, CONFIG.themeColors.c5]),
        bomb: isBomb,
        rot: 0, rotSpeed: rand(-0.1, 0.1),
      });
    }
    // Update fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 0.3 * dt; f.rot += f.rotSpeed * dt;
      if (f.y > this.ch + 40) this.fruits.splice(i, 1);
      else {
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.font = '30px serif';
        ctx.textAlign = 'center';
        ctx.fillText(f.emoji, 0, 10);
        ctx.restore();
      }
    }
    // Splashes
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const s = this.splashes[i];
      s.life -= 0.03 * dt;
      if (s.life <= 0) { this.splashes.splice(i, 1); continue; }
      s.particles.forEach(p => {
        p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 0.2 * dt; p.life = s.life;
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }
    // Trail
    if (this.trail.length > 1) {
      ctx.strokeStyle = CONFIG.themeColors.c1;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.shadowBlur = 10;
      ctx.shadowColor = CONFIG.themeColors.c1;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        this.trail[i].life -= 0.08;
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      this.trail = this.trail.filter(t => t.life > 0);
    }
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._down);
      this.canvas.removeEventListener('mousemove', this._move);
      this.canvas.removeEventListener('mouseup', this._up);
      this.canvas.removeEventListener('touchstart', this._down);
      this.canvas.removeEventListener('touchmove', this._move);
      this.canvas.removeEventListener('touchend', this._up);
    }
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 1: ARCHERY
   ============================================================ */
class Archery extends GameBase {
  start() {
    this.arrows = CONFIG.difficulty.archery.arrows;
    this.score = 0;
    this.wind = rand(-CONFIG.difficulty.archery.windMax, CONFIG.difficulty.archery.windMax);
    this.aiming = false;
    this.aimStart = null;
    this.canvas = null;
    this.ctx = null;
    this.projectiles = [];
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Archery 🏹</div></div>
      <p class="game-instruction">Drag back to aim, release to shoot! ${this.arrows} arrows.</p>
      <div class="game-stats">
        <span>Score: <span class="game-stat-value" id="ar-score">0</span></span>
        <span>Arrows: <span class="game-stat-value" id="ar-arrows">${this.arrows}</span></span>
        <span>Wind: <span class="game-stat-value" id="ar-wind">${this.wind.toFixed(1)}</span></span>
      </div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="ar-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#ar-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.target = { x: w - 60, y: h / 2, r: 30 };
    this.bow = { x: 50, y: h / 2 };
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  setupInput() {
    this._down = (e) => {
      if (this.paused || this.arrows <= 0) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      this.aiming = true;
      this.aimStart = { x, y };
    };
    this._up = (e) => {
      if (!this.aiming) return;
      this.aiming = false;
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX) - rect.left;
      const y = (e.changedTouches ? e.changedTouches[0].clientY : e.clientY) - rect.top;
      const dx = this.aimStart.x - x;
      const dy = this.aimStart.y - y;
      const power = clamp(Math.sqrt(dx * dx + dy * dy) / 5, 2, 15);
      this.projectiles.push({
        x: this.bow.x, y: this.bow.y,
        vx: power, vy: dy / 10,
      });
      this.arrows--;
      $('#ar-arrows', this.container).textContent = this.arrows;
      audio.arrow();
    };
    this.canvas.addEventListener('mousedown', this._down);
    this.canvas.addEventListener('mouseup', this._up);
    this.canvas.addEventListener('touchstart', this._down, { passive: false });
    this.canvas.addEventListener('touchend', this._up, { passive: false });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Draw target
    const t = this.target;
    const colors = ['#ff6ec7', '#fff', '#ffd93d', '#fff', '#6ee7b7'];
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.r * (1 - i * 0.18), 0, Math.PI * 2);
      ctx.fill();
    }
    // Draw bow
    ctx.font = '30px serif';
    ctx.fillText('🏹', this.bow.x - 15, this.bow.y + 10);
    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += this.wind * 0.05 * dt;
      ctx.fillText('➤', p.x, p.y + 5);
      // Hit check
      const dx = p.x - t.x, dy = p.y - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.r) {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pts = Math.round((1 - dist / t.r) * 10);
        this.score += pts;
        $('#ar-score', this.container).textContent = this.score;
        audio.pop();
        this.projectiles.splice(i, 1);
      } else if (p.x > this.cw || p.y < 0 || p.y > this.ch) {
        this.projectiles.splice(i, 1);
      }
    }
    // Check game over
    if (this.arrows <= 0 && this.projectiles.length === 0) {
      this.running = false;
      journey.saveHighScore('archery', this.score);
      this.container.innerHTML += `<div class="game-result"><h2>Score: ${this.score}!</h2><button class="btn btn-primary" id="ar-done">Done</button></div>`;
      $('#ar-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
      return;
    }
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._down);
      this.canvas.removeEventListener('mouseup', this._up);
      this.canvas.removeEventListener('touchstart', this._down);
      this.canvas.removeEventListener('touchend', this._up);
    }
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 2: BALLOON POP
   ============================================================ */
class BalloonPop extends GameBase {
  start() {
    this.target = CONFIG.difficulty.balloonPop.target;
    this.popped = 0;
    this.balloons = [];
    this.letters = 'HAPPYBIRTHDAY'.split('');
    this.letterIdx = 0;
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Balloon Pop 🎈</div></div>
      <p class="game-instruction">Pop balloons to spell HAPPY BIRTHDAY! (${this.letterIdx}/${this.letters.length})</p>
      <div class="game-stats"><span>Spelled: <span class="game-stat-value" id="bp-score">0</span>/${this.letters.length}</span></div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="bp-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#bp-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.loop();
  }

  setupInput() {
    this._tap = (e) => {
      if (this.paused) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      for (let i = this.balloons.length - 1; i >= 0; i--) {
        const b = this.balloons[i];
        if (Math.abs(x - b.x) < b.r && Math.abs(y - b.y) < b.r) {
          if (b.letter === this.letters[this.letterIdx]) {
            this.popped++;
            this.letterIdx++;
            audio.pop();
            $('#bp-score', this.container).textContent = this.popped;
            this.balloons.splice(i, 1);
            if (this.letterIdx >= this.letters.length) {
              this.running = false;
              journey.saveHighScore('balloon', this.popped);
              this.container.innerHTML += `<div class="game-result"><h2>HAPPY BIRTHDAY! 🎉</h2><button class="btn btn-primary" id="bp-done">Done</button></div>`;
              $('#bp-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
              return;
            }
          } else {
            audio.click();
            this.balloons.splice(i, 1);
          }
          break;
        }
      }
    };
    this.canvas.addEventListener('click', this._tap);
    this.canvas.addEventListener('touchstart', this._tap, { passive: false });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Spawn
    this.spawnTimer += dt;
    if (this.spawnTimer > 40 && this.balloons.length < 6) {
      this.spawnTimer = 0;
      const needed = this.letters[this.letterIdx];
      const useNeeded = Math.random() < 0.4;
      this.balloons.push({
        x: rand(30, this.cw - 30),
        y: this.ch + 20,
        vy: -rand(1, 2),
        r: 22,
        letter: useNeeded ? needed : pick('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')),
        color: pick(Object.values(CONFIG.themeColors)),
      });
    }
    // Draw
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      b.y += b.vy * dt;
      if (b.y < -30) { this.balloons.splice(i, 1); continue; }
      ctx.save();
      ctx.fillStyle = b.color;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.r * 0.8, b.r, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px Poppins, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.letter, b.x, b.y + 5);
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r);
      ctx.lineTo(b.x, b.y + b.r + 10);
      ctx.stroke();
      ctx.restore();
    }
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('click', this._tap);
      this.canvas.removeEventListener('touchstart', this._tap);
    }
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 3: WHACK-A-GIFT
   ============================================================ */
class WhackGift extends GameBase {
  start() {
    this.target = CONFIG.difficulty.whackGift.target;
    this.score = 0;
    this.time = CONFIG.difficulty.whackGift.time;
    this.timeLeft = this.time;
    this.holes = [];
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Whack-a-Gift 🎁</div></div>
      <p class="game-instruction">Tap gifts as they pop up! Reach ${this.target} in ${this.time}s!</p>
      <div class="game-stats">
        <span>Score: <span class="game-stat-value" id="wg-score">0</span>/${this.target}</span>
        <span>Time: <span class="game-stat-value" id="wg-time">${this.time}</span>s</span>
      </div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="wg-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#wg-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    // 3x3 grid of holes
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        this.holes.push({
          x: (c + 0.5) * (w / 3),
          y: (r + 0.5) * (h / 3),
          active: false,
          emoji: '',
          timer: 0,
          isBomb: false,
        });
      }
    }
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.loop();
  }

  setupInput() {
    this._tap = (e) => {
      if (this.paused) return;
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      for (const h of this.holes) {
        if (h.active && Math.abs(x - h.x) < 35 && Math.abs(y - h.y) < 35) {
          if (h.isBomb) {
            this.score = Math.max(0, this.score - 2);
            audio.lose();
          } else {
            this.score++;
            audio.pop();
          }
          $('#wg-score', this.container).textContent = this.score;
          h.active = false;
          if (this.score >= this.target) {
            this.running = false;
            journey.saveHighScore('whack', this.score);
            this.container.innerHTML += `<div class="game-result"><h2>You did it! 🎉</h2><button class="btn btn-primary" id="wg-done">Done</button></div>`;
            $('#wg-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
            return;
          }
          break;
        }
      }
    };
    this.canvas.addEventListener('click', this._tap);
    this.canvas.addEventListener('touchstart', this._tap, { passive: false });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Time
    this.timeLeft -= dt / 60;
    $('#wg-time', this.container).textContent = Math.ceil(this.timeLeft);
    if (this.timeLeft <= 0) {
      this.fail();
      setTimeout(() => this.start(), 1000);
      return;
    }
    // Spawn
    this.spawnTimer += dt;
    if (this.spawnTimer > 40) {
      this.spawnTimer = 0;
      const empty = this.holes.filter(h => !h.active);
      if (empty.length) {
        const h = pick(empty);
        h.active = true;
        h.isBomb = Math.random() < 0.15;
        h.emoji = h.isBomb ? '💣' : pick(['🎁', '🎀', '💝', '🎉']);
        h.timer = 90;
      }
    }
    // Draw
    this.holes.forEach(h => {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(h.x, h.y + 10, 32, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      if (h.active) {
        h.timer -= dt;
        if (h.timer <= 0) { h.active = false; return; }
        const scale = clamp(h.timer / 90, 0, 1);
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.scale(1, scale);
        ctx.font = '32px serif';
        ctx.textAlign = 'center';
        ctx.fillText(h.emoji, 0, 5);
        ctx.restore();
      }
    });
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('click', this._tap);
      this.canvas.removeEventListener('touchstart', this._tap);
    }
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 4: SNAKE (birthday themed)
   ============================================================ */
class SnakeGame extends GameBase {
  start() {
    this.cellSize = 16;
    this.cols = 20;
    this.rows = 20;
    this.snake = [{ x: 10, y: 10 }];
    this.dir = { x: 1, y: 0 };
    this.nextDir = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.speed = CONFIG.difficulty.snake.speed;
    this.moveTimer = 0;
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Snake 🐍</div></div>
      <p class="game-instruction">Swipe or arrow keys to move. Eat cupcakes!</p>
      <div class="game-stats"><span>Score: <span class="game-stat-value" id="sn-score">0</span></span></div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="sn-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#sn-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.cols * this.cellSize;
    const h = this.rows * this.cellSize;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.loop();
  }

  spawnFood() {
    return { x: randInt(0, this.cols - 1), y: randInt(0, this.rows - 1) };
  }

  setupInput() {
    this._key = (e) => {
      if (e.key === 'ArrowUp' && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
      if (e.key === 'ArrowDown' && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
      if (e.key === 'ArrowLeft' && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
      if (e.key === 'ArrowRight' && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
    };
    this._touch = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      const hx = this.snake[0].x * this.cellSize + this.cellSize / 2;
      const hy = this.snake[0].y * this.cellSize + this.cellSize / 2;
      const dx = x - hx, dy = y - hy;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0 && this.dir.x === 0) this.nextDir = { x: 1, y: 0 };
        else if (dx < 0 && this.dir.x === 0) this.nextDir = { x: -1, y: 0 };
      } else {
        if (dy > 0 && this.dir.y === 0) this.nextDir = { x: 0, y: 1 };
        else if (dy < 0 && this.dir.y === 0) this.nextDir = { x: 0, y: -1 };
      }
    };
    window.addEventListener('keydown', this._key);
    this.canvas.addEventListener('touchstart', this._touch, { passive: true });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cols * this.cellSize, this.rows * this.cellSize);
    if (!this._moveAccum) this._moveAccum = 0;
    this._moveAccum += dt;
    if (this._moveAccum >= this.speed) {
      this._moveAccum = 0;
      this.dir = this.nextDir;
      const head = { x: this.snake[0].x + this.dir.x, y: this.snake[0].y + this.dir.y };
      if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows ||
          this.snake.some(s => s.x === head.x && s.y === head.y)) {
        this.running = false;
        journey.saveHighScore('snake', this.score);
        this.container.innerHTML += `<div class="game-result"><h2>Game Over! Score: ${this.score}</h2><button class="btn btn-primary" id="sn-done">Done</button></div>`;
        $('#sn-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
        return;
      }
      this.snake.unshift(head);
      if (head.x === this.food.x && head.y === this.food.y) {
        this.score++;
        audio.coin();
        $('#sn-score', this.container).textContent = this.score;
        this.food = this.spawnFood();
      } else {
        this.snake.pop();
      }
    }
    // Draw food
    ctx.font = `${this.cellSize - 2}px serif`;
    ctx.textAlign = 'center';
    ctx.fillText('🧁', this.food.x * this.cellSize + this.cellSize / 2, this.food.y * this.cellSize + this.cellSize - 2);
    // Draw snake
    this.snake.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? CONFIG.themeColors.c1 : CONFIG.themeColors.c2;
      ctx.beginPath();
      ctx.arc(s.x * this.cellSize + this.cellSize / 2, s.y * this.cellSize + this.cellSize / 2, this.cellSize / 2 - 1, 0, Math.PI * 2);
      ctx.fill();
    });
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    window.removeEventListener('keydown', this._key);
    if (this.canvas) this.canvas.removeEventListener('touchstart', this._touch);
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 5: FLAPPY BALLOON
   ============================================================ */
class FlappyBalloon extends GameBase {
  start() {
    this.balloon = { x: 80, y: 200, vy: 0 };
    this.pipes = [];
    this.score = 0;
    this.gap = CONFIG.difficulty.flappyBalloon.gap;
    this.canvas = null;
    this.ctx = null;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Flappy Balloon 🎈</div></div>
      <p class="game-instruction">Tap to float through candle obstacles!</p>
      <div class="game-stats"><span>Score: <span class="game-stat-value" id="fb-score">0</span></span></div>
      <div class="game-canvas-wrapper"><canvas class="game-canvas" id="fb-canvas"></canvas></div>
    `;
    this.container.appendChild(this.showControls());
    const canvas = $('#fb-canvas', this.container);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.min(window.innerWidth - 40, 400);
    const h = Math.min(window.innerHeight * 0.5, 400);
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    this.ctx = canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.canvas = canvas;
    this.cw = w; this.ch = h;
    this.balloon.y = h / 2;
    this.setupInput();
    this.running = true;
    this.lastTime = performance.now();
    this.spawnTimer = 0;
    this.loop();
  }

  setupInput() {
    this._tap = (e) => {
      if (this.paused) return;
      e.preventDefault();
      this.balloon.vy = -6;
      audio.pop();
    };
    this.canvas.addEventListener('mousedown', this._tap);
    this.canvas.addEventListener('touchstart', this._tap, { passive: false });
  }

  loop() {
    if (!this.running) return;
    if (this.paused) { this.rafId = requestAnimationFrame(this.loop.bind(this)); return; }
    const now = performance.now();
    const dt = (now - this.lastTime) / 16.67;
    this.lastTime = now;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.cw, this.ch);
    // Physics
    this.balloon.vy += 0.25 * dt;
    this.balloon.y += this.balloon.vy * dt;
    // Spawn pipes
    this.spawnTimer += dt;
    if (this.spawnTimer > 90) {
      this.spawnTimer = 0;
      const gapY = rand(60, this.ch - 60 - this.gap);
      this.pipes.push({ x: this.cw, gapY, passed: false });
    }
    // Update pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= 2 * dt;
      // Draw candles as obstacles
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      for (let y = 0; y < p.gapY; y += 30) ctx.fillText('🕯️', p.x, y + 25);
      for (let y = p.gapY + this.gap; y < this.ch; y += 30) ctx.fillText('🕯️', p.x, y + 25);
      if (!p.passed && p.x < this.balloon.x) {
        p.passed = true;
        this.score++;
        audio.coin();
        $('#fb-score', this.container).textContent = this.score;
      }
      // Collision
      if (Math.abs(p.x - this.balloon.x) < 20 && (this.balloon.y < p.gapY || this.balloon.y > p.gapY + this.gap)) {
        this.running = false;
        journey.saveHighScore('flappy', this.score);
        this.container.innerHTML += `<div class="game-result"><h2>Score: ${this.score}!</h2><button class="btn btn-primary" id="fb-done">Done</button></div>`;
        $('#fb-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
        return;
      }
      if (p.x < -30) this.pipes.splice(i, 1);
    }
    // Bounds
    if (this.balloon.y < 0 || this.balloon.y > this.ch) {
      this.running = false;
      journey.saveHighScore('flappy', this.score);
      this.container.innerHTML += `<div class="game-result"><h2>Score: ${this.score}!</h2><button class="btn btn-primary" id="fb-done">Done</button></div>`;
      $('#fb-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
      return;
    }
    // Draw balloon
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎈', this.balloon.x, this.balloon.y + 10);
    this.rafId = requestAnimationFrame(this.loop.bind(this));
  }

  destroy() {
    this.running = false;
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this._tap);
      this.canvas.removeEventListener('touchstart', this._tap);
    }
    super.destroy();
  }
}

/* ============================================================
   BONUS ARCADE GAME 6: SLIDING PUZZLE (3x3 using a photo)
   ============================================================ */
class SlidingPuzzle extends GameBase {
  start() {
    this.size = CONFIG.difficulty.slidingPuzzle.size;
    this.photoIdx = 0;
    this.photo = CONFIG.photos[this.photoIdx];
    this.tiles = [];
    this.moves = 0;
    this.solved = false;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Sliding Puzzle 🧩</div></div>
      <p class="game-instruction">Slide tiles to complete the photo!</p>
      <div class="game-stats"><span>Moves: <span class="game-stat-value" id="sp-moves">0</span></span></div>
      <div id="sp-grid" style="display:grid;grid-template-columns:repeat(${this.size},1fr);gap:2px;width:min(80vw,300px);aspect-ratio:1;margin:0 auto;border-radius:12px;overflow:hidden;"></div>
    `;
    this.container.appendChild(this.showControls());
    // Create tiles 0..n-1, last is empty
    const n = this.size * this.size;
    this.tiles = Array.from({ length: n - 1 }, (_, i) => i);
    this.tiles.push(null); // empty slot
    // Shuffle
    for (let i = 0; i < 100; i++) {
      const valid = this.getValidMoves();
      const m = pick(valid);
      this.move(m, false);
    }
    this.moves = 0;
    this.render();
  }

  getValidMoves() {
    const empty = this.tiles.indexOf(null);
    const r = Math.floor(empty / this.size), c = empty % this.size;
    const moves = [];
    if (r > 0) moves.push(empty - this.size);
    if (r < this.size - 1) moves.push(empty + this.size);
    if (c > 0) moves.push(empty - 1);
    if (c < this.size - 1) moves.push(empty + 1);
    return moves;
  }

  move(idx, count = true) {
    const empty = this.tiles.indexOf(null);
    const valid = this.getValidMoves();
    if (!valid.includes(idx)) return;
    [this.tiles[empty], this.tiles[idx]] = [this.tiles[idx], this.tiles[empty]];
    if (count) {
      this.moves++;
      audio.click();
      this.render();
      this.checkSolved();
    }
  }

  render() {
    const grid = $('#sp-grid', this.container);
    if (!grid) return;
    grid.innerHTML = '';
    const n = this.size * this.size;
    const pct = 100 / this.size;
    this.tiles.forEach((t, i) => {
      const el = document.createElement('div');
      el.style.cssText = `position:relative;overflow:hidden;cursor:pointer;background:#1a0a2e;`;
      if (t === null) {
        el.style.background = 'rgba(0,0,0,0.3)';
        el.style.cursor = 'default';
      } else {
        const r = Math.floor(t / this.size), c = t % this.size;
        el.style.backgroundImage = `url(${this.photo.src})`;
        el.style.backgroundSize = `${this.size * 100}% ${this.size * 100}%`;
        el.style.backgroundPosition = `${(c / (this.size - 1)) * 100}% ${(r / (this.size - 1)) * 100}%`;
        el.addEventListener('click', () => this.move(i));
      }
      grid.appendChild(el);
    });
    const m = $('#sp-moves', this.container);
    if (m) m.textContent = this.moves;
  }

  checkSolved() {
    for (let i = 0; i < this.tiles.length - 1; i++) {
      if (this.tiles[i] !== i) return;
    }
    this.solved = true;
    journey.saveHighScore('puzzle', this.moves);
    audio.win();
    this.container.innerHTML += `<div class="game-result"><h2>Solved in ${this.moves} moves! 🎉</h2><button class="btn btn-primary" id="sp-done">Done</button></div>`;
    $('#sp-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
  }
}

/* ============================================================
   BONUS ARCADE GAME 7: REACTION TAP
   ============================================================ */
class ReactionTap extends GameBase {
  start() {
    this.rounds = CONFIG.difficulty.reactionTap.rounds;
    this.current = 0;
    this.times = [];
    this.waiting = false;
    this.lit = false;
    this.startTime = 0;
    this.container.innerHTML = `
      <div class="game-header"><div class="game-title">Reaction Tap ⚡</div></div>
      <p class="game-instruction">Tap when the candle lights up! ${this.rounds} rounds.</p>
      <div class="game-stats"><span>Round: <span class="game-stat-value" id="rt-round">1</span>/${this.rounds}</span><span>Best: <span class="game-stat-value" id="rt-best">—</span></span></div>
      <div id="rt-area" style="width:min(80vw,300px);height:300px;display:flex;align-items:center;justify-content:center;border-radius:20px;background:rgba(255,255,255,0.05);border:1px solid var(--glass-border);cursor:pointer;font-size:5rem;">🕯️</div>
    `;
    this.container.appendChild(this.showControls());
    this.area = $('#rt-area', this.container);
    this.area.addEventListener('click', () => this.handleTap());
    this.nextRound();
  }

  nextRound() {
    if (this.current >= this.rounds) {
      const best = Math.min(...this.times);
      journey.saveHighScore('reaction', Math.round(best));
      this.container.innerHTML += `<div class="game-result"><h2>Best: ${Math.round(best)}ms 🎉</h2><button class="btn btn-primary" id="rt-done">Done</button></div>`;
      $('#rt-done', this.container).addEventListener('click', () => { this.destroy(); if (this.onWin) this.onWin(); });
      return;
    }
    this.current++;
    $('#rt-round', this.container).textContent = this.current;
    this.waiting = true;
    this.lit = false;
    this.area.textContent = '🕯️';
    this.area.style.background = 'rgba(255,255,255,0.05)';
    const delay = rand(1000, 3000);
    this._timeout = setTimeout(() => {
      if (!this.waiting) return;
      this.lit = true;
      this.waiting = false;
      this.startTime = performance.now();
      this.area.textContent = '🔥';
      this.area.style.background = 'rgba(255,217,61,0.2)';
    }, delay);
  }

  handleTap() {
    if (this.paused) return;
    if (this.waiting) {
      // Too early
      this.waiting = false;
      clearTimeout(this._timeout);
      audio.lose();
      this.area.textContent = '❌';
      this.area.style.background = 'rgba(255,110,199,0.2)';
      setTimeout(() => this.nextRound(), 1000);
    } else if (this.lit) {
      const time = performance.now() - this.startTime;
      this.times.push(time);
      this.lit = false;
      audio.pop();
      const best = Math.min(...this.times);
      $('#rt-best', this.container).textContent = Math.round(best) + 'ms';
      this.area.textContent = '✅';
      setTimeout(() => this.nextRound(), 800);
    }
  }

  destroy() {
    clearTimeout(this._timeout);
    super.destroy();
  }
}

/* ============================================================
   INITIALIZATION
   ============================================================ */
let journey;
let particleEngine;
let sparkleTrail;

function init() {
  // Apply URL override
  const urlName = getURLParam('name');
  if (urlName) CONFIG.name = urlName;

  // Apply theme colors
  applyThemeColors();

  // Apply saved mute setting
  const savedMuted = getSetting('muted', false);
  audio.muted = savedMuted;

  // Init particle engine
  particleEngine = new ParticleEngine($('#ambient-canvas'));
  particleEngine.start();

  // Init sparkle trail
  sparkleTrail = new SparkleTrail($('#sparkle-canvas'));

  // Init journey
  journey = new Journey();
  journey.init();

  // Setup top bar buttons
  const muteBtn = $('#mute-btn');
  muteBtn.textContent = savedMuted ? '🔇' : '🔊';
  muteBtn.addEventListener('click', () => {
    audio.init();
    const m = !audio.muted;
    audio.setMuted(m);
    muteBtn.textContent = m ? '🔇' : '🔊';
  });

  const musicBtn = $('#music-btn');
  musicBtn.addEventListener('click', () => {
    audio.init();
    audio.resume();
    const playing = audio.toggleMusic();
    musicBtn.textContent = playing ? '🎵' : '🔇';
  });

  const themeBtn = $('#theme-btn');
  const savedTheme = getSetting('theme', 'dark');
  if (savedTheme === 'light') document.body.classList.add('light-theme');
  themeBtn.textContent = savedTheme === 'light' ? '☀️' : '🌙';
  themeBtn.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light-theme');
    saveSetting('theme', isLight ? 'light' : 'dark');
    themeBtn.textContent = isLight ? '☀️' : '🌙';
  });

  // Show topbar after loader
  setTimeout(() => {
    $('#loader').classList.add('fade-out');
    $('#topbar').classList.remove('hidden');
    setTimeout(() => $('#loader').remove(), 600);
  }, 1500);

  // Visibility change — pause everything
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (journey && journey.activeGame) journey.activeGame.stop();
      if (particleEngine) particleEngine.stop();
      if (audio.musicEl) audio.musicEl.pause();
    } else {
      if (particleEngine) particleEngine.start();
      if (audio.musicPlaying && audio.musicEl) audio.musicEl.play().catch(() => {});
      if (journey && journey.activeGame) { journey.activeGame.running = true; journey.activeGame.lastTime = performance.now(); if (journey.activeGame.loop) journey.activeGame.rafId = requestAnimationFrame(journey.activeGame.loop.bind(journey.activeGame)); }
    }
  });

  // Prevent context menu on canvases
  document.addEventListener('contextmenu', e => { if (e.target.tagName === 'CANVAS') e.preventDefault(); });

  // Prevent double-tap zoom
  let lastTouch = 0;
  document.addEventListener('touchend', e => {
    const now = Date.now();
    if (now - lastTouch < 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
