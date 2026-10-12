# Intake Integrity — Design system v1

## Design intent
Editorial product storytelling, with a restrained, tactile, architectural interface. The product itself should be legible and calm; motion must explain decisions rather than distract from them.

## Foundations
| Token | Value | Usage |
|---|---|---|
| Paper | `#f5f4f0` | Primary page background |
| Ink | `#222725` | Primary text and CTA |
| Muted | `#626b65` | Supporting copy |
| Line | `#d9ddd6` | Dividers and boundaries |
| Violet | `#8469c9` | Decision emphasis |
| Violet light | `#ede8fb` | Highlighted checkpoint |
| Surface | `#ffffff` | Cards and interface |
| Night | `#202924` | Mechanism section |
| Radius | `18px` | Large surfaces |
| Horizontal gutter | `clamp(22px, 5vw, 88px)` | Site margins |

## Typography
System sans stack: Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI. Display headings: bold editorial typography, negative letter spacing, responsive `clamp()`. Supporting text: 1.5–1.7 line height.

## Interaction
- No false affordances: every button must perform an action.
- Identity uncertainty must remain explicit; no automatic ambiguous write.
- Reduced-motion users receive a non-animated experience.
- Focus-visible outlines are mandatory.
- Synthetic data must always be labeled.

## Current implementation
The homepage applies the above tokens in its inline CSS. Decision Lab is a separate prototype and has not yet been fully unified with this design system. Visual and functional QA are outstanding.

## Next
Extract shared CSS, harmonize Decision Lab typography/spacing/components, and test across breakpoints before declaring a stable v1.
