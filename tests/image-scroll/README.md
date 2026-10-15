# Image/card scroll validation

Serve the repository root with Live Server and replace the previous image-scroll script tag on the Webflow staging page with the local file. Do not load both versions. Use the actual published Webflow CSS and card markup.

- Desktop: first two images still crossfade and copy dims. Select each card: vocabulary types the word, toggles, scrolls to the Add button and adds its chip; tone cycles three authored messages; snippet expands the shortcut into the URL; language text moves along its own curve while the label/flag updates.
- Leave a card selected through a complete loop. Switch away during vocabulary typing and return; there should be no late button pulse or stale word from its previous run.
- Mobile/tablet: all six original visual nodes return to their matching items, with an empty desktop stage. Only visible cards play. Check tone text and the vocabulary Add button fit, especially with short aspect ratios.
- Resize through 991/992px repeatedly: six visuals remain, tone word spans do not nest, and language SVG hrefs still resolve to their own paths.
- Put two sections on one page: each selects and plays independently and SVG IDs remain unique.
- Reduced motion: static readable card states, no animated word reveal, curve sweep, crossfade or scale-pop.
- Hidden browser tab: playback clocks pause. Returning must not jump ahead through a backlog of timers.
- Image-only sections: original behavior remains, no card ticker or generated card markup.

`node --check animations/image-scroll/image-scroll.js` validates syntax. Detailed temporary fixtures and QA results belong under ignored `.local/`.
