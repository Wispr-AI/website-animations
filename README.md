# Website animations

Reusable browser animations for Webflow pages. Layout, content and responsive styling live in Webflow; each script owns its interaction and animation behavior.

## Animation catalog

| Animation | Entry file | Setup |
| --- | --- | --- |
| FAQ | [faq.js](animations/faq/faq.js) | [Integration guide](animations/faq/README.md) |
| Notetaker tabs | [notetaker-tabs.js](animations/notetaker-tabs/notetaker-tabs.js) | [Integration guide](animations/notetaker-tabs/README.md) |

## Project structure

- `animations/<animation-name>/`: browser script and integration documentation for each animation.
- `tests/<animation-name>/`: relevant validation instructions and future automated tests.
- `docs/releases.md`: deployment records and release procedure.
- `.local/`: ignored working context; never part of the public repository. Existing project research and historical fixtures are preserved in `.local/context/`.

No build step or package installation is required for the current animation. Serve the repository root with Live Server when developing. The local script path is now `/animations/notetaker-tabs/notetaker-tabs.js`.

## Publishing

Repository: https://github.com/Wispr-AI/website-animations. Browser scripts are served through jsDelivr, pinned to a full commit SHA. Webflow deployment is tracked separately from publishing the code. See [release procedure](docs/releases.md).

Only stage reviewed runtime files, documentation and tests. Do not upload `.local/` or force-add ignored files. The repository does not currently declare an open-source license.
