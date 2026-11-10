# Home

Homepage scripts. Both moved unchanged from `aquaNeon/wispr` and byte-identical to the files live on wisprflow.ai.

| Script | What it does | Moved from |
|---|---|---|
| `flow-stack.js` | Flow chapters: scroll-pinned card stack with transcript reveal, cleanup, marquees and scroll-scrubbed corners | `flow-stack.js` at `beb8130cca3dd9d229bad1c7d66b11413b187232` |
| `languages.js` | Languages section: four animated cards. Desktop (992px and up) crossfades the card nearest the viewport centre; mobile clones each card into its stack slot and loops it in view. DOM contract at the top of the file | `languages.js` at `c35d10c0162737be7c60d8c6271c7b63687958ca` |

## Webflow setup

- Pages: /
- Dependencies: GSAP and ScrollTrigger, loaded by the page before these scripts.
- Hooks, flow-stack: `[data-flow]`, `[data-type]`, `[data-pill]`, `[data-tab-anim]`, `[data-corners]`
- Hooks, languages: `[data-lang]`, `[data-lang-anim]`, `[data-lang-play]`, `[data-lang-flag]`, `[data-tone]`, `[data-vocab]`

```html
<!-- WPM and SCROLLYTELLING animation -->
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/home/flow-stack.js"></script>
<!-- LANGUAGES SCROLLYTELLING -->
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/home/languages.js"></script>
```

Replace the old `cdn.jsdelivr.net/gh/aquaNeon/wispr@.../flow-stack.js` and `.../languages.js` tags. Do not load both.

## Local development

Serve the repository root with Live Server and point the page at `/animations/home/flow-stack.js` and `/animations/home/languages.js`. `node --check` on either file validates syntax.
