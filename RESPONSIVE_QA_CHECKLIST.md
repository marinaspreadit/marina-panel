# Marina Panel — Mobile QA checklist

Target: phone viewport ~375×812 (iPhone 12/13) + one small Android (~360×740)

## Global
- [ ] No horizontal scroll at any page
- [ ] Text readable (no tiny font), tap targets >= ~40px
- [ ] Header/topbar stays usable (no overlap)
- [ ] Mobile menu opens/closes reliably
- [ ] Page content has breathing room (no cramped padding)

## Navigation (MobileNav)
- [ ] Hamburger visible on all pages
- [ ] Open menu → overlay blocks background scroll
- [ ] Tap outside menu closes
- [ ] Route change closes menu

## Home (/)
- [ ] Top CTAs stack on mobile (full width)
- [ ] Stats cards wrap nicely (no overflow)
- [ ] “Now (In Progress)” list items are tappable and not cramped

## Tasks (/tasks)
- [ ] Create form stacks correctly (inputs + Create button)
- [ ] Columns render as cards list without huge empty space
- [ ] Each task card: title wraps + Open button easy to tap

## Task detail (/tasks/[id])
- [ ] Main actions reachable without precision taps
- [ ] Notes/editor usable on mobile (no tiny textarea)

## Jobs (/jobs)
- [ ] Job cards readable; timestamps wrap
- [ ] payloadJson box wraps long text
- [ ] Artifact buttons: full-width on mobile; open in new tab works

## Scraper (/scraper)
- [ ] Run form stacks; RUN button full-width
- [ ] Recent runs: download buttons full-width; logs readable

## Login (/login)
- [ ] Form centered and usable on mobile

## Quick regression
- [ ] Build passes (next build)
- [ ] No console errors in browser
