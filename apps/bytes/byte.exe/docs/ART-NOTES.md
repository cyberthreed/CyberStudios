# Byte art notes

The cat art was made with the built-in image-generation tool using the two user-supplied screenshots. The user approved this appearance on November 4, 2026. Version 0.3.0 keeps the approved sprite PNG unchanged, removes the reference footnote from the app, and records approval in the sprite manifest. The original prompts below are retained as the creation record.

Project asset: `src/assets/byte-reference-v2.png` (RGBA PNG, 1024 × 1536, four columns and six rows of 256 × 256 cells). The loader uses the same atlas for the room and the transparent desktop overlay. It includes idle, walk, sleep, pet, feed, and play states. The original procedural placeholder remains available in the source as an optional fallback.

The room interface is built in HTML/CSS and real controls; the supplied screenshots are not embedded as UI backgrounds. The shipped app does not call an image-generation service or any remote service.

## Generation prompt

Use case: stylized-concept. Asset type: production transparent animation sprite atlas for the Byte Windows desktop cat companion.
Input image 1 (desktop UI screenshot) and image 2 (mobile UI screenshot) are visual references, especially the SAME cat character appearing in both. They are not edit targets. Generate only the cat sprites; do not reproduce any UI, room, lettering, cards, grid floor, or background.
Match the reference cat closely: cute small dark midnight-purple chibi kitten, very large pointed ears with lavender-pink inner ears, vivid glowing cyan eyes, tiny muzzle, pale four-point star marking on the forehead, luminous cyan/lavender star charm on the chest, fluffy little cheeks, curled tail with a lavender tip, compact seated body and tiny paws. Hand-drawn detailed pixel art with dark slightly irregular outlines, purple highlights, crisp pixel clusters, nostalgic dreamy virtual-pet style. Keep the reference proportions, identity, markings and color palette constant across all frames. This should be substantially richer than a blocky geometric placeholder.
Deliver a SINGLE regular sprite atlas EXACTLY 4 columns by 6 rows, 24 equally-sized square cells. Canvas aspect 2:3, ideally 1024x1536 pixels with 256x256 cells. Every cat is fully contained inside its own cell, has generous transparent padding, approximately 190px tall when sitting, and paws aligned to the same baseline near y=228 within its cell. No overlaps between cells. No grid lines, cell numbers, labels, text, checkerboard, decorative background, or cast shadows. Actual alpha transparency throughout empty space. Cat faces three-quarters RIGHT consistently, tail on the left as in the reference.
Row 1: four subtle sitting idle loop frames: eyes open, blink half closed, eyes closed, eyes open with tail-tip curl.
Row 2: four small walking-cycle frames, same character body/head scale, different alternating leg positions, tail sways.
Row 3: four curled-up sleeping frames: closed eyes, tiny breathing changes, forehead star/chest charm still recognizable.
Row 4: four being-petted happy seated frames: closed happy eyes and a tiny pink heart above head; same character silhouette.
Row 5: four feeding frames: seated cat nibbling a tiny lavender bowl; same character.
Row 6: four playful paw-up frames: cat reaching toward a small cyan sparkle; same character.
All six rows must contain exactly four distinct sprites in a strict, evenly-spaced grid. The source screenshot cat is the identity and style reference. No additional characters.

## Transparency cleanup prompt

Use case: background-extraction. Edit target: the provided 1024x1536 RGBA cat sprite atlas. Remove ONLY the purple gradient/haze/halo in the space between and around all sprites so that every background pixel becomes truly fully transparent (alpha 0), with a clean cutout around each character and its heart/bowl/sparkle. There must be NO shaded rectangular background and NO gradient around the subjects. Preserve exactly the 4-column by 6-row grid, canvas dimensions, all 24 cat poses, their positions, scale, details, cyan eyes and star charms, bowls/hearts/sparkles, and crisp pixel edges. Do not repaint or redesign the sprites. Keep all character pixels and subtle translucent cyan glow inside the eye/star features. Make the empty background actual transparent alpha, not checkerboard, black, white or purple.
