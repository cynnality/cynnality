posts/
    shared/
        visual-builder-core.js

### should own the following:
insertTextAtSelection()
wrapSelection()
cleanClassName()
buildCssBlock()
parseCssBlocks()
extractClassStyles()
updatePreview()

really shouldn't "own" or have anything to do with POSTS or PAGES specifcally
should NOT get the following:

POSTS_DATA
PAGES_DATA
savePost()
updatePreview()
statusMessage
contentInput


# renderer/
= read/display/render posts
posts-renderer.js
should own
loadJson
loadText
renderSimpleMarkdown
renderPostContent

Responsible for:

displaying
loading
rendering
reading

# shared/
= reusable editor/building utilities
visual-builder-core.js
should own
cleanClassName
wrap selected text
insert text into textarea
build CSS blocks
extract marker styles from CSS
apply hex opacity

Responsible for:

building
editing
generating
parsing
transforming


------
------
------

Phase 1
──────────────
Extract existing helper functions
(NO new functionality)

↓

Test

↓

Phase 2
──────────────
Add Post Tool uses VisualBuilder

↓

Test

↓

Phase 3
──────────────
First generated component
(Add Box)

↓

Test

↓

Phase 4
──────────────
Selection / Inspector

↓

Test

------
------
------

                VisualBuilder Core
                        │
        ┌───────────────┴───────────────┐
        │                               │
   Post Visual Editor            Page Visual Editor
        │                               │
        └───────────────┬───────────────┘
                        │
                  Future Template Manager
                        │
                  Future Annotation Layer

check as of: sunday june 14 2026
███████████████████████████░░   90-95%

Foundation
██████████████████████████████  DONE

Shared VisualBuilder
██████████████████████████████  DONE

Selection System
██████████████████████████████  DONE

DOM Inspector
██████████████████████████████  DONE

DOM Tree
██████████████████████████████  DONE

Insertion Target Logic
██████████████████████████████  DONE

Generated Components
████████████████████████████░░  DONE enough for V1

Flexible CSS Editor
██████████████████████████░░░░  ~80%

Annotation Layer
██░░░░░░░░░░░░░░░░░░░░░░░░░░░░  Future