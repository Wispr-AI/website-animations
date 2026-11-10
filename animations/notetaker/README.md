# Notetaker hero

Notetaker hero: live transcript lines type in while task cards land in the deck beside them. Transcript content is edited in the script, not in the Designer; Webflow rows are styling templates per speaker.

Moved unchanged from `aquaNeon/wispr` `notetaker.js` at `5ee9d54cb777654c3816cefeef32a0644be88245`. Byte-identical to the file live on wisprflow.ai.

## Webflow setup

- Pages: /notetaker, /ai-meeting-summarizer
- Dependencies: None.
- Hooks: `[data-transcript]`, `[data-transcript-task]`, `[data-notetaker-ready]`

```html
<script src="https://cdn.jsdelivr.net/gh/Wispr-AI/website-animations@COMMIT/animations/notetaker/notetaker.js"></script>
```

Replace the old `cdn.jsdelivr.net/gh/aquaNeon/wispr@.../notetaker.js` tag. Do not load both.

## Local development

Serve the repository root with Live Server and point the page at `/animations/notetaker/notetaker.js`. `node --check animations/notetaker/notetaker.js` validates syntax.
