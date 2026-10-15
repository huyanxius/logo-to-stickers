# A prompt with four jobs

Decide the character and plot first. Then write reference roles, stable identity, one scene, and the physical finish. Fill the following fields and remove unused references before calling the image tool.

```text
Make ONE playful die-cut paper sticker: a compact editorial illustration
with a readable situation and a gentle visual joke.

REFERENCE ROLES, matching the actual image order:
Image {number}: the original logo / IP. Keep {recognisable brand traits}.
Image {number}, if supplied: the first sticker of this current series.
Keep its face, proportions, palette, drawing technique and print texture.
Change the pose, composition, action and scene-specific props.
Image {number}, if supplied: a reference for {specific style or paper finish}.
Do not import its unrelated character, colours, subjects or props.

CHARACTER:
{How the actual shapes or product behaviour become a character.}
{Stable silhouette, component count, face, palette and small brand detail.}
{Cut-paper, ink or gouache technique suited to this brand.}

THIS LITTLE STORY:
{Who is doing what.}
{One small unexpected consequence and their reaction.}
{One main prop, expressive posture and a compact overall silhouette.}
Keep the situation readable at small web-display sizes.

PAPER AND OUTPUT:
Matte printed colour, subtle tactile grain, a narrow continuous white
die-cut border around the whole scene, about 1–2% of canvas width.
Flat, front-facing paper sticker with a little cut-edge thickness.
Complete and centred with generous margins.
Requested canvas {width} x {height}, PNG, real transparent alpha outside.
No rectangular card, scenery, tabletop, floor shadow, caption or watermark.
No glossy CGI, puffy rubber or thick toy material.
```

Respect explicit user requests for other materials, backgrounds, or text. For an existing IP, preserve its defining features rather than treating this template as permission to redesign it.

For a series, make the first scene useful as a character anchor. Later scenes should keep the body and face while changing the pose and plot. If a temporary deformation is being copied as identity, explicitly separate the two: “The enlarged eye is a magnifying-glass effect; the character normally has two tiny dot eyes.”

The [historical run records](../examples/prompts.json) preserve the original prompt text. Some inherited ordinal phrases in those records predate the explicit role mapping used here. Check the ordered references instead of blindly copying an image number. Inspect actual saved dimensions; the generator may return a different size from the one requested in the prompt.
