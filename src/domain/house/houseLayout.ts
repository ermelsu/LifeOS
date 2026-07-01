import { type HouseLayout, type Room, rectContains } from './types.ts';

/**
 * Planta placeholder do LifeOS, fiel às ADJACÊNCIAS REAIS documentadas em
 * `docs/referencias/planta-casa.md` (não à geografia exata — a arte final virá do mapa do
 * robô aspirador). A Sala é o hub central e a entrada.
 *
 * Grafo de circulação:
 *   Sala (entrada/hub)
 *    ├── Corredor ── Quarto (suíte: Banheiro dentro)
 *    │            └─ Escritório
 *    └── Cozinha ── Jardim ── Grade
 *
 * O "Quarto da bagunça da mudança" fica FORA do mapa caminhável — vira só uma atividade
 * pendente exposta no Corredor.
 */

const TILE = 32;

// Cores placeholder por cômodo (trocáveis por tiles de arte no futuro).
const COR = {
  sala: 0x3c5a4a,
  corredor: 0x4a4a3c,
  quarto: 0x3a4a5c,
  banheiro: 0x2f5560,
  escritorio: 0x4a3a5c,
  cozinha: 0x5c4a3a,
  grade: 0x3a5c3a,
  jardim: 0x2f6b3a,
} as const;

const rooms: Room[] = [
  {
    id: 'sala',
    nome: 'Sala',
    lifeArea: 'conforto',
    floor: { x: 27, y: 2, w: 14, h: 13 },
    color: COR.sala,
    activity: { tile: { x: 30, y: 6 }, labels: ['Lazer (TV / videogame)', 'Descansar (sofá)'] },
  },
  {
    id: 'corredor',
    nome: 'Corredor',
    lifeArea: 'circulacao',
    floor: { x: 6, y: 2, w: 20, h: 3 },
    color: COR.corredor,
    // O "quarto da bagunça da mudança" não é caminhável: só a ação, exposta aqui.
    activity: { tile: { x: 23, y: 3 }, labels: ['Ajeitar quarto da bagunça da mudança'] },
  },
  {
    id: 'escritorio',
    nome: 'Escritório',
    lifeArea: 'trabalho',
    floor: { x: 6, y: 6, w: 9, h: 8 },
    color: COR.escritorio,
    activity: {
      tile: { x: 10, y: 10 },
      labels: ['Ajeitar guarda-roupa', 'Trabalhar / editar vídeo (computador)'],
    },
  },
  {
    id: 'quarto',
    nome: 'Quarto',
    lifeArea: 'descanso',
    floor: { x: 16, y: 6, w: 10, h: 8 },
    color: COR.quarto,
    subareas: [{ nome: 'Banheiro (suíte)', rect: { x: 22, y: 6, w: 4, h: 3 }, color: COR.banheiro }],
    activity: { tile: { x: 18, y: 11 }, labels: ['Arrumar cama', 'Higiene (banheiro / suíte)'] },
  },
  {
    id: 'cozinha',
    nome: 'Cozinha',
    lifeArea: 'alimentacao',
    floor: { x: 27, y: 16, w: 14, h: 7 },
    color: COR.cozinha,
    activity: {
      tile: { x: 33, y: 19 },
      labels: ['Lavar louça (pia)', 'Preparar refeição (fogão)', 'Guardar compras (geladeira)'],
    },
  },
  {
    id: 'grade',
    nome: 'Cachorros — Grade',
    lifeArea: 'caes',
    floor: { x: 6, y: 25, w: 16, h: 7 },
    color: COR.grade,
    activity: { tile: { x: 13, y: 28 }, labels: ['Cuidar dos cães da grade (5)'] },
  },
  {
    id: 'jardim',
    nome: 'Cachorros — Jardim',
    lifeArea: 'caes',
    floor: { x: 23, y: 25, w: 18, h: 7 },
    color: COR.jardim,
    subareas: [
      { nome: 'Deck / Lavanderia', rect: { x: 37, y: 25, w: 4, h: 3 }, color: 0x3a5c5c },
    ],
    activity: {
      tile: { x: 30, y: 28 },
      labels: ['Cuidar dos cães do jardim (9 maiores + 5 chihuahuas)', 'Lavar roupa (deck)'],
    },
  },
];

export const houseLayout: HouseLayout = {
  larguraTiles: 42,
  alturaTiles: 34,
  tileSize: TILE,
  spawn: { x: 33, y: 8 }, // no meio da Sala (a entrada)
  rooms,
  doors: [
    { id: 'sala-corredor', entre: ['sala', 'corredor'], tile: { x: 26, y: 3 }, orientacao: 'v' },
    { id: 'corredor-escritorio', entre: ['corredor', 'escritorio'], tile: { x: 9, y: 5 }, orientacao: 'h' },
    { id: 'corredor-quarto', entre: ['corredor', 'quarto'], tile: { x: 20, y: 5 }, orientacao: 'h' },
    { id: 'sala-cozinha', entre: ['sala', 'cozinha'], tile: { x: 33, y: 15 }, orientacao: 'h' },
    { id: 'cozinha-jardim', entre: ['cozinha', 'jardim'], tile: { x: 33, y: 24 }, orientacao: 'h' },
    { id: 'jardim-grade', entre: ['jardim', 'grade'], tile: { x: 22, y: 28 }, orientacao: 'v' },
  ],
};

/** Qual cômodo contém o tile (x,y), se algum. */
export function roomAt(layout: HouseLayout, tileX: number, tileY: number): Room | null {
  for (const room of layout.rooms) {
    if (rectContains(room.floor, tileX, tileY)) return room;
  }
  return null;
}
