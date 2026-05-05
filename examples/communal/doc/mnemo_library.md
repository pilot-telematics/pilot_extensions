# Mnemo Library Format

## Purpose

The mnemo library is a data-driven catalog of reusable SVG-like symbols used by the communal mnemonic editor.

The library is not hardcoded in renderer logic. The editor loads JSON files, builds groups and items from them, and inserts item definitions into `schema_json`.

## File Structure

Current structure:

- [mnemo_library.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library.json)
  - manifest file
  - contains a list of source JSON files

- [core.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/core.json)
  - base graphics
  - pipelines
  - arrows
  - text helpers

- [hvac.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/hvac.json)
  - HVAC/process symbols
  - armature
  - pumps
  - tanks
  - heat exchange
  - sensors
  - boilers

- [electrical.json](D:/PhpstormProjects/pilot_extensions/examples/communal/store/mnemo_library/electrical.json)
  - electrical symbols

## Loading Flow

1. The editor requests the manifest JSON.
2. The manifest returns `sources`.
3. Each source JSON is loaded separately.
4. All `groups` from all source files are merged into one in-memory library.
5. The group combobox and symbol dataview are built from merged items.

Editor code:

- [MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)

Renderer code:

- [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)

## Manifest Format

Example:

```json
{
  "sources": [
    "mnemo_library/core.json",
    "mnemo_library/hvac.json",
    "mnemo_library/electrical.json"
  ]
}
```

Rules:

- `sources` is an array of relative file paths
- paths are resolved by the editor relative to `/store/communal/store/`
- source files are merged in the listed order

## Source File Format

Each source file contains:

```json
{
  "groups": [
    {
      "id": "heat_exchange",
      "title": "Heat exchange",
      "items": []
    }
  ]
}
```

### Group Fields

- `id`
  - internal stable identifier
  - used by the combobox and filtering logic

- `title`
  - user-facing group name shown in the editor

- `items`
  - array of library items

## Item Types

There are 3 practical item modes in the current system.

### 1. `symbol`

This is the main library item type.

Example:

```json
{
  "key": "heat_rect_diag",
  "title": "Exchanger diagonal",
  "type": "symbol",
  "width": 72,
  "height": 72,
  "baseWidth": 64,
  "baseHeight": 64,
  "stroke": "#111111",
  "strokeWidth": 2,
  "fillColor": "#ffffff",
  "opacity": 1,
  "rotation": 0,
  "primitives": []
}
```

Supported fields:

- `key`
  - stable item identifier inside the library

- `title`
  - item caption shown in the dataview

- `type`
  - usually `symbol`

- `width`
  - default inserted width

- `height`
  - default inserted height

- `baseWidth`
  - optional original drawing width
  - used for renderer scaling
  - default fallback is `64`

- `baseHeight`
  - optional original drawing height
  - used for renderer scaling
  - default fallback is `64`

- `stroke`
  - default line color

- `strokeWidth`
  - default line width

- `fillColor`
  - default fill color

- `opacity`
  - default opacity

- `rotation`
  - default rotation

- `primitives`
  - array of drawing primitives

### 2. `insertType: "label"`

This item does not store a custom primitive set.
It tells the editor to create a runtime `label` element using `createElementConfig('label')`.

Example:

```json
{
  "key": "label",
  "title": "Text label",
  "insertType": "label",
  "previewText": "ABC"
}
```

### 3. `insertType: "value"`

This item creates a runtime `value` element that can be bound to live sensor data.

Example:

```json
{
  "key": "value",
  "title": "Value field",
  "insertType": "value",
  "previewText": "42.1"
}
```

### 4. `insertType: "sensor"`

This item creates a runtime `sensor` element using editor defaults instead of static primitive definitions.

Example:

```json
{
  "key": "sensor_tag_generic",
  "title": "Instrument tag",
  "insertType": "sensor",
  "previewText": "P"
}
```

Use this for simple circular tags like:

- `P`
- `T`
- `ΔP`
- `M`

## Primitive Format

`symbol` items are rendered from `primitives`.

Supported primitive `type` values:

- `line`
- `rect`
- `circle`
- `ellipse`
- `polygon`
- `polyline`
- `path`
- `text`

### Common Style Fields

Many primitives support:

- `stroke`
- `fill`
- `strokeWidth`
- `opacity`
- `dasharray`
- `linecap`
- `rotation`

Primitive-level values override item-level defaults when explicitly set.

### Primitive Examples

#### `line`

```json
{
  "type": "line",
  "x1": 8,
  "y1": 32,
  "x2": 56,
  "y2": 32,
  "linecap": "round"
}
```

#### `rect`

```json
{
  "type": "rect",
  "x": 10,
  "y": 12,
  "width": 44,
  "height": 40,
  "fill": "#ffffff"
}
```

Optional:

- `rx`
- `ry`

#### `circle`

```json
{
  "type": "circle",
  "cx": 32,
  "cy": 32,
  "r": 18,
  "fill": "#ffffff"
}
```

#### `ellipse`

```json
{
  "type": "ellipse",
  "cx": 32,
  "cy": 32,
  "rx": 18,
  "ry": 10
}
```

#### `polygon`

```json
{
  "type": "polygon",
  "points": "16,32 32,20 32,44"
}
```

#### `polyline`

```json
{
  "type": "polyline",
  "points": "10,28 18,12 26,28 34,12 42,28",
  "fill": "none"
}
```

#### `path`

```json
{
  "type": "path",
  "d": "M32 56 L32 24 Q32 12 44 12 L56 12",
  "fill": "none"
}
```

#### `text`

```json
{
  "type": "text",
  "text": "P",
  "x": 32,
  "y": 21,
  "fontSize": 14,
  "fontWeight": 700,
  "textAnchor": "middle",
  "fill": "#111111"
}
```

Additional text fields:

- `fontFamily`
- `fontWeight`
- `textAnchor`
- `dominantBaseline`

## Runtime Element Format in `schema_json`

Library items are copied into schema elements.

Typical runtime `symbol` element:

```json
{
  "id": 12,
  "key": "heat_rect_diag",
  "type": "symbol",
  "x": 320,
  "y": 180,
  "width": 72,
  "height": 72,
  "baseWidth": 64,
  "baseHeight": 64,
  "stroke": "#111111",
  "strokeWidth": 2,
  "fillColor": "#ffffff",
  "opacity": 1,
  "rotation": 0,
  "primitives": []
}
```

Notes:

- `id` is an integer unique inside one schema
- new ids are generated as `max(existing ids) + 1`
- duplicate or invalid ids are normalized on load

## Color Rules

Current behavior:

- item-level `fillColor` is intended to be editable in the form
- primitive-level `fill` can still be used for explicit internal details
- `fillColor` should not override primitives where `fill` is explicitly `none`

The editor property form uses color values without `#`, but saved schema values keep `#`.

## Preview Rules

The editor uses the same primitive data both for:

- canvas rendering
- library preview rendering

Preview HTML is produced by:

- `MnemoRenderer.previewMarkup()`

This means item definitions should stay simple and renderer-friendly.

## Practical Rules For Adding New Items

Recommended approach:

1. Choose the correct source file:
   - `core.json`
   - `hvac.json`
   - `electrical.json`
2. Choose the correct group.
3. Add one new item with:
   - `key`
   - `title`
   - default sizes
   - style defaults
   - primitive list
4. Validate the JSON.
5. Check preview and inserted shape in the editor.

## KISS Guidance

The library should stay simple.

Prefer:

- a small number of clear primitives
- explicit coordinates
- duplicated variants only when they are genuinely useful
- simple shapes over complex imported SVG fragments

Avoid:

- unnecessary nesting
- over-generalized metadata
- trying to encode a full SVG engine inside JSON

## Related Files

- [MnemoRenderer.js](D:/PhpstormProjects/pilot_extensions/examples/communal/MnemoRenderer.js)
- [MnemoEditorWindow.js](D:/PhpstormProjects/pilot_extensions/examples/communal/view/MnemoEditorWindow.js)
- [WORKLOG_CONTEXT.md](D:/PhpstormProjects/pilot_extensions/examples/communal/WORKLOG_CONTEXT.md)
