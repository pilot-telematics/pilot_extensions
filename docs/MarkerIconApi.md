

# Marker Icon Generator API

Endpoint returns an **SVG marker icon** that you can use on maps and UIs:

```text
{base_url}/markers/get.php?...parameters...
```

Example:

```text
{base_url}/markers/get.php?a=1&c=FF0000&txt=TAXI&d=180
```

---

## 1. Quick parameter overview

| Param         | Required | Default (if omitted)                          | Allowed values                                    | Purpose                                               |
| ------------- | -------- | --------------------------------------------- | ------------------------------------------------- | ----------------------------------------------------- |
| `a`           | ✅ Yes    | *(undefined)*                                 | Numeric ID or base name string                    | Base icon type (car, truck, etc.)                     |
| `b`           | No       | Off (light theme) unless `dark` cookie is set | presence/absence                                  | Dark theme switch                                     |
| `d`           | No       | No direction arrow                            | Integer degrees (recommended 0–360)               | Direction arrow rotation                              |
| `color` / `c` | No       | `737373` (neutral gray)                       | 6-digit hex (`0–9A–F`)                            | Main stroke/text color                                |
| `e`           | No       | `0` (off)                                     | `0` or `1`                                        | Equipment circle                                      |
| `i`           | No       | `0` (off)                                     | `0` or `1`                                        | Ignition icon                                         |
| `s`           | No       | `0` (off)                                     | Any integer; `>0` is treated as `1`               | “Moving / speed” flag (green arrow)                   |
| `txt`         | No       | Empty (no text)                               | Any string; first 3 characters are shown          | Text label inside the marker                          |
| `t`           | No       | Empty (no trailer)                            | Any non-empty string (commonly `1`)               | Trailer indicator                                     |
| `z`           | No       | `0` (off)                                     | `0` or `1`                                        | Snooze / sleep icon                                   |
| `al`          | No       | `0` (off)                                     | `0` or `1`                                        | Alert icon                                            |
| `n`           | No       | Off                                           | presence/absence                                  | “No signal” state for direction arrow                 |
| `f`           | No       | Light: `FFFFFF` / Dark: `27272A`              | 6-digit hex (`0–9A–F`)                            | Fill (background) color                               |
| `ico`         | No       | No custom image                               | File name from `/pilot/markers/`, e.g. `icon.png` | Custom PNG in the center                              |
| `l`           | No       | No additional level icon                      | See table below                                   | Adds extra “level” icons (info, ignition, park, etc.) |

---

## 2. Parameters in detail

### 2.1 `a` – base icon type

**Purpose:** choose the main picture inside the marker (car, truck, tractor, etc.).

* **Required:** Yes
* **Default:** none — must be provided for predictable behavior
* **Allowed values:**

    * Numeric ID from the table “Base icon IDs” below (**recommended**), or
    * A base file name string (SVG snippet file present in the working directory)

**Usage examples:**

```text
a=1      → car
a=2      → truck
a=101    → cargo
```

If the numeric ID exists in the base icon table, it is mapped to the corresponding icon type.
If it does not exist, the code tries to load a file based on that value (implementation detail).

---

### 2.2 `b` – dark theme

**Purpose:** switch between light and dark visual style.

* **Required:** No
* **Default:**

    * Off (light theme)
    * On if cookie `dark` is already set in the browser
* **Allowed values:**

    * Parameter presence enables dark theme, value is ignored, e.g.:

      ```text
      &b
      &b=1
      ```

**Impact:**

* Light theme default fill: `FFFFFF`
* Dark theme default fill: `27272A`
* Shadows, strokes, and other SVG styles are adjusted accordingly.

---

### 2.3 `d` – direction (arrow rotation)

**Purpose:** draw a directional arrow at the bottom of the marker.

* **Required:** No
* **Default:** no direction arrow if the parameter is omitted
* **Allowed values:** integer (recommended 0–360; degrees)

**Examples:**

```text
d=0     → pointing north
d=90    → east
d=180   → south
d=270   → west
```

If direction is **not set**, no bottom arrow is drawn.

The **color** of this arrow depends on `s` and `n`:

* If `n` is present → red “no signal” arrow
* Else if `s > 0`  → green “moving/speed” arrow
* Else             → gray “normal” arrow

---

### 2.4 `color` / `c` – main color

**Purpose:** main color for text and many strokes.

* **Required:** No
* **Default:** `737373` (neutral gray)
* **Allowed values:** 6-digit hex value (letters can be upper or lower case)

**Rules:**

* Either `color` or `c` can be used; `color` is internally mapped to `c`.
* If it does **not** match the hex pattern, the default is used.

**Examples:**

```text
c=FF0000      → red
c=00FF00      → green
c=0000FF      → blue
color=F59E0B  → amber
```

---

### 2.5 `e` – equipment circle

**Purpose:** display a circle around the marker to indicate equipment is working.

* **Required:** No
* **Default:** `0` (off)
* **Allowed values:** integer; recommended `0` or `1`

**Behavior:**

* `e=0` → no equipment circle
* `e>0` (e.g. `1`) → orange circle around the marker

---

### 2.6 `i` – ignition icon

**Purpose:** show ignition icon (key) on the marker.

* **Required:** No
* **Default:** `0` (off)
* **Allowed values:** `0` or `1`

**Behavior:**

* `i=0` → ignition icon hidden
* `i=1` → ignition icon shown (amber key symbol)

---

### 2.7 `s` – speed / moving flag

**Purpose:** mark object as moving or speeding; affects direction arrow color.

* **Required:** No
* **Default:** `0` (off)
* **Allowed values:** any integer

**Internal logic:**

* If `s > 0`, it is treated as `1` (object moving, speed active)
* If `s <= 0` (or not provided), it is treated as `0`

**Effects:**

* If `d` is set and `s > 0` and `n` not set → bottom arrow turns **green**
* Else normal gray/red rules apply

**Examples:**

```text
s=0    → standing
s=1    → moving
s=20   → still treated as “moving”
```

---

### 2.8 `txt` – text label inside marker

**Purpose:** display text instead of an icon, in the center of the marker.

* **Required:** No
* **Default:** empty string (no text drawn)
* **Allowed values:** any string

**Important:**

* Only the **first 3 characters** are visible on the icon.

**Examples:**

```text
txt=BUS         → shows “BUS”
txt=1234        → shows “123”
txt=Taxi        → shows “Tax”
txt=            → no text
```

---

### 2.9 `t` – trailer indicator

**Purpose:** show a blue trailer icon near the marker.

* **Required:** No
* **Default:** empty (no trailer)
* **Allowed values:** any non-empty string (recommended `1`)

**Behavior:**

* If parameter is **present and non-empty**, trailer icon is displayed.
* Typical use: `t=1` when a trailer is attached.

---

### 2.10 `z` – snooze / sleep indicator

**Purpose:** show a purple “zzz” snooze icon.

* **Required:** No
* **Default:** `0` (off)
* **Allowed values:** `0` or `1`

**Behavior:**

* `z=0` → no snooze icon
* `z=1` → snooze icon shown

---

### 2.11 `al` – alert indicator

**Purpose:** show a red alert icon (“!”).

* **Required:** No
* **Default:** `0` (off)
* **Allowed values:** `0` or `1`

**Behavior:**

* `al=0` → alert icon hidden
* `al=1` → red alert icon shown (with white stroke)

---

### 2.12 `n` – no-signal state

**Purpose:** mark that the object has no signal; affects only direction arrow.

* **Required:** No
* **Default:** off (no no-signal state)
* **Allowed values:** presence of parameter (value is ignored)

**Behavior:**

* If `n` is present and `d` is set → bottom arrow drawn in **red hues**
* If `n` is absent:

    * and `s > 0` → arrow is green
    * else → arrow is gray

**Examples:**

```text
&n       → “no signal” (arrow red, if direction is used)
&n=1     → same as above
```

---

### 2.13 `f` – fill (background) color

**Purpose:** define main background fill color of the marker.

* **Required:** No
* **Default:**

    * Light theme (no `b`): `FFFFFF` (white)
    * Dark theme (`b` or dark cookie): `27272A`
* **Allowed values:** 6-digit hex value

If present and valid, this parameter **overrides** the theme-based default.

**Examples:**

```text
f=FFFFFF  → white fill
f=000000  → black fill
f=F97316  → orange fill
```

---

### 2.14 `ico` – custom PNG inside the marker

**Purpose:** insert a custom PNG image in the center of the marker.

* **Required:** No
* **Default:** none (base icon or text is used instead)
* **Allowed values:** file name, after sanitization, relative to `/pilot/markers/`

**Rules:**

* Any characters except `[a–z0–9_]` are removed from the name.

* The file is loaded from:

  ```text
  /pilot/markers/{ico}
  ```

* It is embedded as a base64 PNG inside the SVG.

**Examples:**

```text
ico=my_logo.png
ico=bus_white_24.png
```

If the file does not exist, the script falls back to the base SVG icon.

---

### 2.15 `l` – additional level icons (info, route, park, etc.)

**Purpose:** add extra “level” icons (small overlays) to the main marker.

* **Required:** No
* **Default:** if `l` not set → no extra icon
* If `l` is set but unknown → a default “info” icon is used

**Allowed values:**

The following values are recognized:

| `l` value | Meaning / file loaded  |
| --------- | ---------------------- |
| `0`       | info                   |
| `1`       | ign (ignition-related) |
| `6`       | power                  |
| `8`       | sel (selection)        |
| `9`       | drain                  |
| `10`      | fill                   |
| `11`      | zone                   |
| `12`      | route                  |
| `p`       | park                   |
| `b`       | bell                   |
| `s`       | start                  |
| `e`       | end                    |

**Behavior:**

* If `l` matches one of the keys above → corresponding icon is drawn.
* If `l` is present but unknown → the “info” icon (`0`) is used as fallback.

**Examples:**

```text
l=0    → info icon
l=12   → route icon
l=p    → park icon
```

---

## 3. Base icon IDs (parameter `a`)

When `a` is numeric, it is mapped to one of the following base types:

| `a` value | Base type name | Comment / meaning (from code comments) |
| --------- | -------------- | -------------------------------------- |
| 1         | car            | Car                                    |
| 2         | truck          | Truck                                  |
| 3         | per            | Passenger / personnel                  |
| 4         | tractor        | Tractor                                |
| 5         | exc            | Excavator                              |
| 6         | bus            | Bus                                    |
| 7         | exc            | Autocrane                              |
| 8         | tower          | Auto hydraulic lift                    |
| 9         | truck          | Brigade truck                          |
| 10        | exc            | Crane-boring machine                   |
| 11        | tractor        | Crawler tractor                        |
| 12        | truck          | Sided truck                            |
| 13        | tractor        | Road tractor                           |
| 14        | car            | ATV                                    |
| 15        | truck          | TREKOL                                 |
| 16        | truck          | OVT                                    |
| 17        | tractor        | Tractor (generic)                      |
| 18        | truck          | Truck                                  |
| 19        | exc            | Excavator / F                          |
| 20        | static         | Static object                          |
| 21        | electro        | Electric vehicle                       |
| 22        | lorry          | Lorry                                  |
| 23        | eng            | Engine / generator                     |
| 24        | light          | Lighting tower / light                 |
| 25        | dog            | Dog                                    |
| 26        | horse          | Horse                                  |
| 27        | train          | Train                                  |
| 28        | crane          | Crane                                  |
| 29        | bicycle        | Bicycle                                |
| 30        | motocycle      | Motorcycle                             |
| 31        | cow            | Cow                                    |
| 32        | ship           | Ship / boat                            |
| 33        | bigrig         | Big rig / heavy truck                  |
| 34        | trailer        | Trailer                                |
| 35        | scooter        | Scooter                                |
| 36        | segway         | Segway                                 |
| 37        | hover          | Hoverboard                             |
| 38        | mono           | Monowheel                              |
| 39        | pickup         | Pickup                                 |
| 40        | mixer          | Mixer truck                            |
| 41        | service        | Service vehicle                        |
| 42        | excavator      | Excavator (large)                      |
| 43        | combine        | Combine harvester                      |
| 44        | minibus        | Minibus                                |
| 45        | van            | Van                                    |
| 46        | deltruck       | Delivery truck                         |
| 47        | acdc           | AC/DC equipment                        |
| 48        | access         | Access platform                        |
| 49        | static         | Environmental sensor / static (ENV)    |
| 50        | meter          | Environmental meter (ENV)              |
| 51        | golfcar        | Golf car                               |
| 52        | frontloader    | Front loader                           |
| 53        | dumpster       | Dumpster                               |
| 54        | ladder         | Ladder truck                           |
| 55        | lift           | Lift                                   |
| 56        | plow           | Plow                                   |
| 57        | tuktuk         | Tuk-tuk                                |
| 74        | tractor        | Harvest vehicle                        |
| 76        | crane          | Crane                                  |
| 77        | tower          | Tower / aerial platform                |
| 78        | tanker         | Tanker                                 |
| 79        | dozer          | Bulldozer                              |
| 80        | backhoe_loader | Backhoe loader                         |
| 81        | skid_steer     | Skid-steer loader                      |
| 101       | cargo          | Cargo                                  |

If a numeric `a` is **not** in this table, the system attempts to load a base icon file by name (implementation detail).

---

## 4. Example requests

### 4.1 Simple car marker, default colors

```text
markers/get.php?a=1
```

### 4.2 Red truck with direction and moving arrow

```text
markers/get.php?a=2&c=FF0000&d=90&s=1
```

### 4.3 Excavator with equipment ring and ignition on, dark theme

```text
markers/get.php?a=5&b&e=1&i=1
```

### 4.4 Van with text “TAXI”, green fill, info level

```text
markers/get.php?a=45&txt=TAXI&f=00FF00&l=0
```

### 4.5 Cargo icon with trailer, no signal, route level

```text
markers/get.php?a=101&t=1&n&d=180&l=12
```

---

If you want, I can now add a **short “how-to” section for your frontend developers** (Leaflet, OpenLayers, Google Maps) based on these parameters.
