# Image scroll

Normal page scrolling with a sticky image stage on desktop and image/copy stacks on tablet/mobile. Content and design live in Webflow. GSAP supplied by Webflow enables the original scale-pop; selection and image crossfading also work without GSAP. ScrollTrigger is optional and used only to listen for layout refreshes.

## Install during development

Disable the original agency `languages.js` on the page containing this replacement. Keep the site's GSAP scripts and other animation scripts.

Serve the repository root with Live Server and add this to the page head:

```html
<script src="http://127.0.0.1:5500/animations/image-scroll/image-scroll.js"></script>
```

The script waits for DOMContentLoaded when necessary. Reload the published test page after saving JS changes. No Webflow republish is needed for JS-only edits once the local URL is installed. Browser permission to access localhost may be required. This URL is for local testing; replace it with a verified commit-pinned CDN URL when releasing.

## Structure

Use `data-image-scroll` with these values:

```text
section
  track
    stage (empty in authored HTML)
    list
      item
        image (wrapper containing a Webflow Image)
        copy (heading and supporting content)
      item
        image
        copy
```

Items must be direct children of `list`, each containing one image wrapper and one copy wrapper. DOM order defines the sequence. Duplicate, delete or reorder complete items in Webflow; no numeric indices or JS arrays need maintenance. Changes to the item count are read on page load. Multiple sections initialize independently. No class names are used as JS selectors.

Desktop >=992px: existing image wrappers move into the stage, where Webflow's single-cell grid overlaps them. Copy stays in its item. Below 992px: images return to their original locations; inline desktop states and animation listeners are removed. No clones, duplicate copy or sticky animation on mobile. Optional animated cards loop while visible.

## Webflow styling contract

- Desktop stage: sticky, top 0, height 100vh, width100%, one grid column/row, align-items center and justify-items start. Its ancestor overflow must permit sticky positioning.
- Desktop image wrappers: grid-area `1 / 1 / 2 / 2`, position relative, equal dimensions/aspect ratios chosen in Webflow. Current design: width30vw, max400px, ratio400/233, padding0, overflowclip.
- Track and list: retain the current desktop column layout, track margins and list's40% left padding/160px gap.
- Tablet: track visible as vertical flex, stage hidden, list left padding0, item stacks image above copy. Webflow controls all smaller-breakpoint sizing, gaps, image fitting, typography, colors and borders.
- Images: width/height100%, object-fit cover or contain as desired. Reserve image geometry through the wrapper's aspect ratio.

## Preserved animation behavior

220ms CSS `ease` crossfade, 1.04-to-1 scale over300ms with GSAP `back.out(2)`, inactive copy opacity0.35. Active item is the copy midpoint nearest the image center minus8vh. This is CSS sticky and ordinary scrolling, not scroll pinning, snapping or a tab timeline.

To reproduce the original geometry, JS owns the desktop list's15vh top lead, -72vh vertical lift, calculated ending padding/margin and24px extra margin between items. That extra margin adds to Webflow's list gap. JS restores authored inline styles on returning to mobile. Other layout values remain in Webflow.

Reduced motion disables crossfade and scale-pop but keeps selection and the responsive layout. Scroll work is scheduled on demand, without a continuously running ticker for image-only sections. Animated sections tick only while a card can play. Image/font loads, element resizing, viewport resizing and optional ScrollTrigger refreshes trigger remeasurement.


## Optional animated cards

Keep the same `data-image-scroll="image"` visual wrapper and add one of:

| Attribute | Card |
| --- | --- |
| `data-scroll-card="vocabulary"` | Vocabulary form, typing, toggle and added word |
| `data-scroll-card="tone"` | Formal / Casual / Very casual messages |
| `data-scroll-card="snippets"` | Spoken shortcut expands into saved text |
| `data-scroll-card="languages"` | Curved text with language label and flags |

Copy the complete corresponding homepage card, including internal attributes and SVG embeds. `data-lang-anim` is not used. Images and cards can be mixed in any item order; unmarked visual wrappers remain static images. Keep card layout in a scoped Webflow combo (for example `is-image-scroll-card`) so the image-only padding reset does not affect cards.

The card motion is adapted from the homepage `languages.js` at `c35d10c0162737be7c60d8c6271c7b63687958ca`. Do not load that original controller alongside this one. This remains a single-script install: replace the previous image-scroll tag, do not add a second copy.

On desktop only the selected visible card plays. On mobile each visible card plays independently. Leaving view or deselecting rewinds a card; hiding the browser tab pauses its clock. Vocabulary timers and typing share that clock. Reduced motion displays a static initial card state. Breakpoint changes restore authored internals before rebuilding, preventing nested word spans and duplicate SVG IDs.

Required card internals:

- Vocabulary: `data-vocab="list|new-chip|form|input|toggle-spell|add-word"`, the `data-vocab-knob` SVG element, and the existing `.lang_inner-card-wrap`. The optional add-new-word click target uses `data-vocab="add-btn"` or the copied `add-btn` attribute.
- Tone: buttons `data-tone="0|1|2"` and three text blocks `data-tone-msg="0|1|2"`. Text stays editable in Webflow.
- Snippets: `data-snip="line|slot|trigger|expand"`. Shortcut and expansion text stay editable in Webflow.
- Languages: `data-lang-name` on the SVG **textPath**, `data-lang-label`, and the copied `data-lang-flag="us|de|es|in"` elements. The script makes embed IDs unique and rewrites their references.

Optional `data-vocab-word` on the vocabulary card overrides the typed word (default `Wispr Flow`). Keep the authored new-word chip copy consistent with it. Language sentences/labels currently use the original four-language configuration in JS; the other authored card copy stays in Webflow. The curved text retains the homepage's desktop 36px SVG font override; on mobile the textPath keeps its authored embed styling.
