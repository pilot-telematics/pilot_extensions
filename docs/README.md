# PILOT Extensions Docs

This folder is organized around one goal: turn a business idea into a working PILOT Extension zip archive with as few runtime mistakes as possible.

English files are the default. Russian versions use the `_RU` suffix.

## Fast Path

For a manager using an AI assistant:

1. Open [ChatGPT_Prompts/Business_Idea.md](ChatGPT_Prompts/Business_Idea.md).
2. Paste the prompt into the AI assistant.
3. Add the business idea and this repository URL.
4. Ask for a zip archive with the complete Extension file structure.
5. Use a safe `snake_case` PILOT Extension name, for example `weather_demo`, not `weather-demo`.
6. Verify the final `/Module.js` URL in a browser, then register the base URL in PILOT.
7. Use `/store/<extension>/...` proxied runtime URLs for Extension assets, docs, and backend calls when needed.

For a developer:

1. Start with [IDEA_TO_EXTENSION.md](IDEA_TO_EXTENSION.md).
2. Read [HUMAN_EXTENSION_GUIDE.md](HUMAN_EXTENSION_GUIDE.md).
3. Use [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md) for host objects, `Pilot.utils.*`, Highcharts, jQuery, UOM, and renderers.
4. Use [../DEPLOY.md](../DEPLOY.md) for hosting.

For an AI coding agent:

1. Read [../AI_SPECS.md](../AI_SPECS.md).
2. Read [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md).
3. Read [PILOT_RUNTIME_UTILS.md](PILOT_RUNTIME_UTILS.md).
4. Inspect one closest example from `../examples/`.
5. Return a zip archive, not full source code in chat.

## Architecture Patterns

| Need | Pattern | Example |
|---|---|---|
| Minimal tab + main panel | Full UI Extension | `examples/hello_world` |
| Starter module structure | Full UI Extension | `examples/template_app` |
| List/grid + own map | Custom Map Panel | `examples/airports` |
| Data UI without map | Full UI Extension | `examples/planets` |
| Action on selected Online object | Context Menu Extension | `examples/nearby_poi` |
| Backend, auth, CRUD, mnemonic diagrams | Extension + backend | `examples/communal` |
| Global action | Header Button / Header Menu Item | see [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) |
| Reports/settings/editor integration | Advanced Host Integration | see [AI_EXTENSION_GUIDE.md](AI_EXTENSION_GUIDE.md) |

## References

- [MapContainer.md](MapContainer.md) - map API details.
- [MarkerIconApi.md](MarkerIconApi.md) - SVG marker icons.
- [communal.md](communal.md) - complex Extension architecture review.
- [ChatGPT_Prompts/Business_Idea_RU.md](ChatGPT_Prompts/Business_Idea_RU.md) - Russian prompt template.
