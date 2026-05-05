# PILOT Extensions

Examples, documentation, and AI coding contracts for building PILOT Extensions.

The repository is organized for two audiences:

- humans who need to understand the PILOT extension architecture;
- AI coding agents that must generate PILOT extensions from a business idea with fewer runtime mistakes.

## Start Here

For developers:

1. If you only have a business idea, start with [docs/IDEA_TO_EXTENSION.md](docs/IDEA_TO_EXTENSION.md).
2. Read [docs/README.md](docs/README.md).
3. Read [docs/HUMAN_EXTENSION_GUIDE.md](docs/HUMAN_EXTENSION_GUIDE.md).
4. Pick the closest example in `examples/`.
5. Host the extension and register the public `Module.js` URL in PILOT.

For AI coding agents:

1. Read [AI_SPECS.md](AI_SPECS.md).
2. Read [docs/AI_EXTENSION_GUIDE.md](docs/AI_EXTENSION_GUIDE.md).
3. Inspect the closest example:
   - `examples/hello-world` for a basic tab and panel.
   - `examples/nearby-poi` for an Online tree context menu and existing map usage.
   - `examples/airports` for a list plus custom map.
   - `examples/communal` for a complex module with backend, auth, and business UI.
4. Use [docs/PILOT_RUNTIME_UTILS.md](docs/PILOT_RUNTIME_UTILS.md) for PILOT runtime objects and utilities available to Extensions.
5. For prompt templates, use [docs/ChatGPT_Prompts/Business_Idea.md](docs/ChatGPT_Prompts/Business_Idea.md) or [docs/ChatGPT_Prompts/Business_Idea_RU.md](docs/ChatGPT_Prompts/Business_Idea_RU.md).

## PILOT Runtime Facts

PILOT Extensions are not standalone web applications. They run inside the already loaded PILOT Ext JS application.

Important runtime objects:

- `window.skeleton` - main UI container.
- `window.skeleton.header` - top header/toolbar.
- `window.skeleton.navigation` - left navigation tabs.
- `window.skeleton.mapframe` - main content container used by existing examples.
- `window.skeleton.map_frame` - same conceptual map/content frame in some runtime notes; check the actual build before using it.
- `window.mapContainer` - Online section map.
- `window.historyMapContainer` - History section map.
- `window.Highcharts` - charts, when available in the current PILOT build.
- `window.jQuery` / `window.$` - jQuery, when available in the current PILOT build.
- `window.uom` - current user units of measure, when available.

Navigation components usually link to their main panel through:

```js
navTab.map_frame = mainPanel;
```

Extensions can use objects and utilities that are already loaded by the compiled PILOT application, such as `skeleton`, `mapContainer`, `historyMapContainer`, `l(...)`, and available `Pilot.utils.*` classes. Extension-owned business classes should live under `Store.<extension>.*`.

## Repository Layout

```text
pilot_extensions/
├── AI_SPECS.md
├── AI_SPECS_SHORT.md
├── DEPLOY.md
├── docs/
│   ├── README.md
│   ├── README_RU.md
│   ├── IDEA_TO_EXTENSION.md
│   ├── IDEA_TO_EXTENSION_RU.md
│   ├── HUMAN_EXTENSION_GUIDE.md
│   ├── HUMAN_EXTENSION_GUIDE_RU.md
│   ├── AI_EXTENSION_GUIDE.md
│   ├── PILOT_RUNTIME_UTILS.md
│   ├── PILOT_RUNTIME_UTILS_RU.md
│   ├── MapContainer.md
│   ├── MapContainer_RU.md
│   ├── MarkerIconApi.md
│   └── ChatGPT_Prompts/
└── examples/
    ├── hello-world/
    ├── nearby-poi/
    ├── airports/
    ├── planets/
    ├── template-app/
    └── communal/
```

## Minimal Extension

```text
my-extension/
├── Module.js
└── doc/
    └── index.html
```

`Module.js` is the only runtime entry point.

`doc/index.html` is static documentation only and must not bootstrap extension logic.

## Deployment

See [DEPLOY.md](DEPLOY.md) for Cloudflare Workers, GitHub Pages, and AWS EC2/Nginx/PHP-FPM hosting options.

## License

Apache License. See [LICENSE](LICENSE).
