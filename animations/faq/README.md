# FAQ

Shared FAQ behavior for existing Webflow `.faq_wrap` modules. No dependencies or build step.

## Webflow setup

1. Copy `webflow-loader.html` into **Site settings → Custom code → Footer code**. Replace `COMMIT` with the commit containing the desired `faq.js` release.
2. Remove the old FAQ JavaScript from each page's before-`</body>` code and the supplied FAQ `<style>` block from each page head. Keep unrelated code and Designer styles.
3. Publish the affected pages. Verify one desktop question switch and one mobile accordion before rolling out widely.

The inline loader checks for `.faq_wrap [faq-item]` before requesting the CDN file. Pages without FAQs download no FAQ runtime and receive no injected CSS. Use the same pinned URL throughout the site. A new release requires updating this one URL and republishing affected pages.

## Markup and styling contract

Keep the existing `.faq_wrap`, `[faq-item]`, `[faq-question]`, `[faq-answer]`, `[faq-answer-wrap]`, `.faq_ans-hidden-wrap`, `.faq_arrow-wrap`, `.faq_ans-div`, `.faq_ans-wrap`, question list and gradient classes. Each module must have its own `.faq_wrap`. Content and number of questions can differ per page. Modules must be present when the footer loader runs; dynamically inserted modules are not automatically discovered.

Layout, typography, responsive styling and existing answer transitions remain in Webflow. The runtime inserts the supplied custom CSS once, scoped to `.faq_wrap`: hidden inline answers, gradient opacity transitions and custom scrollbars. Because this CSS loads asynchronously, a brief unstyled state can occur before the script arrives.

## Behavior

- Desktop starts at **768px**, matching the original script: first question selected, shared answer panel, 200ms delay before the answer swap, existing Webflow fade/height transitions.
- Below 768px: initially closed accordion, one answer open per module, arrow rotation. Existing Webflow height-transition settings are respected; the script adds no new duration.
- Each FAQ is independent. Repeated script execution does not bind a module twice.
- Pending transitions are cancelled when superseded or crossing breakpoints. Cleanup also works when no height transition fires.
- Clicking inside an expanded answer, including its links, does not collapse it.

Do not leave the original FAQ script installed alongside this one. Duplicate protection applies to this runtime, not to older inline implementations. Hosting does not change the existing markup's keyboard accessibility; that is a separate enhancement.
