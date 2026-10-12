# Intake Integrity — Unified Design System v2

## Direction
Neutral, Apple-inspired interface. Prioritize readable typography, calm hierarchy, few actions, and a clear next step. Avoid decorative outlines, colorful badges, excessive instructional copy and ornamental animation.

## Foundations
- Background: `#f5f5f7`
- Primary surface: `#ffffff`
- Primary text: `#1d1d1f`
- Secondary text: `#6e6e73`
- Subtle separators (only where needed): `#e8e8ed`
- Secondary surface: `#ededf0`
- Success: `#267b51`
- Primary button: dark graphite `#1d1d1f`
- Typography: `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`
- Large surface radius: 20px; small interactive controls: 12px.
- Surfaces are differentiated by tone and spacing, not visible borders.

## Interaction rules
1. Present a single dominant next action per state.
2. Secondary actions remain available but visually subordinate.
3. Avoid instructions when the interface can convey intent through labels and context.
4. Show the actual CRM outcome; keep technical logs separate from the primary task.
5. Do not imply production integrations or persisted data in the synthetic sandbox.
6. Keyboard focus remains visible; motion respects reduced-motion preferences.

## Current implementation
Both `index.html` and `decision-lab.html` now apply the neutral visual direction. They retain separate inline CSS, so token extraction and component consolidation remain outstanding. No claim of completed cross-device browser QA.
