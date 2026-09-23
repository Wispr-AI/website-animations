# Notetaker tabs validation

No test runner installation is required. From the repository root, check browser-script syntax with:

```sh
node --check animations/notetaker-tabs/notetaker-tabs.js
```

For behavioral changes or the first hosted deployment, use the Webflow test page:

- First pair visible on arrival; centered image and right-anchored copy.
- Click every tab forward/back; one selected image/copy; indicator follows.
- Scroll through tab boundaries and beyond the section; pin releases.
- Arrow keys/Home/End/Enter/Space navigate correctly.
- Melt appears when supported; actual images remain after transition.
- Three SVG waves draw/retract; final tabs without a wave retract all waves.
- Resize desktop→tablet/phone→desktop; no duplicate pins/canvases or hidden mobile copy.
- Mobile images appear before matching copy; no horizontal overflow.
- Check reduced motion and image fallback when making relevant changes.
- When modifying count handling, exercise matching3/4/5-tab markup.
- After switching to hosting, repeat a short smoke test with Live Server off and check browser errors.

Historical Python fixtures and downloaded assets remain in ignored `.local/context/tests` and `.local/context/reference`. They record earlier stages, may contain obsolete simulated styles, and are not the current production-layout authority. Current layout lives in Webflow.
