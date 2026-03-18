# Communal Module Context

## Purpose

This file is a fast-start context note for future work on the `examples/communal` module.
It captures the current architecture, important implementation choices, and fragile areas that should be preserved.

## Functional Goal

The module is used to:

- manage a коммунальное hierarchy in the tree
- bind hierarchy nodes to PILOT objects and agents
- load sensor status from PILOT API
- show grouped sensor data in the center panel
- show summary/problem information in the right panel
- display and edit mnemonic SVG schemes bound to tree nodes

## Main Files

- `Module.js`
  - module bootstrap
  - loads language file
  - loads SVG libraries from PILOT resources
  - injects `communal.css`

- `Tree.js`
  - reacts to tree selection
  - sends selected node context to center/info/mnemo panels

- `Center.js`
  - loads vehicle/sensor status from PILOT API
  - builds grid rows
  - handles sensor filtering and grouping

- `Info.js`
  - shows summary values like total/active/not active/issues

- `Mnemo.js`
  - viewer panel for node mnemonic schemes
  - loads/saves/removes schema through backend storage

- `MnemoRenderer.js`
  - single renderer for both viewer and editor
  - uses declarative primitives, not hardcoded icon families

- `view/MnemoEditorWindow.js`
  - mnemonic editor window
  - property form
  - keyboard control
  - library loading from JSON manifests/sources

- `MnemoStorage.js`
  - AJAX layer for mnemo backend

- `backend/mnemo.php`
  - DB-backed schema storage API

- `store/mnemo_library.json`
  - library manifest
  - points to multiple library source files

- `store/mnemo_library/core.json`
  - base library: pipes, arrows, graphics, text

- `store/mnemo_library/hvac.json`
  - HVAC/process-related library

- `store/mnemo_library/electrical.json`
  - electrical library

## Mnemo Library Architecture

The library is no longer hardcoded in JS.

Current model:

1. `store/mnemo_library.json` is a manifest
2. it contains `sources`
3. editor loads each source JSON
4. editor merges all `groups`
5. dataview is built from merged groups/items

Each symbol is described declaratively:

- `width`
- `height`
- optional `baseWidth`
- optional `baseHeight`
- `stroke`
- `strokeWidth`
- `fillColor`
- `opacity`
- `rotation`
- `primitives`

Supported primitive types:

- `line`
- `rect`
- `circle`
- `ellipse`
- `polygon`
- `polyline`
- `path`
- `text`

Important: avoid reintroducing old hardcoded symbol families into `MnemoRenderer.js`.
The current direction is fully data-driven rendering.

## Mnemo Editor Behavior

### Selection and Drag

- selected element has a blue dashed selection rectangle
- element can be dragged with mouse
- selected element can be moved with arrow keys
- `Delete` removes selected element
- hotkeys should not interfere with active text/number input fields

### Rotation

- rotation should happen around the real visual center of the rendered element
- current renderer uses `group.bbox()` center, not raw `width / height`

### Property Form

- user manually tuned layout; do not casually rewrite the form layout
- avoid adding back removed display fields or changing stable form structure without need
- form should stay scrollable on small window height

### Color Normalization

This behavior was explicitly validated by the user and should be preserved:

```js
normalizeColorForField: function (value) {
    value = String(value || '').replace('#', '').trim();

    return value;
},

normalizeColorForSave: function (value) {
    value = String(value || '').replace('#', '').trim();

    if (!value || value.toLowerCase() === 'none') {
        return value;
    }

    return '#' + value;
}
```

Reason:

- property form shows color without `#`
- saved schema keeps color with `#`
- `none` must remain `none`

Do not "simplify" this logic unless the user asks.

## Rendering Rules Worth Preserving

- `fillColor` must override primitive-level fill except when primitive fill is explicitly `none`
- arrows previously stayed black because primitive fill overrode element fill
- hit areas are needed for thin symbols so drag/click work reliably
- selection/drag logic is sensitive in old SVG.js from PILOT

## SVG Runtime

The project uses PILOT-bundled libraries:

- `/resources/js/svg.min.js`
- `/resources/js/svg.draggable.js`

Compatibility with newer SVG.js is not required.
Current work assumes the PILOT version.

## Storage

Mnemo schemes are stored in DB, not `localStorage`.

Relevant pieces:

- backend: `backend/mnemo.php`
- install SQL: `install/create _db.sql`

There was a mistaken temporary `create_db.php`, but it was removed.

## API / Center Panel Notes

- center panel sensor rows come from PILOT vehicle status API
- sensor grouping evolved toward object/group/name readability
- tags filtering and issues filtering were added
- right panel summary is based on loaded sensor rows

## Styling / UX Notes

- comments added in new code should be in English
- avoid breaking UTF-8 Russian strings
- a previous terminal rewrite broke Cyrillic, so be careful with encoding-sensitive edits
- do not change special glyph text like `emptyText: ''` unless explicitly requested

## Current Library Direction

The library should continue to move closer to an HMI/P&ID catalog style, inspired by AggreGate-like symbol sets:

- pipelines
- armature
- pumps
- heat exchange
- tanks
- ventilation
- sensors / instruments
- boilers
- filters / meters
- actuators
- electrical power / switchgear / control

When expanding the library:

- prefer adding new declarative items to JSON files
- keep mirrored and filled variants explicit if they are useful in operator UX
- avoid unnecessary duplicate color variants, since color is edited in properties

## What To Check First Next Time

If returning to this project later, review in this order:

1. `WORKLOG_CONTEXT.md`
2. `view/MnemoEditorWindow.js`
3. `MnemoRenderer.js`
4. `store/mnemo_library.json`
5. `store/mnemo_library/*.json`

That is usually enough to recover the mental model quickly.
