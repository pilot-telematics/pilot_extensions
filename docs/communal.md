# Communal Module Developer Guide

This document describes how the `communal` module is built, how it integrates with PILOT, how its backend is organized, and how you can use it as a reference for building your own complex extension.

The module itself lives in:

- [examples/communal](D:/PhpstormProjects/pilot_extensions/examples/communal)

This guide is intentionally practical. It focuses on architecture, responsibilities, data flow, and extension patterns that are worth reusing.

## 1. What This Module Is

`communal` is an example of a non-trivial PILOT extension that combines:

- custom UI inside the PILOT shell
- custom authorization
- its own backend and database
- calls to external API endpoints
- native PILOT UI infrastructure
- native PILOT map integration
- its own mnemonic editor and renderer

In other words, this is not a "single-panel widget". It is a small subsystem embedded into PILOT.

## 2. High-Level Architecture

The module has 4 major parts:

1. Frontend bootstrap and integration with PILOT
2. Business UI built with Ext JS
3. Custom backend in PHP
4. Mnemo subsystem for editable schemas

Main frontend files:

- [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js)
- [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
- [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)
- [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)
- [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)
- [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
- [Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)

Main backend files:

- [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)
- [backend/auth_login.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/auth_login.php)
- [backend/session.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/session.php)
- [backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)
- [backend/node_types.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/node_types.php)
- [backend/mnemo.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/mnemo.php)

Main data/schema files:

- [install/create _db.sql](D:/PhpstormProjects/pilot_extensions/examples/communal/install/create%20_db.sql)
- [lang/lang.json](D:/PhpstormProjects/pilot_extensions/examples/communal/lang/lang.json)
- [store/mnemo_library.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library.json)

## 3. How the Module Is Embedded into PILOT

The entry point is [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js).

What it does:

- loads external JS dependencies needed by the extension
- loads extension translations from `lang/lang.json`
- creates a left navigation tab
- creates the main content panel
- injects extension CSS

Important integration points with PILOT:

- `skeleton.navigation.add(...)`
  - adds the module entry into the left sidebar
- `skeleton.mapframe.add(...)`
  - adds the main module content into the central workspace area
- `lang[...]`
  - merges extension translations into the global translation dictionary
- `base_url`
  - used to resolve extension and API URLs relative to the installed PILOT environment

This is the first pattern to reuse in your own module:

- keep one small bootstrap file
- do all UI assembly only after dependencies and translations are ready

## 4. Native PILOT Pieces Used by the Module

The extension is built on top of Ext JS, but it also uses native PILOT infrastructure and helper components.

Important native pieces used here:

- `Pilot.utils.LeftBarPanel`
  - base class for the left navigation tab
  - used in [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
- `Pilot.utils.MapContainer`
  - map wrapper around Leaflet and other geospatial helpers
  - used in [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
- `skeleton.navigation`
  - global left navigation container
- `skeleton.mapframe`
  - central content area
- `skeleton.navigation.online.online_tree.store`
  - native PILOT object tree used to collect bindable vehicle/object records
- `pilot_confirm(...)`
  - native confirm dialog helper
- `l(...)`
  - translation helper
- `global_conf`
  - global configuration, including current account id
- `dateTimeStr(...)`
  - helper for formatting timestamps when available

When you build your own module, prefer using these existing PILOT pieces instead of reimplementing equivalent infrastructure.

## 5. UI Composition

The visible interface is assembled in layers.

### 5.1 Left tab

[Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)

Responsibilities:

- declares the module tab shown in the left bar
- ensures authorization before the module is used
- creates the object tree panel

This tab extends `Pilot.utils.LeftBarPanel`, which makes it behave like a native PILOT sidebar section.

### 5.2 Main workspace layout

[Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)

Responsibilities:

- composes the main workspace with `border` layout
- creates:
  - center sensor grid
  - right tab panel
  - `Information` tab
  - `Mnemo` tab

This file is intentionally thin. It acts as a composition root.

### 5.3 Object tree

[Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)

Responsibilities:

- loads custom hierarchical objects from extension backend
- allows create/edit/delete of those objects
- on selection:
  - collects all nested `agent_id` values
  - tells the center grid to load sensor data for those agents
  - tells the mnemo tab to load mnemo schemas for the selected node

This is the main "selection source" of the module.

### 5.4 Center sensor grid

[Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)

Responsibilities:

- calls `/api/v3/vehicles/status`
- normalizes API payload into flat sensor rows
- shows grouped sensor rows
- supports:
  - text filter
  - tag filter
  - issues-only filter
- computes right-panel summary
- passes normalized sensor rows into:
  - `Information`
  - `Mnemo`

This file is the main data adapter between raw API payload and UI state.

### 5.5 Information tab

[Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)

Responsibilities:

- shows aggregated counters:
  - total
  - active
  - not active
  - issues
- shows only problematic sensors in a table
- contains a map panel
- places a marker on the map when a user clicks a problematic sensor row

Important implementation detail:

- `Pilot.utils.MapContainer` is created as an Ext component
- the actual `MapContainer` instance is available at `component.map`
- therefore map actions should go through `this.map.map`

Example:

```js
this.map.map.addMarker(...);
this.map.map.setMapCenter(lat, lon);
```

This distinction matters. The Ext component and the underlying map wrapper are not the same object.

### 5.6 Mnemo tab

[Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)

Responsibilities:

- loads list of schemas for the selected node
- shows schema selector and CRUD actions
- renders the selected schema
- passes live sensor rows into the renderer
- opens the schema editor

Mnemo-related support files:

- [MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)
- [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)
- [view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

## 6. Authentication Model

This extension does not reuse PILOT authorization directly for its own backend. It has its own auth layer.

Frontend auth entry point:

- [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js)

How it works:

1. The module asks `Store.communal.Auth.ensure(accountId, ...)`
2. If there is no token in `localStorage`, login window is shown
3. If token exists, backend session check is performed
4. On success:
   - token is reused
   - `communal-auth-ok` event is fired
5. On failure:
   - token is cleared
   - login window is shown again

Token storage:

- key format: `comm_token_<accountId>`
- stored in browser `localStorage`

Backend endpoints involved:

- [backend/auth_login.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/auth_login.php)
- [backend/session.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/session.php)

Common pattern to reuse:

- keep auth logic in one singleton
- expose `getAuthHeaders()`
- let stores and AJAX requests consume that helper
- notify the rest of the UI with a global event

## 7. Backend Structure

All PHP backend scripts include:

- [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)

This bootstrap does:

- loads configuration
- initializes DB access helpers
- sets JSON headers
- handles CORS
- extracts bearer token
- validates current session

This is the foundation for every extension endpoint.

### 7.1 Tree backend

[backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)

Responsibilities:

- serves hierarchical nodes for Ext tree
- supports:
  - `read`
  - `create`
  - `update`
  - `destroy`
- enforces account isolation
- computes:
  - recursive children count
  - descendant agent ids

This backend is designed specifically around Ext tree/store contracts, not around a generic REST shape.

That is a useful pattern:

- shape the backend response around the UI component that consumes it
- keep conversion logic server-side if it simplifies frontend code

### 7.2 Node types backend

[backend/node_types.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/node_types.php)

Responsibilities:

- returns available object/node types
- used by the node edit form

### 7.3 Mnemo backend

[backend/mnemo.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/mnemo.php)

Responsibilities:

- stores multiple named schemas per node
- supports:
  - `list`
  - `read`
  - `save`
  - `delete`
- normalizes schema shape
- isolates data by account and node

Important data contract:

- one tree node can have multiple schemas
- each schema record has:
  - persistent DB `id`
  - human-readable `name`
  - `schema_json`

## 8. Database Model

Main schema is defined in:

- [install/create _db.sql](D:/PhpstormProjects/pilot_extensions/examples/communal/install/create%20_db.sql)

Important tables:

- `users`
  - extension users
- `sessions`
  - extension auth sessions
- `tree_nodes`
  - hierarchical business objects shown in the module
- `node_types`
  - available types for `tree_nodes`
- `mnemo_schemes`
  - saved schemas for nodes

The extension backend is account-scoped. Almost every query includes `account_id`.

That is a best practice worth copying:

- scope business data by account explicitly
- never infer account from frontend parameters alone
- always derive access from validated bearer token

## 9. API Calls and Data Flow

There are 3 different classes of requests in this module.

### 9.1 Extension backend requests

Examples:

- `/store/communal/backend/tree.php`
- `/store/communal/backend/node_types.php`
- `/store/communal/backend/mnemo.php`
- `/store/communal/backend/session.php`

Purpose:

- authorization
- module configuration data
- module CRUD
- mnemo persistence

These requests use extension bearer token headers.

### 9.2 External business API requests

Example:

- `base_url + '../api/v3/vehicles/status'`

Used in:

- [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)

Purpose:

- load vehicle sensor status rows
- get sensor values, timestamps, issues and coordinates

This data is then normalized once and reused across multiple UI panels.

That is an important pattern:

- normalize payload in one place
- fan out normalized rows to other panels
- do not let each panel reparse raw API payload independently

### 9.3 Native PILOT data access

Example:

- `skeleton.navigation.online.online_tree.store`

Used in:

- [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)

Purpose:

- collect native PILOT bindable objects/agents
- present them in node editing form

This is how the module bridges its own object tree with native PILOT objects.

## 10. Mnemo Subsystem

The mnemo subsystem is effectively a mini-application inside the module.

### 10.1 Storage

[MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)

Responsibilities:

- load schema list
- save schema
- delete schema
- normalize schema structure
- ensure unique integer element ids inside one schema

Element ids are intentionally simple:

- integer
- unique only inside one schema
- new id is `max(existing ids) + 1`

This is a deliberate KISS choice.

### 10.2 Rendering

[MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)

Responsibilities:

- render schema into SVG
- render live sensor-driven text/value updates
- render editor previews
- support selection and interaction

Current active runtime element types are:

- `symbol`
- `label`
- `value`
- `sensor`

### 10.3 Editing

[view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

Responsibilities:

- edit schema visually
- add elements from library
- edit style properties
- duplicate/delete/reorder elements
- save schema with name

### 10.4 Library

Files:

- [store/mnemo_library.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library.json)
- [store/mnemo_library/core.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/core.json)
- [store/mnemo_library/hvac.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/hvac.json)
- [store/mnemo_library/electrical.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/electrical.json)

The library is declarative:

- groups
- items
- primitives

This means new symbols are mostly data, not code.

Detailed format is documented separately in:

- [examples/communal/doc/mnemo_library.md](D:/PhpstormProjects/pilot_extensions/examples/communal/doc/mnemo_library.md)

## 11. Localization

Translations are stored in:

- [lang/lang.json](D:/PhpstormProjects/pilot_extensions/examples/communal/lang/lang.json)

Pattern:

- source strings in code are English
- runtime UI uses `l('...')`
- Russian translations are resolved from `lang.json`

Example:

```js
fieldLabel: l('Name')
```

When building your own module:

- keep keys stable
- avoid embedding Russian directly in JS
- load translations before building UI

## 12. Why This Module Is a Good Reference for Other Extensions

This module demonstrates how to build an extension that is larger than one simple panel:

- custom auth
- custom backend
- account-scoped business data
- custom tree CRUD
- external API consumption
- native PILOT integrations
- map interaction
- visual editor
- persistent custom schemas

That makes it a strong template for:

- monitoring modules
- vertical business modules
- GIS-heavy add-ons
- custom dashboards
- industry-specific operator interfaces

## 13. Suggested Pattern for Building Your Own Complex Module

If you want to create a module similar in complexity, this is a good order of work.

### Step 1. Make the bootstrap tiny

Create one module entry file like [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js) that only:

- loads scripts
- loads translations
- creates navigation tab
- creates main workspace panel
- injects CSS

### Step 2. Separate composition from logic

Use a thin composition container like [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js) and keep business logic in child panels.

### Step 3. Centralize auth

Use one auth singleton like [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js).

Do not scatter bearer-token logic across every file.

### Step 4. Build a small backend kernel

Use one shared bootstrap like [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php) for:

- config
- DB connection
- JSON output
- CORS
- bearer token validation

### Step 5. Normalize external API data once

This is what [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js) does.

Do not let every panel reinterpret raw payload independently.

### Step 6. Reuse native PILOT pieces

Before writing custom infrastructure, check whether PILOT already gives you:

- sidebar containers
- maps
- dialogs
- trees
- translations
- global skeleton containers

### Step 7. Prefer data-driven configuration for visual catalogs

The mnemonic symbol library is JSON-driven.

That is much easier to scale than hardcoding every visual element in JS.

## 14. Practical Warnings

### 14.1 Distinguish Ext components from wrapped native objects

Example:

- `this.map` may be an Ext component
- `this.map.map` may be the actual `MapContainer`

This matters when calling map methods.

### 14.2 Keep runtime contracts simple

Good examples in this module:

- integer element ids inside one schema
- single auth singleton
- one normalization step for sensor rows
- one backend bootstrap

### 14.3 Keep account isolation explicit

Always filter backend data by validated session account.

### 14.4 Avoid mixing persistence formats

The mnemo editor stores schemas in DB, not in browser-only temporary storage.

That is the right choice for shared operator tools.

## 15. Recommended Reading Order

If you are new to this extension, read files in this order:

1. [Module.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Module.js)
2. [Tab.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tab.js)
3. [Map.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Map.js)
4. [Tree.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Tree.js)
5. [Center.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Center.js)
6. [Info.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Info.js)
7. [Auth.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Auth.js)
8. [backend/init.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/init.php)
9. [backend/tree.php](D:/PhpstormProjects/pilot_extensions/examples/communal/backend/tree.php)
10. [Mnemo.js](D:/PhpstormProjects/pilot_extensions/examples/communal/Mnemo.js)
11. [MnemoStorage.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoStorage.js)
12. [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)
13. [view/MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

## 16. Final Takeaway

The main lesson of `communal` is this:

You can build a complex, domain-specific subsystem inside PILOT without fighting the host platform if you keep responsibilities separated:

- PILOT for shell, containers, maps, dialogs, object context
- extension backend for business logic and persistence
- external API for live domain data
- frontend adapter panels for normalization and presentation

That split is what makes the module scalable and maintainable.
