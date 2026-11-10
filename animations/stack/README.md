# Notetaker stack

Notetaker page stack: transcript rows pop in, then gather into the summary card while the section is pinned. Landed pill text and colors are authored per row in Webflow.

Moved unchanged from `aquaNeon/wispr` `stack.js` at `b0c14604eb9796ebcbc6ee920620cde4522bfadd`. Byte-identical to the file live on wisprflow.ai.

## Webflow setup

- Pages: /notetaker
- Dependencies: GSAP and ScrollTrigger, loaded by the page before this script.
- Hooks: `[data-stack]`, `[data-stack-mode]`, `[data-stack-order]`, `[data-stack-landed]`, `[data-corners]`

```html
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/stack/stack.js"></script>
```

Replace the old `cdn.jsdelivr.net/gh/aquaNeon/wispr@.../stack.js` tag. Do not load both.

## Local development

Serve the repository root with Live Server and point the page at `/animations/stack/stack.js`. `node --check animations/stack/stack.js` validates syntax.
