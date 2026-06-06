# Stitching measurement diagram

Drop the labeled kameez + shalwar reference image here as **`measure-guide.png`**, then
wire it up in `mobile-app/src/features/stitching/diagramAsset.ts`:

```ts
export const DIAGRAM_IMAGE = require('../../../assets/stitching/measure-guide.png');
```

Until the file is added, `MeasurementDiagram` renders a built-in schematic fallback so the
app keeps building. The focus → highlight overlay behaves identically either way, positioned
via the normalized `DIAGRAM_HOTSPOTS` in `mobile-app/src/features/stitching/measurements.ts`.
