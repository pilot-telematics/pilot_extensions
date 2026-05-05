# Prompt: PILOT Extension From Business Idea

Copy the text below into an AI tool and replace the angle-bracket blocks.

```text
You must build a PILOT Extension from a business idea.

Repository:
https://github.com/pilot-telematics/pilot_extensions

Before generating code, read:
1. AI_SPECS.md
2. docs/AI_EXTENSION_GUIDE.md
3. docs/PILOT_RUNTIME_UTILS_RU.md
4. docs/IDEA_TO_EXTENSION.md
5. the closest example in examples/

Business idea:
<what the extension should do>

Where the feature should appear in PILOT:
<new tab / Online context menu / header button / current map / History / Reports>

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
- Runtime logic starts only from Module.js.
- doc/index.html is documentation only, without <script>.
- Use PILOT runtime objects/helpers: skeleton, mapContainer/historyMapContainer, l(...), window.uom, Highcharts/jQuery, renderers, if useful and available.
- Do not load duplicate Highcharts/jQuery/helper scripts if PILOT already provides them.

The result must include:
1. selected architecture;
2. file tree;
3. full code for every file;
4. where to upload the files;
5. final Module.js URL to register in PILOT;
6. step-by-step launch verification;
7. troubleshooting for 404, CORS, skeleton undefined, class not found.
```
