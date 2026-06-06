// Reference measurement diagram (the labeled kameez + shalwar image).
//
// To use the real artwork: drop the PNG you have at
//   mobile-app/assets/stitching/measure-guide.png
// then replace the body of this file with:
//   export const DIAGRAM_IMAGE = require('../../../assets/stitching/measure-guide.png');
//
// Until then, MeasurementDiagram renders a built-in schematic fallback so the
// app keeps building. The highlight-overlay behaviour is identical either way.
//
// (require() resolves to an asset id `number`; null = use the schematic.)
export const DIAGRAM_IMAGE: number | null = null;
