# Stitching measurement diagram

Drop the labeled kameez + shalwar reference image here as **`measure-guide.png`**, then
wire it up in `src/features/stitching/diagramAsset.ts`:

```ts
import measureGuide from '@/assets/stitching/measure-guide.png';
export const DIAGRAM_IMAGE: string | null = measureGuide;
```

Until the file is added, `MeasurementDiagram` renders a built-in schematic fallback so the
app keeps building. The focus → highlight overlay behaves identically either way, positioned
via the normalized `DIAGRAM_HOTSPOTS` in `src/features/stitching/measurements.ts`.

The hotspot coordinates were estimated for an image with ~1.79:1 aspect ratio (the shared
reference). If your PNG has a very different layout, tweak `DIAGRAM_HOTSPOTS`.
