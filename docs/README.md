# PILOT Extensions Documentation Map

This directory is organized for two audiences:

- developers who need to understand PILOT Extension architecture and launch code quickly;
- AI coding agents that need strict rules and a predictable delivery format.

## For Developers

Read in this order:

1. [IDEA_TO_EXTENSION.md](IDEA_TO_EXTENSION.md) - start here when you have a business idea and want a working Extension fast.
2. [IDEA_TO_EXTENSION_RU.md](IDEA_TO_EXTENSION_RU.md) - Russian version.
3. [HUMAN_EXTENSION_GUIDE.md](HUMAN_EXTENSION_GUIDE.md) - practical developer guide.
4. [MapContainer.md](MapContainer.md) - `MapContainer` usage.
5. [MarkerIconApi.md](MarkerIconApi.md) - SVG marker icons.
6. [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md) - built-in PILOT runtime objects, libraries, units, and renderers available to Extensions.
7. [communal.md](communal.md) - architecture review of the complex `examples/communal` Extension.
8. [../DEPLOY.md](../DEPLOY.md) - hosting `Module.js` with Cloudflare Workers, GitHub Pages, or VPS.

## For AI

Before generating code, AI should read:

1. [../AI_SPECS.md](../AI_SPECS.md) - strict mandatory contract.
2. [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) - generation workflow and architecture selection.
3. [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md) - only use runtime objects/utilities available in compiled PILOT `app.js`.
4. [IDEA_TO_EXTENSION.md](IDEA_TO_EXTENSION.md) or [IDEA_TO_EXTENSION_RU.md](IDEA_TO_EXTENSION_RU.md) - expected delivery shape and launch instructions.
5. The closest example from `../examples/`.

Prompt templates:

- [ChatGPT_Prompts/Business_Idea.md](ChatGPT_Prompts/Business_Idea.md)
- [ChatGPT_Prompts/Business_Idea_RU.md](ChatGPT_Prompts/Business_Idea_RU.md)

## Example Selection

| Need | See |
|---|---|
| Minimal tab + main panel | `examples/hello-world` |
| Starter UI module | `examples/template-app` |
| Grid/list + custom map | `examples/airports` |
| Simple data UI without a map | `examples/planets` |
| Online context menu + existing map | `examples/nearby-poi` |
| Complex backend, auth, CRUD, mnemonic diagrams | `examples/communal` |

## Key Runtime Objects

- `window.skeleton` - main PILOT UI container.
- `window.skeleton.header` - header with buttons and indicators.
- `window.skeleton.navigation` - left navigation.
- `window.skeleton.navigation.online.online_tree` - Online object tree.
- `window.skeleton.mapframe` - main map/panel container used by repository examples.
- `window.skeleton.map_frame` - alternate name for the same conceptual runtime area in some builds; use fallback if unsure.
- `window.mapContainer` - Online map.
- `window.historyMapContainer` - History map.

Navigation tab and main panel linkage:

```js
navTab.map_frame = mainPanel;
```

## Document Separation Rule

Human docs explain reasons, options, and workflow.

AI docs should be imperative: what is allowed, what is forbidden, which files to create, and which checks must pass.
