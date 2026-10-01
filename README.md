# Birthday Journey 🎂 — A Gamified Birthday Wishing Website

A complete, production-quality, mobile-first birthday wishing website that works as a gamified "journey." Visitors play short mini-games to unlock heartfelt messages, photos, a cake, wishes, and a grand celebration finale.

## Features

- **7 journey sections** (Hero → Message → Photos → Cake → Wishes → Celebration → Bonus Arcade)
- **5 gate mini-games** (Tic-Tac-Toe, Memory Match, Catch Gifts, Shoot Bottles, Fruit Ninja)
- **7 bonus arcade games** (Archery, Balloon Pop, Whack-a-Gift, Snake, Flappy Balloon, Sliding Puzzle, Reaction Tap)
- **Glassmorphism + neon pastel** visual design with animated gradient backgrounds
- **Web Audio API** synthesized sound effects (no audio files needed)
- **Ambient particle system** (floating balloons, stars, petals)
- **Cursor sparkle trail** on desktop
- **Microphone candle blowing** with tap fallback
- **Fireworks finale** on canvas
- **Progress saving** via localStorage
- **Fully responsive** (320px → 4K), touch + mouse + keyboard support
- **Accessibility**: semantic HTML, aria-labels, focus states, prefers-reduced-motion support
- **SEO/OG meta tags**, PWA-friendly theme-color, inline emoji SVG favicon
- **Dark/light theme toggle**
- **Zero dependencies** — pure HTML5 + CSS3 + Vanilla JS

## How to Customize

Open `script.js` and edit the `CONFIG` object at the top:

### Basic Personalization
```js
const CONFIG = {
  name: 'Sarah',          // Birthday person's name
  nickname: 'Sar',        // Short nickname
  age: 25,                // Age (determines candle count, max 10)
  senderName: 'Your Best Friend',  // Who the message is from
  // ...
}
```

### Theme Colors
```js
themeColors: {
  c1: '#ff6ec7',  // pink (primary)
  c2: '#7873f5',  // purple (secondary)
  c3: '#ffd93d',  // gold (accent)
  c4: '#6ee7b7',  // mint (success)
  c5: '#f97316',  // orange (warning)
  c6: '#38bdf8',  // sky (info)
}
```

### Photos
Replace the 6 photo entries with your own image URLs. Each has a `src` (URL) and `caption`:
```js
photos: [
  { src: 'https://example.com/photo1.jpg', caption: 'Sweet beginnings 🎂' },
  // ...add 6 total
]
```
If a photo fails to load, a birthday cake emoji placeholder is shown automatically.

### Message
The `mainMessage` is an array of paragraphs. Use `{name}` as a placeholder — it gets replaced with the birthday person's name automatically:
```js
mainMessage: [
  'Dear {name},',
  'Your message here...',
  'Happy Birthday! 🎂🎈',
]
```

### Wishes
The `wishes` array contains 6 birthday wishes, each revealed by breaking a bottle in the Shoot the Bottles game:
```js
wishes: [
  'May this year bring you endless joy! 🌈',
  // ...add 6 total
]
```

### Final Note
The `finalNote` appears at the celebration finale. Use `{name}` as a placeholder:
```js
finalNote: "Here's to you, {name} — today, tomorrow, and always. 💖"
```

### Background Music (Optional)
Paste a royalty-free MP3 URL into `musicUrl`. It starts playing after the first tap (browser autoplay policy). If empty or the file fails to load, everything still works — just no background music:
```js
musicUrl: 'https://example.com/birthday-music.mp3'
```

### URL Parameter Override
Add `?name=Sarah` to the URL to override the name dynamically. Example:
```
https://yourusername.github.io/birthday-journey/?name=Alex
```

### Difficulty Settings
Each game has its own difficulty settings under `CONFIG.difficulty`:
```js
difficulty: {
  ticTacToe: { smartChance: 0.7 },     // 0=all random, 1=always smart
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
}
```

## How to Add Photos

1. Upload your photos to any image hosting service (Imgur, Google Photos public link, your own server, etc.)
2. Copy the direct image URL (must end in `.jpg`, `.png`, etc.)
3. Paste it into the `photos` array in `CONFIG`
4. Add a caption for each photo

## How to Add Music

1. Find a royalty-free music file (try [Pixabay Music](https://pixabay.com/music/), [Free Music Archive](https://freemusicarchive.org/))
2. Copy the direct MP3 URL
3. Paste it into `CONFIG.musicUrl`
4. The music will start after the first user tap (required by browser autoplay policies)

## How to Deploy on GitHub Pages

1. Create a new GitHub repository
2. Upload `index.html`, `style.css`, and `script.js` to the repository root
3. Go to **Settings → Pages**
4. Under **Source**, select **Deploy from a branch**
5. Select **main** branch and **/ (root)** folder
6. Click **Save**
7. Your site will be live at `https://yourusername.github.io/repository-name/`

No build step needed — the files work as-is.

## How to Run Locally

Just open `index.html` in any modern browser. For microphone access (candle blowing), you need to serve over `localhost` or `https` — use a simple local server:
```bash
npx serve .
# or
python3 -m http.server 8000
```

## What Was Improved vs. a Basic Birthday Page

1. **Gamified journey** — 5 gate games unlock content progressively instead of showing everything at once
2. **7 bonus arcade games** with localStorage high scores for replayability
3. **Glassmorphism + neon pastel design** with animated gradient backgrounds and glass cards
4. **Ambient particle system** — floating balloons, twinkling stars, and falling petals
5. **Cursor sparkle trail** on desktop for delightful micro-interactions
6. **Web Audio API synthesized SFX** — no audio files needed, all sounds generated in code
7. **Microphone candle blowing** using getUserMedia with graceful tap fallback
8. **Canvas fireworks finale** with multi-colored rocket launches
9. **Progress saving** — completed sections are revisitable without replaying games
10. **Skip button** appears after 2 failed attempts so nobody gets stuck
11. **Progress tracker** (6 dots) at the top showing journey completion
12. **Typewriter effect** for the heartfelt message
13. **3D flip memory cards** with smooth CSS transforms
14. **Swipeable photo gallery** with polaroid styling and lightbox
15. **Responsive design** from 320px phones to 4K desktops
16. **Accessibility** — semantic HTML, aria-labels, focus states, prefers-reduced-motion support
17. **SEO/OG meta tags** driven by content for social sharing
18. **Dark/light theme toggle** with localStorage persistence
19. **Pause/restart/quit controls** in every game
20. **Delta-time animation** with requestAnimationFrame for smooth 60fps gameplay
21. **devicePixelRatio handling** for crisp canvases on retina displays
22. **Visibility change handling** — pauses everything when tab is hidden
23. **URL parameter override** for dynamic personalization
24. **Photo fallback** — broken images show emoji placeholder automatically
25. **Double-tap zoom prevention** and touch-action: none during games
