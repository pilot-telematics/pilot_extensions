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
5. docs/REGISTER_EXTENSION.md, when you guide me through Admin Panel registration
6. docs/MapContainer.md, if the idea uses maps, coordinates, markers, routes, tracks, geozones, or map center
7. the closest example from examples/

Use the repository documents as the source of truth. If any instruction in this prompt conflicts with the repository, follow AI_SPECS.md.

If you cannot open/read the repository, stop and ask me to paste only the required file. Do not claim that you read files that you could not access. Do not guess the PILOT Extension contract.

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
<Cloudflare Workers Upload your static files / GitHub Pages / Workers with custom proxy code / VPS / file structure only for now>

Output requirements:
- First give a short architecture choice and mention which repository docs/examples you used.
- Create a real zip archive with the complete Extension file structure if your environment supports file artifacts.
- Do not print full source code in the chat by default.
- Do not invent a fake download link.
- Do not replace the zip with a local Python/Node/PowerShell/Bash script unless I explicitly ask for a developer workaround.
- For a browser upload, use Cloudflare Workers and select **Upload your static files** on the **Make something new** screen. The project URL uses `workers.dev`. Do not select GitHub, GitLab, Hello World, a template, or **Continue to Pages**. The current dashboard marks Pages as a legacy workflow.
- When updating an existing Cloudflare Workers project, use **New deployment** in that project. Do not create a second project. Verify the new version by checking a version marker or unique change that exists in the generated source.
- Propose a unique lowercase snake_case slug. Ask me to check it in Admin Panel → Extensions and wait for confirmation before generating files.
- Include the file tree, upload steps, direct /Module.js verification URL, base URL for the separate PILOT Admin Panel, proxied /store/<extension>/... URLs, launch checklist, and troubleshooting.
- When you guide registration, list every field: unique slug, full name, description, base URL, published state, icon class, and author. The star icon is selected by default. I can keep it or choose another icon. Do not skip the description or icon field.
```
