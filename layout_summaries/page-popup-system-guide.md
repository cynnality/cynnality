# Page Intro Popup System Guide

## Purpose

This system creates reusable page-intro popups for pages that need immediate context when a visitor arrives.

Use this when a page needs a short explanation before someone starts browsing.

This is different from:

```
tooltips
= optional help/context opened by the visitor

panes
= draggable/resizable page objects

page intro popups
= automatic context shown on initial page load
```

---

# File Location

The shared popup files live here:

```
general-elements/
└── page-popup/
    ├── page-popup.css
    └── page-popup.js
```

These files should hold the reusable popup styling and behavior.

Do not copy the popup JavaScript into every page.

Instead, link the shared files only on pages that need this popup system.

---

# How To Add The Popup System To A Page

Add these inside the page `<head>`:

```html
<link rel="stylesheet" href="../general-elements/page-popup/page-popup.css">
<script src="../general-elements/page-popup/page-popup.js" defer></script>
```

Adjust the `../` path depending on where the page lives.

Example:

```
page is in root folder:
general-elements/page-popup/page-popup.css

page is one folder deep:
../general-elements/page-popup/page-popup.css

page is two folders deep:
../../general-elements/page-popup/page-popup.css
```

---

# Basic Popup HTML

Add this to the page body:

```html
<button class="popup-open-btn" data-popup-open="pageIntroPopup" type="button">
    page context
</button>

<div id="pageIntroPopup" class="page-popup hidden" data-show-on-load="true">
    <div class="page-popup-card">
        <div class="page-popup-topbar">
            <h2>Before you explore this page</h2>
            <button class="page-popup-close" type="button">×</button>
        </div>

        <div class="page-popup-content">
            <p>
                Add page-specific intro/context text here.
            </p>
        </div>
    </div>
</div>
```

---

# Important HTML Pieces

## Open Button

```html
<button data-popup-open="pageIntroPopup">
```

This button reopens the popup after it has been closed.

The value must match the popup `id`.

Example:

```html
data-popup-open="basketballIntroPopup"
```

matches:

```html
id="basketballIntroPopup"
```

---

## Popup ID

```html
<div id="pageIntroPopup">
```

Each popup needs a unique ID.

Use clear names:

```
pageIntroPopup
basketballIntroPopup
postOfficeIntroPopup
viewerContextPopup
```

---

## Show On Initial Page Load

```html
data-show-on-load="true"
```

This makes the popup appear automatically when the page loads.

Remove it if the popup should only open when the visitor clicks the button.

---

## Hidden Class

```html
class="page-popup hidden"
```

The popup should usually start with `hidden`.

The JavaScript removes `hidden` on page load if:

```html
data-show-on-load="true"
```

is present.

---

## Close Button

```html
<button class="page-popup-close" type="button">×</button>
```

The shared JavaScript looks for this button inside the popup.

Do not rename this class unless you also update the JavaScript.

---

# Behavior

The shared JavaScript handles:

```
open popup from data-popup-open button
close popup from close button
close popup by clicking outside the popup card
close popup with Escape key
show popup automatically on page load
only show one page popup at a time
```

---

# What To Edit Per Page

Usually, only edit:

```
popup id
button text
popup heading
popup content
whether data-show-on-load is included
```

Example:

```html
<button class="popup-open-btn" data-popup-open="basketballIntroPopup" type="button">
    about this page
</button>

<div id="basketballIntroPopup" class="page-popup hidden" data-show-on-load="true">
```

---

# What Should Stay Shared

Keep these reusable:

```
page-popup.css
page-popup.js
```

The shared files should not contain page-specific text.

Good shared code:

```
popup layout
popup overlay
open/close behavior
Escape key behavior
click-outside behavior
```

Bad shared code:

```
basketball-specific intro text
post-office-specific wording
one page's custom explanation
```

---

# Best Practice

Use this pattern:

```
shared CSS
shared JS
page-specific HTML
```

Meaning:

```
general-elements/page-popup/page-popup.css
= reusable styling

general-elements/page-popup/page-popup.js
= reusable behavior

individual page HTML
= popup text/content for that page
```

This keeps the system reusable while allowing each page to have its own message.

---

# When To Use This

Use a page intro popup when:

```
the visitor needs immediate context
the page might be confusing without explanation
the page has special navigation or interaction rules
the page is experimental or tool-like
the visitor should know something before browsing
```

Do not use it for every page.

If context is optional, use a normal tooltip/help popup instead.

If the content should be draggable or stay visible as part of the page, use the pane system instead.

---

# Critical Things Not To Change

Avoid changing these unless intentionally updating the system:

```
.page-popup
.page-popup-card
.page-popup-close
.hidden
[data-popup-open]
[data-show-on-load="true"]
```

The JavaScript depends on these selectors.

Changing them in HTML without updating the JS will break the popup behavior.

---

# Simple Mental Model

```
HTML
= what the popup says

CSS
= how the popup looks

JS
= how the popup opens/closes
```

Each page provides its own popup content.

The shared files provide the behavior and styling.

---
---
# HTML ADD:

<button data-popup-open="pageIntroPopup" type="button">
    page context
</button>

<div id="pageIntroPopup" class="page-popup hidden" data-show-on-load="true">
    <div class="page-popup-card">
        <div class="page-popup-topbar">
            <h2>Before you explore</h2>
            <button class="page-popup-close" type="button">×</button>
        </div>
        <div class="page-popup-content">
            <p>Your page-specific context goes here.</p>
        </div>
    </div>
</div>

CSS TAG ->
<link rel="stylesheet" href="../../general-elements/page-popup/page-popup.css">

JS TAG -> 
<script src="../../general-elements/page-popup/page-popup.js"></script>