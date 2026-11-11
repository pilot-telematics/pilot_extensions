# PILOT Extensions Documentation

Use this page to find the right guide for your task. Start with the section that matches your role.

## I am new to PILOT Extensions

Start with [From Business Idea To Working Extension](IDEA_TO_EXTENSION.md). It explains how to create and host an Extension, register it in the separate Admin Panel, grant access, and enable it in PILOT.

For a static Extension, use Cloudflare Pages Direct Upload to send a ZIP or folder through the browser, or use GitHub Pages. Cloudflare Pages uses a `pages.dev` URL. Use Cloudflare Workers when the Extension needs Worker code, bindings, or proxy logic. See the [deployment guide](../DEPLOY.md) for the separate workflows.

## I want to build an extension

1. Read [the human developer guide](HUMAN_EXTENSION_GUIDE.md).
2. Choose a pattern from [the architecture guide](AI_EXTENSION_GUIDE.md).
3. Select one example from `../examples/` that matches the feature.
4. Read [the PILOT runtime reference](PILOT_RUNTIME_UTILS.md) for host objects and helpers.
5. Read [API compatibility and support boundaries](PILOT_API_COMPATIBILITY.md) before you use PILOT APIs, account data, roles, or runtime internals.
6. Read [the map reference](MapContainer.md) if the extension uses a map, marker, route, track, or geofence.
7. Follow [the deployment guide](../DEPLOY.md) to host the extension.

## I want to register an extension in PILOT

Follow [the registration and account-access guide](REGISTER_EXTENSION.md) to register an Extension in the separate Admin Panel, grant account access, set global or account-specific values, and enable it in PILOT.

## I have a business idea and use an AI assistant

1. Use [the business-idea prompt](ChatGPT_Prompts/Business_Idea.md).
2. Give the assistant this repository and the [AI coding contract](../AI_SPECS.md).
3. Describe the required result, users, data, and hosting constraints.
4. Ask for a complete extension archive and deployment steps.

The AI coding contract defines generation rules. The human guide explains the development workflow. The runtime reference describes PILOT objects. Use each document for its stated purpose.

## I need a specific reference

| Topic | Start here |
|---|---|
| Register an Extension, set access, and enable it in PILOT | [Registration and account access](REGISTER_EXTENSION.md) |
| Which PILOT APIs and runtime details are safe to depend on | [API compatibility and support boundaries](PILOT_API_COMPATIBILITY.md) |
| Extension architecture and integration patterns | [AI extension guide](AI_EXTENSION_GUIDE.md) |
| PILOT host objects, helpers, and utilities | [PILOT runtime reference](PILOT_RUNTIME_UTILS.md) |
| MapContainer, markers, routes, and map behavior | [MapContainer reference](MapContainer.md) |
| Hosting, base URLs, and the `/store/<extension>/` proxy | [Deployment guide](../DEPLOY.md) |
| SVG marker icons | [Marker icon API](MarkerIconApi.md) |
| A larger extension with a backend | [Communal example notes](communal.md) |

## Examples

| Need | Example |
|---|---|
| Minimal tab and panel | `../examples/hello_world/` |
| Starter file structure | `../examples/template_app/` |
| Table and custom map | `../examples/airports/` |
| Data screen without a map | `../examples/planets/` |
| Context action on an Online vehicle | `../examples/nearby_poi/` |
| Backend, authentication, and CRUD | `../examples/communal/` |

Check the API compatibility guide before you rely on undocumented host behavior or legacy endpoints. A working example does not make an internal PILOT detail a supported API.
