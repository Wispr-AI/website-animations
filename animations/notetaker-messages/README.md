# Notetaker messages

Standalone green message hero extracted from `aquaNeon/wispr@b0c1460/stack.js`. Keeps the entrance, check pop and highlighted-word glare/ripple. Messages remain in their authored positions; there is no card, reparenting, pin, gather, text replacement or tab choreography.

## Webflow setup

- Root: `.hero_contain.is-green.is-message-hero`. Preserve the original visible panel height in Webflow on this scoped combo class: desktop `calc(100vh + 2px)`, tablet `100vh`, mobile landscape/portrait `auto`. The old stack.js supplied the desktop/tablet heights in JavaScript; the standalone controller deliberately leaves sizing to Webflow. Keep existing content margins and message positions.
- Keep `.meeting_content`, `.meeting_heading`, and `.meeting_items` containing the six `[data-stack="item"]` rows. Keep their existing combo classes, `.meeting_check` and `.meeting_item_animate` contents.
- Optional `data-stack-order` sorts the entrance; absent values preserve DOM order.
- Remove the old card stages, spacer and stack/tab preview CSS.
- Keep the new `[data-nt-tabs="icp"]` section as a separate sibling. Its script remains unchanged.
- The outer hero section's `data-stack="section"` is not used by this controller; leaving it is harmless.

Replace the original stack.js tag with:

```html
<!-- NOTETAKER MESSAGE HERO — local development -->
<script src="http://127.0.0.1:5500/animations/notetaker-messages/notetaker-messages.js"></script>
```

Serve the repository with Cursor Live Server. Do not load stack.js alongside this script. GSAP and ScrollTrigger must be available by DOMContentLoaded or window load. Keep the separate notetaker.js and notetaker-tabs.js scripts.

## Behavior

At 768px and wider, the entrance starts when the green hero's top crosses 60% of the viewport. The first three rows pop together, followed by the remaining rows at 0.28-second intervals. Authored opacity is retained. Scrolling back above the threshold reverses the entrance and resets word effects. Rows remain revealed while scrolling farther down.

Below 768px and with reduced motion, the authored message layout is untouched. The existing Webflow mobile styles intentionally hide some rows. Tabs independently switch to their static layout below 992px.

The script also preserves the original scroll-rounded corners on `[data-corners]` elements, including the testimonial section. Empty attributes default to 80px. The green hero uses its authored corners on phones. Reduced motion leaves authored corners throughout.

Layout, typography and spacing stay in Webflow. No external stylesheet is needed.

`window.NotetakerMessages.refresh()` refreshes scroll measurements; `.destroy()` restores authored styles and word nodes. Loading the script again destroys its previous instance first. Other controllers are not destroyed.
