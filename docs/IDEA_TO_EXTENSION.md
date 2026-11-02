# From Business Idea To Working Extension

This document is the shortest path from a business idea to a generated PILOT Extension, deployed files, a verified `/Module.js` file, and a registered base URL.

## 1. What The User Should Tell The AI

### First Extension: Hello World

Use this short prompt if you are new to PILOT Extensions:

```text
I am new to PILOT Extensions and cannot code. Help me create and launch a simple “Hello, PILOT!” Extension one step at a time. After each step, tell me what I should see and wait for my reply.

Use https://github.com/pilot-telematics/pilot_extensions. First read AI_SPECS.md, examples/hello_world/Module.js, docs/DEPLOY.md, and docs/REGISTER_EXTENSION.md. Follow these documents. Try the links before asking me for files. If you cannot read a file, say so.

First suggest a unique lowercase snake_case slug. Ask me to check it in the separate PILOT Admin Panel → Extensions. Wait for my confirmation before creating files.

Then create a minimal Extension with one left navigation tab and a panel that says “Hello, PILOT!”. Help me publish it, register it in the Admin Panel, grant my account access, enable it in PILOT, and verify it.
```

Use the detailed guides below when you need the upload or registration steps.

### Business Idea Prompt

For a business Extension, use this minimum prompt:

```text
Build a PILOT Extension for this business idea:
<idea>

Use the pilot-telematics/pilot_extensions repository.
Read AI_SPECS.md, docs/AI_EXTENSION_GUIDE.md, docs/PILOT_RUNTIME_UTILS.md, and docs/PILOT_API_COMPATIBILITY.md first. Read docs/REGISTER_EXTENSION.md before you guide registration.
If the idea uses maps, map center, coordinates, markers, routes, tracks, or geozones, also read docs/MapContainer.md. PILOT MapContainer is a wrapper over Leaflet, not a Google Maps object.
Use documented PILOT APIs. Treat legacy endpoints, role data, account settings, and private WebSocket messages as unsupported unless PILOT confirms support.
Propose a unique lowercase `snake_case` Extension name. Ask me to check that name in Admin Panel → Extensions and confirm it is available. Wait for my confirmation before generating files. Use the confirmed name in the folder, `Store.<name>.Module`, and `/store/<name>/` path.
Return a zip archive with the complete Extension file structure, plus step-by-step instructions for where to upload the files, which `/Module.js` URL to verify in a browser, and which base URL to register in the PILOT Admin Panel.
Also explain that PILOT proxies the registered base URL under `/store/<extension>/...` for CORS-compatible runtime access.
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
- Cloudflare Workers static-file upload (`Upload your static files`) / GitHub Pages / VPS / local folder for now
- For Cloudflare, use only Workers and `Upload your static files`. Do not suggest another Cloudflare upload flow. If the option is missing, stop and ask me for a screenshot.
```

## 2. How The AI Should Choose Architecture

| Idea | Likely pattern |
|---|---|
| Separate workspace, dashboard, grid, editor | Full UI Extension |
| Action for selected Online vehicle | Context Menu Extension |
| Markers/routes on current map | Existing Map Interaction |
| Separate map inside the extension | Custom Map Panel |
| Global action for the whole account | Header Button or Header Menu Item |
| Add panel to Reports, Vehicle Editor, History, or settings | Advanced Host Integration |
| Secrets, CORS proxy, database | Extension + backend |

The AI should choose the simplest pattern that satisfies the idea.

For map-related ideas, the AI must read `docs/MapContainer.md`, use PILOT `MapContainer` methods where possible, and treat `map.map` as the underlying Leaflet map if direct center/zoom access is needed. It must not invent Google Maps-style APIs.

For non-technical managers: describe the business result, not the implementation. The AI should choose the pattern and produce a zip archive. You only need to verify that the final `/Module.js` URL opens, then register the base URL in PILOT.

## 3. What The AI Must Return

The AI response should include:

1. Short architecture summary.
2. Zip archive with the complete Extension file structure.
3. File tree inside the zip.
4. Confirmation that `Module.js` is the only runtime entry point.
5. Confirmation that `doc/index.html` has no `<script>`.
6. Upload/deployment steps.
7. Direct `/Module.js` URL to verify in a browser.
8. Base URL to register in the separate PILOT Admin Panel.
9. Admin Panel registration field values: unique name/slug, full name, description, base URL, published state, icon class, and author. The default icon is a star. Explain that changing it is optional.
10. Proxied `/store/<extension>/...` runtime URLs for Module.js, docs, assets, and backend.
11. Verification checklist.
12. Troubleshooting notes.

The AI should not print full source code in the chat by default. The generated files belong in the zip archive.

If the AI environment cannot attach files, it must say so clearly. It must not replace the zip with Python/Node/PowerShell/Bash code that the user must run locally, unless the user explicitly asks for a developer workaround.

## 4. Typical Output Structure

Frontend-only:

```text
my_extension/
├── index.html
├── Module.js
├── style.css
└── doc/
    └── index.html
```

With backend:

```text
my_extension/
├── index.html
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
├── index.html
├── Module.js
├── style.css
└── doc/
    └── index.html
```

For Cloudflare, root `index.html` must be next to `Module.js`. It may be empty or the same as `doc/index.html`; it helps Cloudflare mark the uploaded folder as the assets root.

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
https://ext.example.com/my_extension/Module.js
```

See [../DEPLOY.md](../DEPLOY.md).

## 6. How To Register In The PILOT Admin Panel

1. Open the direct `Module.js` URL in a browser.
2. Confirm it returns JavaScript source, not an HTML error page.
3. Open the separate PILOT Admin Panel. Registration does not take place in the PILOT user interface. Ask me for the Admin Panel URL if I have not provided it.
4. Open **Extensions** and add a new Extension.
5. Enter every field:

| Field | Value |
|---|---|
| **Name** | The unique lowercase `snake_case` slug confirmed by me. It must match `Store.<name>.Module`. |
| **Name Pretty** | The display name shown to PILOT users. |
| **Description** | A short description of the Extension. |
| **URL** | The hosted folder base URL, not the direct `Module.js` URL. A trailing slash is recommended. The current PILOT generator adds it if it is missing. The URL must still point to the folder that contains `Module.js`. |
| **Is Published** | Enable it so users can see and activate the Extension. |
| **Icon class** | The star icon is selected by default. Keep it or choose another icon from the available list. Changing it is optional. |
| **Author** | The author name shown to users. |

6. Review the fields, then select **Update** to save the Extension. Do not skip the description or the icon field.
7. In the separate Admin Panel, grant account access.
8. Sign in to PILOT, open **Extensions**, and enable the Extension.
9. In the current PILOT deployment, the store proxy configuration refreshes every 10 minutes. Allow up to 10 minutes after you add an Extension or change its URL. Then reload PILOT.

Example:

```text
Verify in browser: https://weather-demo.YOUR.workers.dev/Module.js
Register in the Admin Panel: https://weather-demo.YOUR.workers.dev/
```

Use a unique safe `snake_case` Extension name in the PILOT Admin Panel, for example `weather_demo`. Check that the name is not already in the Extensions list. Do not use `weather-demo` as the PILOT Extension name, because PILOT creates the runtime class as `Store.weather-demo.Module`.

If the Extension name is `weather_demo`, PILOT proxies the registered base URL under:

```text
/store/weather_demo/Module.js
/store/weather_demo/doc/index.html
/store/weather_demo/backend/
```

Use these proxied paths from runtime code when loading Extension assets or calling the Extension backend.

## 7. Browser Verification

Check DevTools:

- Network: `Module.js` returns HTTP 200.
- Console: no `Ext.define`, `Ext.create`, or missing class errors.
- Console: no `skeleton is undefined`.
- CSS returns HTTP 200 if used.
- Proxied `/store/<extension>/...` URLs return the expected files after registration.
- Custom CSS uses Tailwind CSS palette values for new colors when practical, without loading Tailwind by default.
- Header buttons use `header_tool <extension>-header-btn` and CSS with a visible background plus readable text/icon color.
- External API calls have no CORS errors.
- Backend endpoints return JSON, not HTML/PHP warnings.

## 8. Common Problems

| Symptom | Cause | Fix |
|---|---|---|
| `Module.js` 404 | Wrong upload structure | Open direct URL and check hosting folder layout |
| `/store/<extension>/Module.js` 404 | PILOT registration name/URL mismatch | Check Extension slug/name and registered base URL |
| HTML opens instead of JS while checking `Module.js` | Wrong upload URL or hosting fallback | Open the direct `/Module.js` URL and fix hosting structure |
| Extension does not load in PILOT, but `/Module.js` opens | Registered direct file URL instead of base URL | Register the base URL, for example `https://HOST/` |
| `skeleton is undefined` | Code is run outside PILOT | Test inside PILOT, not as standalone page |
| `Ext is undefined` | Built as standalone web app | Extension must run inside PILOT |
| `Store.weather-demo.Module` class not found | Hyphenated PILOT Extension name | Rename the PILOT Extension to `weather_demo`, define `Store.weather_demo.Module`, and use `/store/weather_demo/...` |
| Class not found | Extra JS file was not loaded or class name does not match the PILOT Extension name | Load it from `Module.js`, keep code in one file, and make `Ext.define('Store.<extension_name>.Module', ...)` match the Admin Panel name exactly |
| CORS error | External API blocks browser calls | Add backend/proxy |
| Map not found | Wrong map target or wrong map API | Online: `getActiveTabMapContainer()` or `window.mapContainer`; History: `window.historyMapContainer`; read `docs/MapContainer.md` because PILOT maps wrap Leaflet |

## 9. Release Checklist

- [ ] `Module.js` opens by direct URL.
- [ ] PILOT Extension name is safe `snake_case`, for example `weather_demo`.
- [ ] `Module.js` contains `Ext.define('Store.<name>.Module', ...)` with the exact same `<name>` as in the PILOT Admin Panel.
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
- if the idea uses maps, read docs/MapContainer.md; PILOT MapContainer wraps Leaflet, so do not invent Google Maps-style APIs;
- explain that PILOT proxies the registered base URL as /store/<extension>/... and use that path for runtime assets/backend when relevant;
- do not build a standalone web app;
- provide a zip archive with the complete Extension file structure instead of printing full source code in chat;
- do not replace the zip archive with a local script that I must run to create it;
- provide step-by-step instructions: where to upload files, which `/Module.js` URL to verify in a browser, which base URL to register in PILOT, and how to verify launch.
```
