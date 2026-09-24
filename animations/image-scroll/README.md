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

Desktop >=992px: existing image wrappers move into the stage, where Webflow's single-cell grid overlaps them. Copy stays in its item. Below 992px: images return to their original locations; inline desktop states and animation listeners are removed. No clones, duplicate copy, sticky animation or playback loops on mobile.

## Webflow styling contract

- Desktop stage: sticky, top 0, height 100vh, width100%, one grid column/row, align-items center and justify-items start. Its ancestor overflow must permit sticky positioning.
- Desktop image wrappers: grid-area `1 / 1 / 2 / 2`, position relative, equal dimensions/aspect ratios chosen in Webflow. Current design: width30vw, max400px, ratio400/233, padding0, overflowclip.
- Track and list: retain the current desktop column layout, track margins and list's40% left padding/160px gap.
- Tablet: track visible as vertical flex, stage hidden, list left padding0, item stacks image above copy. Webflow controls all smaller-breakpoint sizing, gaps, image fitting, typography, colors and borders.
- Images: width/height100%, object-fit cover or contain as desired. Reserve image geometry through the wrapper's aspect ratio.

## Preserved animation behavior

220ms CSS `ease` crossfade, 1.04-to-1 scale over300ms with GSAP `back.out(2)`, inactive copy opacity0.35. Active item is the copy midpoint nearest the image center minus8vh. This is CSS sticky and ordinary scrolling, not scroll pinning, snapping or a tab timeline.

To reproduce the original geometry, JS owns the desktop list's15vh top lead, -72vh vertical lift, calculated ending padding/margin and24px extra margin between items. That extra margin adds to Webflow's list gap. JS restores authored inline styles on returning to mobile. Other layout values remain in Webflow.

Reduced motion disables crossfade and scale-pop but keeps selection and the responsive layout. Scroll work is scheduled on demand, without a continuously running card-animation ticker. Image/font loads, element resizing, viewport resizing and optional ScrollTrigger refreshes trigger remeasurement.
