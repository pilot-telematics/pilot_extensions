# From Business Idea To Working Extension

This document is the shortest path from a business idea to a generated PILOT Extension, deployed files, and a registered `Module.js` URL.

## 1. What The User Should Tell The AI

Minimum prompt:

```text
Build a PILOT Extension for this business idea:
<idea>

Use the pilot-telematics/pilot_extensions repository.
Read AI_SPECS.md, docs/AI_EXTENSION_GUIDE.md, and docs/PILOT_RUNTIME_UTILS_RU.md first.
Return complete file contents and step-by-step instructions for where to upload the files and which Module.js URL to register in PILOT.
```

Better prompt:

```text
Business idea:
<what the extension should do>

Where it should appear:
- new left navigation tab / Online context menu / header button / existing map action

Data:
- required PILOT data
- external API, if any
- API key, if any
- backend/proxy required or not

UI:
- grid / tree / chart / map / modal window / dashboard
- UI language: English / Russian / both

Deployment:
- Cloudflare Workers / GitHub Pages / VPS / local folder for now
```

## 2. How The AI Should Choose Architecture

| Idea | Likely pattern |
|---|---|
| Separate workspace, dashboard, grid, editor | Full UI Extension |
| Action for selected Online vehicle | Context Menu Extension |
| Markers/routes on current map | Existing Map Interaction |
| Separate map inside the extension | Custom Map Panel |
| Secrets, CORS proxy, database | Extension + backend |

The AI should choose the simplest pattern that satisfies the idea.

## 3. What The AI Must Return

The AI response should include:

1. Short architecture summary.
2. File tree.
3. Full contents of each file.
4. `Module.js` as the only runtime entry point.
5. `doc/index.html` without `<script>`.
6. Upload/deployment steps.
7. Final `Module.js` URL to register in PILOT.
8. Verification checklist.
9. Troubleshooting notes.

## 4. Typical Output Structure

Frontend-only:

```text
my-extension/
├── Module.js
├── style.css
└── doc/
    └── index.html
```

With backend:

```text
my-extension/
├── Module.js
├── style.css
├── doc/
│   └── index.html
└── backend/
    └── api.php
```

## 5. Where To Put Files

For a fast test, use any public static hosting.

## 5.1 How To Choose Hosting

| Need | Recommended hosting |
|---|---|
| Only `Module.js`, CSS, docs, public browser-friendly APIs | Cloudflare Workers static assets or GitHub Pages |
| External API has CORS issues | Cloudflare Worker proxy |
| API key/secret must not be exposed in browser | Backend/proxy: Cloudflare Worker or VPS |
| PHP endpoints, database, files, logs | VPS/Nginx/PHP-FPM |
| Fast workshop/demo | Cloudflare Workers static assets |

Cloudflare Workers static assets:

```text
extension-upload/
├── Module.js
├── style.css
└── doc/
    └── index.html
```

After deployment these URLs should work:

```text
https://YOUR-HOST/Module.js
https://YOUR-HOST/style.css
https://YOUR-HOST/doc/index.html
```

GitHub Pages:

```text
https://USERNAME.github.io/REPOSITORY/Module.js
```

VPS/Nginx:

```text
https://ext.example.com/my-extension/Module.js
```

See [../DEPLOY.md](../DEPLOY.md).

## 6. How To Register In PILOT

1. Open the direct `Module.js` URL in a browser.
2. Confirm it returns JavaScript source, not an HTML error page.
3. Open the PILOT admin area for applications/extensions.
4. Create a new application.
5. Paste the direct `Module.js` URL.
6. Save and enable the Extension for the required account/user.
7. Wait for configuration/proxy cache if your PILOT installation has a delay.
8. Reload PILOT.

## 7. Browser Verification

Check DevTools:

- Network: `Module.js` returns HTTP 200.
- Console: no `Ext.define`, `Ext.create`, or missing class errors.
- Console: no `skeleton is undefined`.
- CSS returns HTTP 200 if used.
- Custom CSS uses Tailwind CSS palette values for new colors when practical, without loading Tailwind by default.
- External API calls have no CORS errors.
- Backend endpoints return JSON, not HTML/PHP warnings.

## 8. Common Problems

| Symptom | Cause | Fix |
|---|---|---|
| `Module.js` 404 | Wrong upload structure | Open direct URL and check hosting folder layout |
| HTML opens instead of JS | Registered site URL instead of `Module.js` | Register direct `Module.js` URL |
| `skeleton is undefined` | Code is run outside PILOT | Test inside PILOT, not as standalone page |
| `Ext is undefined` | Built as standalone web app | Extension must run inside PILOT |
| Class not found | Extra JS file was not loaded | Load it from `Module.js` or keep code in one file |
| CORS error | External API blocks browser calls | Add backend/proxy |
| Map not found | Wrong map target | Online: `getActiveTabMapContainer()` or `window.mapContainer`; History: `window.historyMapContainer` |

## 9. Release Checklist

- [ ] `Module.js` opens by direct URL.
- [ ] `Module.js` contains `Ext.define('Store.<name>.Module', ...)`.
- [ ] `initModule` is a class method.
- [ ] No standalone HTML/React/Vue/Vite.
- [ ] Navigation tab is added to `skeleton.navigation` if used.
- [ ] Main panel is added to `skeleton.mapframe` if used.
- [ ] `navTab.map_frame = mainPanel` exists for paired UI.
- [ ] Context menu is extended, not replaced, if used.
- [ ] `doc/index.html` has no `<script>`.
- [ ] The AI provided upload steps and the final registration URL.

## 10. Ready Short Prompt

```text
Build a PILOT Extension.

Business idea:
<description>

Requirements:
- use pilot-telematics/pilot_extensions;
- follow AI_SPECS.md;
- the Extension must run inside PILOT via Module.js;
- use PILOT runtime objects: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery if useful and available;
- do not build a standalone web app;
- provide full file contents;
- provide step-by-step instructions: where to upload files, which Module.js URL to register in PILOT, and how to verify launch.
```
