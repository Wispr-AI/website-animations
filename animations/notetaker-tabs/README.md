# Notetaker tabs

Scroll-driven desktop tabs with static images, a WebGL melt transition and SVG background waves. At widths below992px, the same authored content becomes ordinary image/copy stacks. Three, four and five tabs have been exercised during development.

## Dependencies and loading

Requires the page's GSAP and ScrollTrigger globals for desktop interaction. Validated with3.15.0. The script initializes on DOMContentLoaded, with a load-event fallback. If inserted after page load, dependencies must already be available. Do not load the original stack.js alongside this controller.

For local development, serve the repository root and use:

```html
<script src="http://127.0.0.1:5500/animations/notetaker-tabs/notetaker-tabs.js"></script>
```

For production, replace the URL with the verified commit-pinned CDN URL recorded in docs/releases.md. No external stylesheet is required; layout is authored in Webflow.

## Markup contract

Each section has `data-nt-tabs="icp"` and contains one `data-nt-pin` viewport. Inside it, retain the meeting_tabs_contain, meeting_tabs_grid, meeting_tabs_nav and data-tab-indicator structure.

- Navigation: `.meeting_tabs_item[data-nt-tab="N"]`.
- Feature wrapper: `.nt_feature[data-nt-feature="N"]`.
- Direct image child: `.tab_anim.is-icp-image[data-tab-anim="N"]`, containing `.nt_tab_image`.
- Direct copy child: `.tab_copy.is-icp-copy[data-tab-text="N"]`, containing `.meeting_tabs_heading` and `.meeting_tabs_paragraph`.

All four index sets must match and be contiguous from0. Keep image before copy in each feature. Only the first nav/image/copy gets `is-active` in authored HTML. Features themselves stay visible. Copy and image sources remain editable in Webflow. The selector value `icp` is required but does not restrict the page URL.

## Webflow layout

Reuse the verified Webflow section and its styles when creating another page. Desktop outer grid:12 equal columns,16px gap. Every feature occupies columns5–12 in row1 and uses an inner grid with8 columns `minmax(0,1fr)`, one row and16px gaps. Feature position must be relative; the generated melt overlay uses it as its containing block.

Raw CSS grid areas (exclusive boundary lines): feature `1 / 5 / 2 / 13`; image `1 / 1 / 2 / 5`; copy `1 / 6 / 2 / 9`. Webflow's occupied-cell End controls use columns12,4,8 and row1 respectively. Apply placement to every instance. Copy self-aligns right and bottom; desktop text stays left-aligned. Keep feature/image/copy min-width0. Centered object-fit:cover on the image allows the shader to match its crop.

Below992px: viewport has no minimum viewport height or sticky behavior; hide nav and waves; grid/features use vertical flex layout; all image/copy pairs remain in normal document flow. Refine sizes/spacing/typography in Webflow. Do not reintroduce separate mobile content.

Keep this small preview/indicator embed in the section:

```html
<style>
@media (min-width: 992px) {
  [data-nt-tabs='icp'] [data-nt-feature] > [data-tab-anim],
  [data-nt-tabs='icp'] [data-nt-feature] > [data-tab-text] {
    opacity: 0; visibility: hidden;
  }
  [data-nt-tabs='icp'] [data-nt-feature] > [data-tab-anim].is-active,
  [data-nt-tabs='icp'] [data-nt-feature] > [data-tab-text].is-active {
    opacity: 1; visibility: visible;
  }
}
[data-nt-tabs='icp'] .meeting_tabs_nav { position: relative; }
[data-nt-tabs='icp'] [data-tab-indicator] {
  position: absolute; left: 0; top: 0; width: 5px;
  border-radius: 16px; z-index: 2;
}
</style>
```

Style indicator color and initial height in Webflow. The controller owns its animated height/transform, label color, panel visibility and copy transitions. Preserve unrelated corner/hero scripts on the page.

## Behavior and configuration

CONFIG at the top of the script sets the992px breakpoint, one viewport-height step per ordinary tab,0.35 viewport-height final hold,0.9/0.4s wave draw/retract and0.7s melt. Existing waves map in DOM order from data-tab-bg SVGs. A tab beyond the available waves retracts them all; adding a tab does not create a wave.

The melt overlay uses anonymous-CORS textures. If WebGL, texture loading or centered cover fitting is unavailable, image panel fades remain the fallback. Reduced-motion preference skips melt and timed transitions. Breakpoint teardown removes pinning, canvas, handlers and owned attributes. Reloading the script destroys its previous controller first.

Development API: `window.NotetakerTabs.refresh()` and `window.NotetakerTabs.destroy()`.

See [validation checklist](../../tests/notetaker-tabs/README.md). The current published four-tab section passed final review before repository organization; only its filesystem location has changed.
