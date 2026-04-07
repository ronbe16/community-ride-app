/**
 * Generates icon-192.png and icon-512.png for the PWA manifest.
 * Draws the CommunityRide car+heart logo programmatically.
 *
 * Run once: node scripts/generate-icons.mjs
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '..', 'public', 'icons');

mkdirSync(OUTPUT_DIR, { recursive: true });

function drawIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // The SVG design lives in a 680×400 viewBox, car elements centered around x=340, y=230.
  // We scale to fill a square canvas with padding.
  const S = size;

  // --- Background: rounded green square ---
  const r = S * 0.16; // corner radius
  ctx.fillStyle = '#16a34a';
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(S - r, 0);
  ctx.quadraticCurveTo(S, 0, S, r);
  ctx.lineTo(S, S - r);
  ctx.quadraticCurveTo(S, S, S - r, S);
  ctx.lineTo(r, S);
  ctx.quadraticCurveTo(0, S, 0, S - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fill();

  // The car design from the SVG fits in a ~330×125px region (x:175–505, y:168–295).
  // Map that region into the canvas with margin.
  const margin = S * 0.10;
  const drawW = S - margin * 2;
  const drawH = S * 0.55;
  const drawX = margin;
  const drawY = S * 0.18;

  // SVG source region
  const svgX = 172, svgY = 165, svgW = 335, svgH = 135;
  const scaleX = drawW / svgW;
  const scaleY = drawH / svgH;
  const sc = Math.min(scaleX, scaleY);
  const offX = drawX + (drawW - svgW * sc) / 2 - svgX * sc;
  const offY = drawY + (drawH - svgH * sc) / 2 - svgY * sc;

  function tx(x) { return offX + x * sc; }
  function ty(y) { return offY + y * sc; }
  function ts(v) { return v * sc; }

  // --- Car body lower ---
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, tx(175), ty(218), ts(330), ts(55), ts(10));
  ctx.fill();

  // --- Car cabin upper ---
  ctx.fillStyle = '#f0fdf4';
  ctx.beginPath();
  ctx.moveTo(tx(240), ty(218));
  ctx.lineTo(tx(275), ty(168));
  ctx.lineTo(tx(405), ty(168));
  ctx.lineTo(tx(440), ty(218));
  ctx.closePath();
  ctx.fill();

  // --- Windshield front ---
  ctx.fillStyle = '#bbf7d0';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(tx(248), ty(218));
  ctx.lineTo(tx(278), ty(175));
  ctx.lineTo(tx(310), ty(175));
  ctx.lineTo(tx(310), ty(218));
  ctx.closePath();
  ctx.fill();

  // --- Rear window ---
  ctx.beginPath();
  ctx.moveTo(tx(370), ty(175));
  ctx.lineTo(tx(400), ty(175));
  ctx.lineTo(tx(432), ty(218));
  ctx.lineTo(tx(370), ty(218));
  ctx.closePath();
  ctx.fill();

  // --- Side window ---
  roundRect(ctx, tx(314), ty(175), ts(52), ts(40), ts(3));
  ctx.fill();
  ctx.globalAlpha = 1.0;

  // --- Window pillar ---
  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(tx(366), ty(175), ts(5), ts(40));

  // --- Car hood ---
  ctx.fillStyle = '#f0fdf4';
  ctx.beginPath();
  ctx.moveTo(tx(440), ty(218));
  ctx.lineTo(tx(490), ty(210));
  ctx.lineTo(tx(505), ty(230));
  ctx.lineTo(tx(440), ty(235));
  ctx.closePath();
  ctx.fill();

  // --- Car trunk ---
  ctx.beginPath();
  ctx.moveTo(tx(175), ty(218));
  ctx.lineTo(tx(175), ty(235));
  ctx.lineTo(tx(215), ty(240));
  ctx.lineTo(tx(215), ty(218));
  ctx.closePath();
  ctx.fill();

  // --- Front bumper ---
  ctx.fillStyle = '#dcfce7';
  roundRect(ctx, tx(490), ty(228), ts(18), ts(20), ts(4));
  ctx.fill();

  // --- Rear bumper ---
  roundRect(ctx, tx(172), ty(228), ts(18), ts(20), ts(4));
  ctx.fill();

  // --- Headlight ---
  ctx.fillStyle = '#fde68a';
  roundRect(ctx, tx(492), ty(216), ts(12), ts(9), ts(3));
  ctx.fill();

  // --- Tail light ---
  ctx.fillStyle = '#f87171';
  roundRect(ctx, tx(176), ty(216), ts(10), ts(9), ts(3));
  ctx.fill();

  // --- Wheels ---
  function drawWheel(cx, cy) {
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(tx(cx), ty(cy), ts(22), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(tx(cx), ty(cy), ts(11), 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(tx(cx), ty(cy), ts(5), 0, Math.PI * 2);
    ctx.fill();
  }
  drawWheel(255, 273);
  drawWheel(435, 273);

  // --- Heart badge on door ---
  const hx = tx(345), hy = ty(232);
  const hs = ts(11);
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.4);
  ctx.bezierCurveTo(hx, hy - hs * 0.6, hx - hs * 1.2, hy - hs * 0.6, hx - hs * 1.2, hy);
  ctx.bezierCurveTo(hx - hs * 1.2, hy + hs * 0.6, hx, hy + hs * 1.2, hx, hy + hs * 1.5);
  ctx.bezierCurveTo(hx, hy + hs * 1.2, hx + hs * 1.2, hy + hs * 0.6, hx + hs * 1.2, hy);
  ctx.bezierCurveTo(hx + hs * 1.2, hy - hs * 0.6, hx, hy - hs * 0.6, hx, hy + hs * 0.4);
  ctx.closePath();
  ctx.fill();

  // --- "CR" text label at bottom ---
  const fontSize = Math.round(S * 0.13);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('CR', S / 2, S * 0.84);

  return canvas;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

for (const size of [192, 512]) {
  const canvas = drawIcon(size);
  const buffer = canvas.toBuffer('image/png');
  const outPath = join(OUTPUT_DIR, `icon-${size}.png`);
  writeFileSync(outPath, buffer);
  console.log(`✓ Wrote ${outPath} (${buffer.length} bytes)`);
}
