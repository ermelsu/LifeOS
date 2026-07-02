import Phaser from 'phaser';
import { type FloorType } from '@domain/house/types.ts';

/**
 * Texturas de placeholder geradas em runtime (arte ORIGINAL — decisão travada nº 9: nada é
 * copiado do Stardew). São tiles pixel-art simples de 32px que dão o "clima" da referência
 * estética (`docs/referencias/estetica.md`): pisos ladrilhados por cômodo, paredes de madeira
 * com trilho alaranjado no topo e luzes quentes. Quando a arte definitiva chegar, basta trocar
 * estas chaves — a lógica não muda.
 */

const TILE = 32;

/** PRNG determinístico (mulberry32) — mesma textura a cada execução. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Clareia/escurece uma cor 0xRRGGBB por um fator (>1 clareia, <1 escurece). */
function shade(color: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.round(((color >> 16) & 0xff) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((color >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((color & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}

type PixelFn = (g: Phaser.GameObjects.Graphics, x: number, y: number) => void;

function makeTexture(scene: Phaser.Scene, key: string, draw: PixelFn): void {
  if (scene.textures.exists(key)) return;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) draw(g, x, y);
  }
  g.generateTexture(key, TILE, TILE);
  g.destroy();
}

function put(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, alpha = 1): void {
  g.fillStyle(color, alpha);
  g.fillRect(x, y, 1, 1);
}

/** Chave de textura para um tipo de piso. */
export function floorKey(type: FloorType): string {
  return `ft-${type}`;
}

export function createTileTextures(scene: Phaser.Scene): void {
  // --- Pisos ---
  // Madeira: tábuas horizontais com veios e juntas escuras.
  makeTexture(scene, floorKey('wood'), (g, x, y) => {
    const r = rng(x * 71 + y * 13);
    const base = 0x8a5a34;
    let c = shade(base, 0.9 + r() * 0.18);
    if (y % 8 === 0) c = shade(base, 0.62); // junta entre tábuas
    if ((x + (Math.floor(y / 8) % 2) * 16) % 16 === 0) c = shade(base, 0.7); // seam vertical alternada
    put(g, x, y, c);
  });

  // Parquet: blocos 8x8 em dois tons, xadrez — piso "nobre" da sala.
  makeTexture(scene, floorKey('parquet'), (g, x, y) => {
    const r = rng(x * 17 + y * 91);
    const block = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
    const base = block ? 0xb07a3f : 0x9c6a35;
    let c = shade(base, 0.92 + r() * 0.14);
    if (x % 8 === 0 || y % 8 === 0) c = shade(base, 0.68);
    put(g, x, y, c);
  });

  // Tijolo: cozinha, fiadas deslocadas.
  makeTexture(scene, floorKey('brick'), (g, x, y) => {
    const r = rng(x * 29 + y * 53);
    const row = Math.floor(y / 8);
    const offset = (row % 2) * 8;
    const mortar = y % 8 === 0 || (x + offset) % 16 === 0;
    const c = mortar ? 0x6b4430 : shade(0xa15a3c, 0.9 + r() * 0.18);
    put(g, x, y, c);
  });

  // Carpete: rosado macio com ruído fino e borda suave.
  makeTexture(scene, floorKey('carpet'), (g, x, y) => {
    const r = rng(x * 37 + y * 101);
    const edge = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
    const c = edge ? shade(0xa85f68, 0.8) : shade(0xb56a73, 0.94 + r() * 0.12);
    put(g, x, y, c);
  });

  // Ladrilho cerâmico: banheiro, xadrez claro com rejunte.
  makeTexture(scene, floorKey('tile'), (g, x, y) => {
    const check = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
    const grout = x % 8 === 0 || y % 8 === 0;
    const c = grout ? 0x8f9aa0 : check ? 0xcdbf9a : 0xb9a87e;
    put(g, x, y, c);
  });

  // Grama: áreas externas dos cães, com manchas de terra.
  makeTexture(scene, floorKey('grass'), (g, x, y) => {
    const r = rng(x * 19 + y * 47);
    const n = r();
    let c = shade(0x4f8a3f, 0.82 + n * 0.32);
    if (r() > 0.94) c = 0x7a5a33; // pontinho de terra
    put(g, x, y, c);
  });

  // Deck: tábuas cinza-azuladas (lavanderia/deck do jardim).
  makeTexture(scene, floorKey('deck'), (g, x, y) => {
    const r = rng(x * 23 + y * 67);
    let c = shade(0x6f7f86, 0.9 + r() * 0.16);
    if (y % 8 === 0) c = shade(0x6f7f86, 0.68);
    put(g, x, y, c);
  });

  // --- Parede ISOTRÓPICA (tijolos de madeira): tila igual em qualquer direção e emenda nas
  //     quinas sozinha. As fiadas são deslocadas (padrão de tijolo). ---
  makeTexture(scene, 'wall', (g, x, y) => {
    const r = rng(x * 13 + y * 31);
    const course = Math.floor(y / 8);
    const offset = (course % 2) * 8; // desloca fiadas alternadas
    const mortar = y % 8 === 0 || (x + offset) % 16 === 0;
    let c: number;
    if (mortar) c = 0x33241a; // junta escura
    else if (y % 8 === 1) c = shade(0x6e4d30, 1.02); // brilho sob a junta
    else c = shade(0x5f4229, 0.9 + r() * 0.16); // corpo do tijolo
    put(g, x, y, c);
  });

  // --- Porta (folha de madeira) ---
  makeTexture(scene, 'door', (g, x, y) => {
    const border = x === 0 || y === 0 || x === TILE - 1 || y === TILE - 1;
    const panelInset = x >= 5 && x <= TILE - 6 && (y >= 5 && y <= 14 || y >= 17 && y <= 26);
    let c: number;
    if (border) c = 0x3a2312;
    else if (x >= 3 && x <= TILE - 4 && (y === 4 || y === 15 || y === 16 || y === 27)) c = 0x5a3418; // travessas
    else if (panelInset) c = shade(0x8a5a2e, 1.05);
    else c = 0x6e4420;
    if (x >= TILE - 9 && x <= TILE - 7 && y >= 14 && y <= 16) c = 0xe0c070; // maçaneta
    put(g, x, y, c);
  });

  // --- Janela (vidro com moldura) ---
  makeTexture(scene, 'window', (g, x, y) => {
    const frame = x <= 2 || y <= 2 || x >= TILE - 3 || y >= TILE - 3;
    const bar = Math.abs(x - TILE / 2) <= 1 || Math.abs(y - TILE / 2) <= 1;
    let c: number;
    if (frame) c = 0x6e4420;
    else if (bar) c = 0x5a3418;
    else {
      c = 0x9fd6ea; // vidro
      if (x + y < 20) c = 0xd6f0f8; // reflexo
    }
    put(g, x, y, c);
  });

  // --- Brilho quente radial (lareira / luminária) ---
  const glowKey = 'glow';
  if (!scene.textures.exists(glowKey)) {
    const size = 160;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const cx = size / 2;
    for (let i = 24; i >= 0; i--) {
      const radius = (i / 24) * (size / 2);
      const alpha = 0.05 * (1 - i / 24);
      g.fillStyle(0xffcc66, alpha);
      g.fillCircle(cx, cx, radius);
    }
    g.generateTexture(glowKey, size, size);
    g.destroy();
  }
}
