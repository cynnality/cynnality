# Reusable Pane System Summary

## Purpose

This setup creates a reusable “pane board” layout for site pages.

The idea is:

```txt
Page / board
    contains panes
        panes can be dragged
        panes can be resized
        basic panes can be closed/reopened
        feature/comprehensive panes can be minimized/expanded
    also contains static quick-link buttons
```

The system is meant to stay generic so new panes can be added mostly through HTML, without writing new JavaScript for each pane.

---

# Core Structure

## Main board

```html
<main class="home-board" id="homeBoard">
```

This is the main positioning area.

All draggable panes live inside this board.

Important:

```css
.home-board {
    position: relative;
}
```

This makes absolutely positioned panes use the board as their positioning context.

---

# Pane Naming Convention

Every movable panel uses:

```html
<section class="pane">
```

The shared `.pane` class is what gives every pane:

```txt
absolute positioning
border
background
resize behavior
overflow behavior
drag behavior through JS
```

Example:

```html
<section
    class="pane basic-pane"
    data-pane-id="about-site"
    data-pane-title="About this website"
    data-closable="true"
    style="left: 100px; top: 200px; width: 400px; height: 250px;"
>
```

---

# Required Pane Pieces

Every pane should have:

```html
<div class="pane-topbar" data-drag-handle>
```

This is the draggable handle.

Inside the topbar:

```html
<h2>Pane Title</h2>
```

Then optional controls:

```html
<button class="pane-close">×</button>
```

or:

```html
<button class="pane-minimize-btn">−</button>
```

Then the content area:

```html
<div class="pane-content">
    ...
</div>
```

---

# Data Attributes

## `data-pane-id`

Required for any pane that needs to be closed/reopened or tracked.

```html
data-pane-id="digital-garden"
```

This should be unique.

Use lowercase/kebab-case.

Good:

```txt
digital-garden
basketball
about-site-general
old-index-link
```

Avoid:

```txt
Digital Garden
basketball page!!!
pane1
```

---

## `data-pane-title`

Used for display labels, especially reopen buttons.

```html
data-pane-title="Digital Garden ?"
```

If missing, the JS falls back to `data-pane-id`.

---

## `data-closable="true"`

Use only for basic panes that should disappear and become a reopen button.

```html
data-closable="true"
```

These panes need:

```html
<button class="pane-close" type="button">×</button>
```

Important:

Closability should only apply to panes that are intentionally temporary/dismissible.

---

## `data-minimizable="true"`

Use for larger feature/comprehensive panes that should collapse to only the topbar.

```html
data-minimizable="true"
```

These panes need:

```html
<button class="pane-minimize-btn" type="button">−</button>
```

Important:

A minimizable pane should not also have `data-closable="true"` unless you intentionally want both behaviors.

Usually:

```txt
basic pane = closable
feature pane = minimizable
```

---

# Pane Types

## Basic pane

Used for small text notes, descriptions, reminders, simple links.

```html
<section class="pane basic-pane" data-closable="true">
```

Behavior:

```txt
drag
resize
close
reopen from tray
```

---

## Feature pane / comprehensive pane

Used for larger sections with more layout inside.

```html
<section class="pane feature-pane" data-minimizable="true">
```

Behavior:

```txt
drag
resize
minimize
expand
```

---

# Reopen Tray

```html
<nav class="reopen-tray" id="reopenTray"></nav>
```

This is where buttons appear when basic panes are closed.

The JS automatically creates buttons like:

```txt
+ Digital Garden ?
```

Important:

Do not manually add reopen buttons for panes. The JS does that.

---

# Quick Links

Quick links are not panes.

They are static navigation buttons:

```html
<nav class="quick-links" aria-label="Quick links">
    <a class="quick-link" href="..." data-tooltip="send me a letter">✉</a>
</nav>
```

They use:

```css
.quick-link::after {
    content: attr(data-tooltip);
}
```

So the tooltip text comes from:

```html
data-tooltip="send me a letter"
```

Important:

Quick links should not use `.pane`.

They should not be draggable or resizeable.

---

# Dragging Logic

Dragging works through this flow:

```txt
mousedown on [data-drag-handle]
    ↓
startDrag()
    ↓
mousemove on window
    ↓
moveActivePane()
    ↓
mouseup on window
    ↓
stopDrag()
```

The JS stores the current pane being dragged in:

```js
let activeDrag = null;
```

The drag math uses:

```js
event.pageX
event.pageY
```

not:

```js
event.clientX
event.clientY
```

This is important because the page scrolls.

`pageX/pageY` includes scroll position.
`clientX/clientY` only sees the viewport and can cause snapping when the page is scrolled.

Do not change this back unless the board becomes fixed-height/non-scrolling again.

---

# Z-Index Logic

The system keeps panes stacking correctly with:

```js
let highestZIndex = 10;
```

Every time a pane is clicked or dragged:

```js
bringPaneForward(pane);
```

This increments the z-index so the active pane comes to the front.

Important:

Avoid hardcoding random high z-index values on individual panes unless necessary.

---

# Closing Logic

Only panes with:

```html
data-closable="true"
```

and a:

```html
.pane-close
```

button can close.

Close behavior:

```txt
pane.hidden = true
↓
create reopen button in reopen tray
```

The pane is not deleted.

It is only hidden.

---

# Minimize Logic

Only panes with:

```html
data-minimizable="true"
```

and a:

```html
.pane-minimize-btn
```

button can minimize.

Minimize behavior:

```txt
toggle .is-minimized
hide .pane-content
change button from − to +
```

The pane stays visible.

It does not create a reopen button.

---

# Resizing

Panes resize through CSS:

```css
.pane {
    resize: both;
    overflow: auto;
}
```

This keeps the JS simple.

The browser handles resizing.

Important:

If a pane is minimized, resizing is disabled:

```css
.pane.is-minimized {
    resize: none;
    overflow: hidden;
}
```

---

# Initial Positioning

Each pane currently uses inline styles:

```html
style="left: 520px; top: 75px; width: 380px; height: 420px;"
```

This is okay for this system because:

```txt
HTML defines the pane
CSS defines shared behavior
inline style defines starting placement
JS controls movement after load
```

Alternative future option:

```css
[data-pane-id="basketball"] {
    left: 920px;
    top: 500px;
    width: 560px;
    height: 300px;
}
```

This is cleaner if the page gets larger.

---

# CSS Targeting by Pane ID

To style one pane specifically:

```css
.pane[data-pane-id="basketball"] {
    background: #fff;
}
```

or:

```css
[data-pane-id="old-index-link"] .pane-topbar {
    background: #ec3232b9;
}
```

This is preferred over adding lots of one-off classes.

---

# Mobile Behavior

At small screen sizes, panes stop being absolute:

```css
@media (max-width: 850px) {
    .home-header,
    .reopen-tray,
    .pane {
        position: static;
        width: auto !important;
        height: auto !important;
    }
}
```

This turns the page into a normal stacked layout on mobile.

Important:

This is what prevents draggable desktop panes from becoming unusable on small screens.

---

# What Should Stay Generic

The JavaScript should not know about specific panes like:

```txt
basketball
digital-garden
old-index-link
```

It should only care about:

```txt
.pane
data-pane-id
data-closable
data-minimizable
.pane-close
.pane-minimize-btn
[data-drag-handle]
```

That is what makes it reusable across pages.

---

# What Should Not Be Changed Casually

Do not casually change these unless intentionally redesigning the system:

```txt
.pane
.pane-topbar
.pane-content
[data-drag-handle]
data-pane-id
data-closable
data-minimizable
reopenTray id
event.pageX / event.pageY drag math
position: relative on board
position: absolute on panes
```

These are the structural glue.

---

# How to Add a New Basic Pane

```html
<section
    class="pane basic-pane"
    data-pane-id="new-note"
    data-pane-title="New Note"
    data-closable="true"
    style="left: 100px; top: 400px; width: 360px; height: 220px;"
>
    <div class="pane-topbar" data-drag-handle>
        <h2>New Note</h2>
        <button class="pane-close" type="button" aria-label="Close pane">×</button>
    </div>

    <div class="pane-content">
        <p>Text goes here.</p>
    </div>
</section>
```

No new JS required.

---

# How to Add a New Feature Pane

```html
<section
    class="pane feature-pane"
    data-pane-id="projects"
    data-pane-title="Projects"
    data-minimizable="true"
    style="left: 600px; top: 300px; width: 560px; height: 340px;"
>
    <div class="pane-topbar" data-drag-handle>
        <h2>Projects</h2>
        <button class="pane-minimize-btn" type="button" aria-label="Minimize pane">−</button>
    </div>

    <div class="pane-content">
        <p>Feature content goes here.</p>
    </div>
</section>
```

No new JS required.

---

# How to Add a Quick Link

```html
<a class="quick-link" href="path/to/page.html" data-tooltip="tooltip text">
    ✉
</a>
```

No new JS required.

---

# Main Principle

This system works because behavior is controlled by reusable attributes/classes:

```txt
data-closable
data-minimizable
data-pane-id
data-tooltip
```

Instead of custom JavaScript for every new pane.

So the best long-term rule is:

```txt
Add new content in HTML.
Add custom appearance in CSS.
Only update JS when adding a new behavior type.
```
