# Hinglish image scroll

Diwali-specific replacement for `animations/image-scroll/image-scroll.js`. Keeps its desktop sticky stage, mobile stacks, and other card animations. Every `data-scroll-card="languages"` card on the page shows the fixed **Hinglish** label, Indian flag, and this repeating sentence:

> Flow ke saath likho. Kal milte hain. Phir ideas par baat karte hain. Hindi ho ya English, baat apni rakho.

The sentence moves along the existing SVG curve at the original multilingual card’s movement speed, with one space between repetitions, while the card is selected and visible. Reduced motion shows a static sentence. Webflow still owns layout and responsive styling.

## Install on the Diwali page

Replace that page's existing image-scroll script tag with this file. **Do not load both scripts.** Keep the existing `data-scroll-card="languages"` and all `data-image-scroll` / `data-lang-*` attributes, SVG embed, and flags. No new attributes or CSS changes are needed. Keep Webflow's GSAP scripts.

For local development, serve the repository root with Cursor Live Server:

```html
<script src="http://127.0.0.1:5500/animations/hinglish-scroll/hinglish-scroll.js"></script>
```

Use a verified commit-pinned jsDelivr URL after publishing the script. Only replace the script tag on the Diwali page; other pages retain their original multilingual script.

See the [image scroll guide](../image-scroll/README.md) for the shared markup and Webflow layout contract.
