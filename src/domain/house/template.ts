import { type HouseModel, addRoom, addFurniture, createEmptyHouse } from './model.ts';

/**
 * Casa de EXEMPLO com que o LifeOS começa — fiel às adjacências reais documentadas em
 * `docs/referencias/planta-casa.md` (Sala como hub/entrada; Corredor e áreas dos cães
 * caminháveis). O Emerson começa a partir daqui e edita no construtor, ou limpa tudo e monta
 * do zero.
 *
 * Diferente da planta antiga, os cômodos aqui se ENCOSTAM (compartilham borda) para ficarem
 * conectados por passagens abertas — não há portas neste modelo.
 */
export function templateHouse(): HouseModel {
  let h = createEmptyHouse('Minha casa');
  // Ordem importa: cômodos desenhados depois ficam por cima (sub-cômodos por último).
  h = addRoom(h, { x: 6, y: 2, w: 21, h: 3 }, { nome: 'Corredor', lifeArea: 'circulacao', floorType: 'wood' });
  h = addRoom(h, { x: 27, y: 2, w: 14, h: 13 }, { nome: 'Sala', lifeArea: 'conforto', floorType: 'parquet' });
  h = addRoom(h, { x: 6, y: 5, w: 9, h: 8 }, { nome: 'Escritório', lifeArea: 'trabalho', floorType: 'wood' });
  h = addRoom(h, { x: 15, y: 5, w: 11, h: 8 }, { nome: 'Quarto', lifeArea: 'descanso', floorType: 'carpet' });
  h = addRoom(h, { x: 22, y: 5, w: 4, h: 3 }, { nome: 'Banheiro', lifeArea: 'higiene', floorType: 'tile' });
  h = addRoom(h, { x: 27, y: 15, w: 14, h: 8 }, { nome: 'Cozinha', lifeArea: 'alimentacao', floorType: 'brick' });
  h = addRoom(h, { x: 6, y: 23, w: 17, h: 8 }, { nome: 'Cachorros — Grade', lifeArea: 'caes', floorType: 'grass' });
  h = addRoom(h, { x: 23, y: 23, w: 18, h: 8 }, { nome: 'Cachorros — Jardim', lifeArea: 'caes', floorType: 'grass' });
  h = addRoom(h, { x: 37, y: 23, w: 4, h: 3 }, { nome: 'Deck / Lavanderia', lifeArea: 'roupas', floorType: 'deck' });

  // Alguns móveis de exemplo para a casa não nascer vazia.
  h = addFurniture(h, 'tapete', 31, 8);
  h = addFurniture(h, 'sofa', 32, 5);
  h = addFurniture(h, 'estante', 38, 3);
  h = addFurniture(h, 'cama', 16, 7);
  h = addFurniture(h, 'armario', 23, 6);
  return h;
}
