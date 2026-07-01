# Referência estética — o "clima" visual do LifeOS

> Entrada do projeto (seções 5 e 13). Define o **alvo visual**. Enviada pelo Emerson em
> 2026-07-01. _TODO: commitar a imagem em `docs/referencias/estetica-stardew.png`._

## Origem

Captura de uma casa totalmente decorada no estilo **Stardew Valley** (visão de cima, pixel
art). É a referência de **como o jogo deve se parecer**.

## O que tirar dessa referência

- **Câmera top-down** levemente inclinada; tiles de ~16px em pixel art.
- **Paredes de madeira** com contorno/realce (borda alaranjada), separando cômodos.
- **Pisos ladrilhados com padrões** distintos por cômodo (tábuas, ladrilho, tapetes, grama
  interna) — cada ambiente tem sua "cara".
- **Cômodos ligados por portas e corredores estreitos** — reforça a ideia de construir
  cômodo a cômodo e caminhar entre eles.
- **Muita decoração e mobília**: lareiras acesas, estantes, aquários, sofás, camas, mesas,
  plantas, tapetes. No LifeOS cada objeto desses corresponde a algo real (Regra Nº 1) e pode
  virar tarefa/estado.
- **Iluminação quente** e aconchegante; fontes de luz (lareira, luminárias, janelas).

## Restrição importante (decisão travada nº 9)

Inspiração no **estilo/gênero**, mas com **assets ORIGINAIS**. **Não** copiar tiles, sprites
ou arte do Stardew Valley (direitos autorais e identidade própria). A referência é o "clima",
não material a ser reutilizado.

## Como isso guia a implementação

- **Placeholders primeiro, arte depois** (seção 12). A estrutura (cômodos, paredes, portas,
  caminhada, estados) é construída com retângulos/tiles simples; a troca por arte pixel
  original é feita depois, sem reescrever a lógica.
- O **construtor de casa** deve, com o tempo, permitir: desenhar cômodos, escolher o tipo de
  piso, posicionar portas e colocar móveis/objetos (que são a base das tarefas).
- A camada de **iluminação em tempo real** (já iniciada) evolui para luzes locais (lareira,
  luminárias) além do overlay global por hora do dia.
