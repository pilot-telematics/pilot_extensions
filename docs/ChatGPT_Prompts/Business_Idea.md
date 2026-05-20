# Prompt: PILOT Extension From Business Idea

Copy the text below into an AI tool and replace the angle-bracket blocks.

```text
You must build a PILOT Extension from a business idea.

Repository:
https://github.com/pilot-telematics/pilot_extensions

Before generating code, read:
1. AI_SPECS.md
2. docs/AI_EXTENSION_GUIDE.md
3. docs/PILOT_RUNTIME_UTILS.md
4. docs/IDEA_TO_EXTENSION.md
5. the closest example in examples/
6. docs/MapContainer.md if the idea uses maps, map center, coordinates, markers, routes, tracks, or geozones

Business idea:
<what the extension should do>

Where the feature should appear in PILOT:
<let AI choose / new tab / Online context menu / header button / header menu / current map / History / Reports / Vehicle Editor / settings>

Required data:
<objects, vehicles, history, reports, external API, manual settings>

UI:
<grid, tree, Highcharts chart, map, modal window, dashboard>

UI language:
<EN / RU / EN+RU>

Deployment:
<Cloudflare Workers / GitHub Pages / VPS / file structure only for now>

Mandatory rules:
- The Extension is not a standalone web app.
- No React/Vue/Vite/Webpack/npm unless explicitly requested.
- Ext JS is already loaded by PILOT.
- Do not load Ext JS manually.
- Use Store.<extension>.* for extension-owned classes.
- You may use available host classes under Pilot.utils.*, for example Pilot.utils.Toggle, Pilot.utils.LeftBarPanel, Pilot.utils.ColorField.
- Choose the simplest integration pattern that solves the business idea.
- Use Advanced Host Integration only if Reports, Vehicle Editor, History, or settings integration is explicitly needed.
- Runtime logic starts only from Module.js.
- doc/index.html is documentation only, without <script>.
- Use PILOT runtime objects/helpers: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery, renderers, if useful and available.
- PILOT MapContainer is a wrapper over Leaflet. For map features, use docs/MapContainer.md and do not assume Google Maps-style getMap().getCenter().lat()/lng() APIs.
- Do not load duplicate Highcharts/jQuery/helper scripts if PILOT already provides them.
- If custom CSS needs colors, prefer Tailwind CSS palette values for hex colors, but do not load Tailwind CSS as a framework unless explicitly needed.
- If deployment is Cloudflare and I did not explicitly ask for a developer CLI flow, give manager-friendly Cloudflare dashboard/browser UI steps only. Do not require npm, Node.js, Wrangler, Git, terminal, or shell commands.
- Do not invent a download link. Attach/create a real zip artifact if your environment supports files; otherwise clearly say that you cannot attach files in this chat.
- Do not replace the zip artifact with Python/Node/PowerShell/Bash code that I must run locally to create the archive.

The result must include:
1. selected architecture;
2. a zip archive with the complete Extension file structure;
3. file tree inside the zip;
4. where to upload the files, with browser UI-first instructions for Cloudflare/GitHub;
5. final Module.js URL to register in PILOT;
6. step-by-step launch verification;
7. troubleshooting for 404, CORS, skeleton undefined, class not found.

Do not print full source code in the chat by default. Put the generated files into the zip archive.
Do not give me a local script that creates the zip unless I explicitly ask for a developer workaround.
```
