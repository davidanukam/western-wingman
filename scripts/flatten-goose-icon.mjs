/**
 * Flattens public/goose-map-icon.svg by inlining <symbol> (fixes blank canvas/img rendering).
 * Run: node scripts/flatten-goose-icon.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const svgPath = resolve(process.cwd(), "public/goose-map-icon.svg");
const svg = readFileSync(svgPath, "utf8");

const symbolMatch = svg.match(/<symbol id="D"[^>]*>([\s\S]*?)<\/symbol>/);
if (!symbolMatch) {
  console.error("Could not find symbol#D in goose-map-icon.svg");
  process.exit(1);
}

const symbolInner = symbolMatch[1];
const defsMatch = svg.match(/<defs>[\s\S]*?<\/defs>/);
const defs = defsMatch ? defsMatch[0] : "";

const flattened = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 61 76" fill="#fff" fill-rule="evenodd" stroke="#000" stroke-linecap="round" stroke-linejoin="round">${defs}<g transform="translate(0.5, 0.5)">${symbolInner}</g></svg>`;

writeFileSync(svgPath, flattened, "utf8");
console.log("Flattened", svgPath);
