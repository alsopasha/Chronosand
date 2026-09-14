# Chronosand

Chronosand writes the current time as a sentence and renders those words as shallow water over sand. The clock is generated in Canvas 2D, then used as height data by a full screen WebGL shader.

[kivilcimlab.org/chronosand](https://kivilcimlab.org/chronosand)

## From time to texture

Hours are written from one to twelve. Minutes below ten use the form `oh one`; later values are assembled from their tens and units. The result changes once per minute and ends with `a.m.` or `p.m.`.

The Sarina lettering is first rasterised at full opacity on a separate canvas. Three blurred copies are then added to the clock canvas at different widths with `lighter` blending, producing a smooth height field without repeatedly painting the original letter shapes.

The canvas becomes the `u_heightMap` texture. It is uploaded again only when the wording or viewport changes, while the shader continues to animate every frame.

## Material and lighting

The fragment shader derives a water normal from neighbouring samples of the text height. A separate sand field combines hash noise with a slow sine ripple, and its normal is calculated independently.

Sand uses diffuse lighting. The water receives two specular highlights, slight refraction, and animated caustics. The caustic channels are sampled at small offsets to introduce restrained colour separation, then a vignette darkens the edge of the frame.

Hiding the time does not replace the texture. It eases the height contribution towards zero, allowing the sand and lighting to remain continuous.

## Implementation

Three.js renders one full screen plane with a custom vertex and fragment shader. Canvas 2D provides the dynamic texture. The only external visual asset is the Sarina typeface from Google Fonts.
