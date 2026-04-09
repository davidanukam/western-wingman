/** Circle layer for high-risk sighting points (red accent) */
export const highRiskCirclePaint = {
  "circle-radius": 10,
  "circle-color": "#dc2626",
  "circle-opacity": 0.85,
  "circle-stroke-width": 2,
  "circle-stroke-color": "#ffffff",
};

export const highRiskCircleFilter: ["==", ["get", string], string] = [
  "==",
  ["get", "riskLevel"],
  "high",
];
