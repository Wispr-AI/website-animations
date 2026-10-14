# Marketers hero

Combines the homepage Flow reveal and cleanup chapters in one responsive hero card. Adapted from `aquaNeon/wispr` flow-stack.js at `beb8130cca3dd9d229bad1c7d66b11413b187232`.

## Webflow setup

Use one `.flow_220-wpm.is-marketers-hero` with `data-flow-hero="marketers"`. Keep its responsive layout, static background, typography and spacing in Webflow. The script injects animation states only; it needs no GSAP or other library.

Keep these descendants from the copied homepage card:

- `[data-type="raw"]` inside its transcript wrapper, including the existing category spans.
- `[data-flow="composer"]` containing `[data-flow="msg-grow"]`, `.flow_message-placeholder`, `[data-type="polished"]`, and the toolbar.
- `[data-flow="pill-audio"]` containing the existing `[data-anim="audio"]` SVG.
- `.flow_pill-anim-wrap` containing the filler, correction and repetition `[data-pill]` labels.
- `[data-pill="polishing"]` with `.flow_pill-polish_wrap`, `.flow_text-polish-type`, and `[data-flow="spinner"]`.

The script creates the spinner SVG, label character spans, transcript word spans and completion dots. Do not add those manually. Use this controller without the original flow-stack controller targeting the same card.

## Local development

Serve the repository root with Cursor Live Server. Add this to the marketers page head (adjust the port to match Live Server):

```html
<script defer src="http://127.0.0.1:5500/animations/marketers-hero/marketers-hero.js"></script>
```

Publish the page to staging and keep Live Server running on the computer viewing it. Localhost resolves to the viewing computer, so this URL does not provide remote-device testing. Refresh staging after changing JS. GitHub/CDN hosting is a separate step after staging review.

Optional published-page flash prevention, without hiding the labels in Designer:

```html
<style>
html:not(.wf-design-mode) [data-flow-hero="marketers"] .flow_pill-anim-wrap,
html:not(.wf-design-mode) [data-flow-hero="marketers"] [data-pill="polishing"] {
  opacity: 0;
}
</style>
```

## Playback

The reveal chapter runs for 9.5 seconds, including its end hold. Cleanup follows for 6.2 seconds using the original gradient, wave, masked exit, message expansion calculations. The single background stays fixed. Playback starts when the card intersects the viewport, pauses offscreen or in a hidden tab, and loops after a 2-second completed-message hold and a 1.8-second eased reset. During reset the result fades out, the message box collapses with its toolbar anchored, and the placeholder and recording indicator fade back in. Reduced-motion users see the completed message immediately.

Measurements update after fonts load and when card width changes. Review desktop, tablet and phone widths on staging, especially the fully revealed transcript, cleanup handoff and expanded message.

Console helpers for development:

```js
MarketersHero.replay();   // Restart normal playback.
MarketersHero.seek(11);   // Pause at this second in the combined timeline.
MarketersHero.refresh();  // Recalculate geometry, preserving progress.
MarketersHero.destroy();  // Restore the authored card markup and styles.
```

Loading the script again first destroys its previous controller to avoid duplicate generated elements.
