# Prompt: PILOT Extension From Business Idea

Copy the text below into an AI tool and replace the angle-bracket blocks.

```text
Build a PILOT Extension from my business idea.

Repository with the full contract, SDK notes, examples, and deployment rules:
https://github.com/pilot-telematics/pilot_extensions

Before generating files, read and follow these documents from the repository:
1. AI_SPECS.md
2. docs/AI_EXTENSION_GUIDE.md
3. docs/IDEA_TO_EXTENSION.md
4. docs/PILOT_RUNTIME_UTILS.md
5. docs/MapContainer.md, if the idea uses maps, coordinates, markers, routes, tracks, geozones, or map center
6. the closest example from examples/

Use the repository documents as the source of truth. If any instruction in this prompt conflicts with the repository, follow AI_SPECS.md.

If you cannot open/read the repository, stop and ask me to paste the required docs. Do not guess the PILOT Extension contract.

Business idea:
<what the extension should do>

Where it should appear in PILOT:
<let AI choose / new left tab / Online context menu / header button / header menu / current map / History / Reports / Vehicle Editor / settings>

Required data:
<objects, vehicles, history, reports, external API, manual settings, backend needs>

UI:
<grid, tree, Highcharts chart, map, modal window, dashboard, let AI choose>

UI language:
<EN / RU / EN+RU>

Deployment target:
<Cloudflare / GitHub Pages / VPS / file structure only for now>

Output requirements:
- First give a short architecture choice and mention which repository docs/examples you used.
- Create a real zip archive with the complete Extension file structure if your environment supports file artifacts.
- Do not print full source code in the chat by default.
- Do not invent a fake download link.
- Do not replace the zip with a local Python/Node/PowerShell/Bash script unless I explicitly ask for a developer workaround.
- Include the file tree, upload steps, direct /Module.js verification URL, PILOT admin base URL, proxied /store/<extension>/... URLs, launch checklist, and troubleshooting.
```
