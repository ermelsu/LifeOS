# Assets — Modern Interiors (LimeZu), versão FREE v2.2

Arte pixel usada no LifeOS. Fonte: https://limezu.itch.io/moderninteriors

## Licença (ver `LICENSE.txt`)
**Versão gratuita → uso NÃO COMERCIAL.** Pode usar/editar em projeto pessoal; não pode usar em
projeto comercial nem revender. Crédito ao LimeZu em `CREDITS.md`. Se o LifeOS virar algo público/
comercial, comprar a versão paga (barata) libera o uso comercial.

## Estrutura (só o 16×16 nativo; as versões 32/48 e as pastas antigas foram descartadas)
- `tiles/room_builder.png` — pisos, paredes, janelas, portas (para montar os cômodos). 272×368.
- `tiles/interiors.png` — móveis e objetos (sofá, cama, cozinha, estantes, plantas…). 256×1424.
- `characters/<nome>.png` — folha completa do personagem (andar/correr/parado/sentar, 4 direções).
  Frame de **16×32**. Personagens: adam, alex, amelia, bob.
- `characters/<nome>_idle.png` e `_run.png` — animações isoladas (idle/corrida), frame 16×32.
- `overview.png` — visão geral de tudo que o pack contém (referência).

Servido pelo Vite em `/<base>/assets/moderninteriors/...`. **Não redistribuir como pacote de assets.**
