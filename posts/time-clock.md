# Post Builder Architecture Update

## Canvas-Based Text Editing Refactor

---

# Overview

After implementing the first version of the Visual Builder tools, the current "Text Block" implementation is more complicated than necessary and does not align with the long-term philosophy of the Post Builder.

The original goal of the editor has always been to function similarly to an SVG editor or browser DevTools inspector:

* The Preview area is the primary editing canvas.
* The Toolbox generates reusable elements.
* The Inspector edits selected elements.
* The DOM itself becomes the document structure.

The current implementation partially achieves this, but text insertion currently relies on preset relationships between Box classes and Text classes that introduce unnecessary complexity.

This patch proposes simplifying the entire text workflow.

---

# Current Builder Architecture

Current builder workflow:

```
Toolbox
    ↓
Generate HTML/CSS
    ↓
Insert into markdown/html source
    ↓
Preview renders
    ↓
Preview acts as editable canvas
    ↓
Inspector edits selected element
```

Current systems include:

* Marker Builder
* Box Builder
* DOM Tree
* DOM Lineage
* Inspector
* Flexible CSS Editor
* Write Mode
* Preview Grid
* Box Presets
* Marker Presets

Overall, the architecture is working well.

The primary area needing simplification is Text Blocks.

---

# Current Text Block Logic

Current implementation:

```
Create Box
        ↓
Save Box Preset
        ↓
Generate Text Preset
        ↓
Generate auto class
        ↓
Select box
        ↓
Sync text preset
        ↓
Insert paragraph
        ↓
Maintain box/text relationship
```

This introduced:

```
TEXT_BLOCK_PRESETS

activeTextBlockPreset

ensureTextBlockPresetForBox()

loadTextBlockPresetForBox()

syncTextBlockPanelToSelectedElement()

getTextClassFromBoxClass()
```

along with automatic:

```
general
↓

general-text
```

class generation.

---

# Problems

The current implementation introduces unnecessary coupling.

Text becomes dependent upon:

* active preset
* selected box
* generated class name
* selected element selector
* builder id
* insert target
* preset synchronization

instead of simply existing as another editable DOM element.

This creates edge cases:

* duplicate boxes
* duplicate classes
* builder ids
* insert targeting
* synchronization bugs
* stale preset state
* confusing UI

The result is more logic than actual functionality.

---

# New Philosophy

The Preview Canvas should become the editor.

The Toolbox should only generate components.

The Inspector should only style components.

Components should not need hidden relationships with one another.

Instead:

```
Select element

↓

Insert child component

↓

Style child component
```

Everything becomes a node in the document tree.

---

# New Text Workflow

Instead of:

```
Box

↓

Text preset

↓

Text preset class

↓

Insert
```

the workflow becomes:

```
Select Box

↓

Choose Child Component

↓

Insert Child

↓

Edit Child

↓

Style Child
```

Text is simply another child component.

---

# Proposed Toolbox Section

```
Selected Element

div.general

------------------------

Add Paragraph

Add Long Text

Add Bullet List

Add Heading

Add Custom HTML
```

The selected preview element determines where insertion occurs.

No additional preset logic is required.

---

# Paragraph

Produces:

```
<p>
Type here...
</p>
```

Nothing more.

No automatic class generation.

---

# Long Text

Produces:

```
<p>
Lorem ipsum...
</p>
```

or an empty paragraph ready for Write Mode.

---

# Bullet List

Produces:

```
<ul>

<li>Type here...</li>

<li>Type here...</li>

</ul>
```

---

# Heading

Produces:

```
<h2>

Heading

</h2>
```

---

# Custom HTML

Produces:

```
<custom>

</custom>
```

or any arbitrary element.

---

# Styling Philosophy

Styling should remain independent from insertion.

Insertion creates structure.

Inspector creates appearance.

Example:

```
Add Paragraph

↓

<p>

Type here

</p>

↓

Select paragraph

↓

Inspector

↓

Apply class

↓

Apply CSS
```

The paragraph does not need to know which box it belongs to.

It already belongs to that box through DOM hierarchy.

---

# Optional Future Enhancement

An optional convenience checkbox could exist:

```
☑ Use parent class prefix
```

If enabled:

```
.general

↓

.general-text
```

would be generated automatically.

However, this should be entirely optional and should never be required for insertion.

The default should remain:

```
<p>

Type here

</p>
```

---

# Relationship to DOM Tree

This approach aligns naturally with the existing DOM Tree panel.

```
div.general

├── p

├── p

├── ul

│   ├── li

│   ├── li

├── h2
```

The hierarchy itself becomes the organizational system.

No additional preset mapping is necessary.

---

# Long-Term Vision

The Visual Builder should evolve toward a component-based canvas editor.

The Preview should become the application's primary workspace.

The Toolbox should insert reusable structural components.

The Inspector should modify selected components.

Future insertable components may include:

* Paragraph
* Heading
* Bullet List
* Image
* Quote
* Callout
* Timeline
* Link Cluster
* Map
* Table
* Accordion
* Gallery
* Divider
* Caption
* Sidebar
* Two-column layout
* Citation
* Note
* Footnote

Each of these should simply be inserted into the currently selected element.

No hidden relationships between component types should be required.

The DOM hierarchy itself should represent the document structure.

This approach is significantly simpler, more scalable, easier to debug, and much closer to the original DevTools/SVG editor inspiration for the Post Builder.



Patch 1: ✅✅✅✅✅✅
Fix deselect + save cleanup


Patch 2: ✅✅✅✅✅✅
Make selected element insertion automatic

Patch 3: ✅✅✅✅✅✅
Remove Basic Style Inspector

Patch 4: ✅✅✅✅✅✅
Combine Content Tools UI

Patch 5: ✅✅✅✅✅✅
Compact Box Builder layout

Patch 6: (separate)
Split JS into modules

- add-post-tool.js
- add-post-tool-components.js (new)
- add-post-tool-inspector.js (new)

### add-post-tool.js
should own:
DOM refs
global state
load/save
post metadata
page select
content/style file paths
preview rendering
init()
main event wiring

answers:
What post am I editing?
Where does it save?
When does preview update?
When does the tool initialize?

### add-post-tool-components.js 
should own: (things that create or modify content)
markers
text style presets
inline wrapping
content component buttons
box builder
box presets
insertGeneratedCode()
insertHtmlInsideSelectedElement()
getSuggestedChildClass()
color picker helpers for builder inputs

answers:
How do I add something to the post?
How do I create boxes, paragraphs, headings, markers?


### add-post-tool-inspector.js
should own: (things related to selecting and editing existing elements)
selectPreviewElement()
deselectPreviewElement()
bindPreviewSelection()
DOM lineage
DOM tree
Flexible CSS Editor
CSS block lookup/replacement
selected element display
grid toggle maybe

answers:
What element is selected?
What CSS belongs to it?
How do I inspect/edit the selected element?



# CURRENTLY 
Phase 1:
Create empty sibling files.
Load them before add-post-tool.js.
Confirm nothing breaks.

Phase 2:
Move inspector functions only.
Expose them on window.PostToolInspector.
Update add-post-tool.js calls.

Phase 3:
Test selection, deselect, DOM tree, Flexible CSS.

Phase 4:
Move component functions.
Expose them on window.PostToolComponents.

Phase 5:
Test markers, box builder, paragraph/heading/list insertion.

Phase 6:
Only then clean up old comments/sections.