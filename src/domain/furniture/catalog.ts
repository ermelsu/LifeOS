/**
 * Catálogo de móveis — recortes do `interiors.png` (Modern Interiors, LimeZu). Cada peça é
 * definida por sua posição no sheet (col/row, em tiles de 16px) e seu tamanho em tiles.
 * `flat` marca peças no nível do chão (tapetes) que devem ficar sob os demais móveis.
 */

export const INTERIORS_W = 256;
export const INTERIORS_H = 1424;
export const ART_TILE = 16;

export interface FurnitureDef {
  kind: string;
  label: string;
  col: number;
  row: number;
  w: number;
  h: number;
  flat?: boolean;
}

export const FURNITURE: FurnitureDef[] = [
  { kind: 'sofa', label: 'Sofá', col: 7, row: 13, w: 3, h: 2 },
  { kind: 'cama', label: 'Cama', col: 8, row: 18, w: 2, h: 2 },
  { kind: 'tapete', label: 'Tapete', col: 7, row: 15, w: 4, h: 3, flat: true },
  { kind: 'estante', label: 'Estante', col: 5, row: 14, w: 2, h: 3 },
  { kind: 'armario', label: 'Guarda-roupa', col: 8, row: 48, w: 2, h: 3 },
  { kind: 'comoda', label: 'Cômoda', col: 0, row: 59, w: 3, h: 2 },
  { kind: 'cadeira', label: 'Cadeira', col: 6, row: 21, w: 1, h: 2 },
  { kind: 'banco', label: 'Banquinho', col: 6, row: 13, w: 1, h: 1 },
  { kind: 'vaso', label: 'Planta', col: 10, row: 44, w: 1, h: 2 },
  { kind: 'cacto', label: 'Cacto', col: 0, row: 49, w: 1, h: 2 },
  { kind: 'luminaria', label: 'Luminária', col: 13, row: 53, w: 1, h: 2 },
];

export const FURNITURE_BY_KIND: Record<string, FurnitureDef> = Object.fromEntries(
  FURNITURE.map((f) => [f.kind, f]),
);
