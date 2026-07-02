import { type HouseModel, addRoom, addFurniture, addWallItem, createEmptyHouse } from './model.ts';

/**
 * Casa de EXEMPLO. Cada cômodo é um retângulo cujo anel externo é PAREDE e o interior é piso.
 * Cômodos vizinhos compartilham uma linha/coluna de parede e são ligados por uma PORTA nela.
 * Há também algumas JANELAS nas paredes externas. O Emerson edita ou refaz no construtor.
 */
export function templateHouse(): HouseModel {
  let h = createEmptyHouse('Minha casa');

  h = addRoom(h, { x: 22, y: 4, w: 16, h: 12 }, { nome: 'Sala', lifeArea: 'conforto', floorType: 'parquet' });
  h = addRoom(h, { x: 22, y: 15, w: 16, h: 8 }, { nome: 'Cozinha', lifeArea: 'alimentacao', floorType: 'brick' });
  h = addRoom(h, { x: 6, y: 4, w: 17, h: 4 }, { nome: 'Corredor', lifeArea: 'circulacao', floorType: 'wood' });
  h = addRoom(h, { x: 6, y: 7, w: 12, h: 9 }, { nome: 'Quarto', lifeArea: 'descanso', floorType: 'carpet' });
  h = addRoom(h, { x: 17, y: 7, w: 6, h: 9 }, { nome: 'Escritório', lifeArea: 'trabalho', floorType: 'wood' });
  h = addRoom(h, { x: 22, y: 22, w: 16, h: 8 }, { nome: 'Cachorros — Jardim', lifeArea: 'caes', floorType: 'grass' });
  h = addRoom(h, { x: 6, y: 22, w: 17, h: 8 }, { nome: 'Cachorros — Grade', lifeArea: 'caes', floorType: 'grass' });

  // Portas (em paredes compartilhadas) conectando os cômodos.
  h = addWallItem(h, 'door', 22, 5); // Corredor ↔ Sala
  h = addWallItem(h, 'door', 11, 7); // Corredor ↔ Quarto
  h = addWallItem(h, 'door', 17, 10); // Quarto ↔ Escritório
  h = addWallItem(h, 'door', 22, 11); // Escritório ↔ Sala
  h = addWallItem(h, 'door', 29, 15); // Sala ↔ Cozinha
  h = addWallItem(h, 'door', 29, 22); // Cozinha ↔ Jardim
  h = addWallItem(h, 'door', 22, 25); // Jardim ↔ Grade

  // Janelas nas paredes externas.
  h = addWallItem(h, 'window', 28, 4);
  h = addWallItem(h, 'window', 32, 4);
  h = addWallItem(h, 'window', 37, 9);
  h = addWallItem(h, 'window', 6, 10);

  // Móveis de exemplo (no interior dos cômodos).
  h = addFurniture(h, 'tapete', 25, 9);
  h = addFurniture(h, 'sofa', 26, 6);
  h = addFurniture(h, 'estante', 34, 5);
  h = addFurniture(h, 'cama', 9, 10);
  h = addFurniture(h, 'armario', 13, 9);
  return h;
}
