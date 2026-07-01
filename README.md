# LifeOS

> **Gêmeo Digital da Vida.** Um jogo de navegador em pixel art (câmera top-down, no espírito
> de Stardew Valley) que **espelha a realidade** — a casa, a rotina, o estoque, as finanças e
> os cachorros do usuário. Não é fantasia: cada objeto, tarefa e ambiente reflete o estado
> real do mundo físico.

A pergunta que o mundo responde, em silêncio: **"Como está minha vida neste momento?"**

## Regra Nº 1 — O Espelho da Realidade (inviolável)

O jogo **nunca** simula uma realidade fictícia. Ele espelha a realidade. Toda informação
dentro do LifeOS corresponde ao estado real da vida do usuário. Nada acontece sozinho; nada
decai só pelo tempo; o personagem **celebra** ações reais, nunca as executa pelo usuário.

Teste de qualquer feature nova: _"Isso representa algo real da vida do usuário?"_ Se não, não entra.

O documento-mestre completo está em [`docs/DOCUMENTO-MESTRE.md`](docs/DOCUMENTO-MESTRE.md).

## Stack

- **TypeScript** (strict) — segurança de tipos num sistema com muitos dados.
- **Phaser 3** — engine do mundo 2D (tilemaps, sprites, animações, câmera).
- **Vite** — build/dev.
- **Dexie / IndexedDB** — persistência local-first, offline, sem backend.
- **Painéis de dados** em HTML/CSS/DOM por cima do canvas do Phaser.
- **Deploy**: site estático no **GitHub Pages**.

## Arquitetura em camadas

O princípio mais importante: **separar o MODELO DE DOMÍNIO (a fonte da verdade) da
APRESENTAÇÃO (Phaser + HTML)**. O estado da vida vive num domínio independente do Phaser,
testável isolado e persistido no IndexedDB. Phaser e os painéis HTML apenas **leem** e reagem.

```
src/
├── domain/   # entidades e regras da vida — SEM dependência de Phaser (fonte da verdade)
│   ├── clock/    GameClock — relógio do mundo sincronizado ao real
│   ├── house/    planta da casa (cômodos, portas, atividades) como dados puros
│   └── state/    LifeState + LifeStore (estado + notificação de mudanças)
├── data/     # persistência IndexedDB (Dexie): db + LifeStateRepository
├── game/     # Phaser (leem do domínio): HouseScene, Player, world/buildGrid
├── ui/       # painéis HTML/CSS por cima do canvas
├── app/      # composição: main.ts, SaveLoop (salvamento automático)
└── test/     # setup dos testes (fake-indexeddb)
```

## Como rodar

```bash
npm install
npm run dev        # servidor de desenvolvimento (Vite)
npm run build      # typecheck + build de produção (base /LifeOS/)
npm run preview    # serve o build localmente
npm test           # suíte de testes (Vitest)
npm run typecheck  # apenas checagem de tipos
```

O deploy no GitHub Pages é automático via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
a cada push na `main`. Ative **Pages → Source: GitHub Actions** nas configurações do repositório.

## Estado atual — Módulo 0 (Fundação técnica) ✅

Conforme o plano modular (seção 11 do documento-mestre):

- [x] Estrutura em camadas (`domain/`, `data/`, `game/`, `ui/`, `app/`).
- [x] TypeScript strict + Vite + Phaser 3.
- [x] Wrapper de IndexedDB (Dexie) + repositório do estado.
- [x] **Loop de salvamento automático** (debounce + intervalo + ao sair da página).
- [x] Pipeline de deploy no GitHub Pages (base path `/LifeOS/`).
- [x] Cena Phaser mínima que já lê o domínio (fundo acompanha a fase do dia real).
- [x] Testes do domínio e da persistência (round-trip no IndexedDB).

**Pronto quando:** o projeto compila, roda localmente e publica uma página no GitHub Pages. ✔️

## Módulo 1 (esqueleto do mundo caminhável) 🚧

Esqueleto jogável da **casa inteira**, com placeholders (retângulos), para testar o conceito:

- [x] Planta da casa no domínio (`domain/house/`), fiel às adjacências reais — a **Sala é a entrada/hub**.
- [x] Personagem que **caminha** (WASD / setas) com colisão em paredes (física Arcade) e câmera que segue.
- [x] **Portas** entre cômodos que o personagem **abre** (aproxime-se + `E`/Espaço).
- [x] **Atividades pendentes** dentro de cada cômodo (marcadores `!`; `E` mostra a lista).
- [x] **Iluminação em tempo real** pela hora do dia (overlay que muda de amanhecer a noite).
- [x] **Visual no clima da referência** (`docs/referencias/estetica.md`): pisos ladrilhados por
      cômodo (parquet, carpete, ladrilho, tijolo, grama, deck), paredes de madeira com trilho
      alaranjado e luzes quentes — tudo em tiles procedurais originais (nada copiado; decisão nº 9).
- [x] Testes da planta + geração da grade de colisão; smoke test no navegador (Chromium).

Cômodos no mapa: Sala, Corredor, Quarto (com Banheiro suíte), Escritório, Cozinha, e as áreas
dos cães (Grade e Jardim, com o deck/lavanderia). O "quarto da bagunça da mudança" fica fora do
mapa — só a ação de ajeitá-lo, exposta no Corredor.

## Construtor de casa ✅

A planta deixou de ser fixa: agora o Emerson **constrói a própria casa** e ela é salva no IndexedDB.

- [x] Modelo editável (`domain/house/model.ts`): `HouseModel` + cômodos, dentro do `LifeState` (v2 com migração).
- [x] Dois modos, alternados por uma barra: **🔨 Construir** e **🎮 Jogar**.
- [x] Editor (`ui/builder/HouseBuilder.ts`): arrastar cria cômodo; clicar seleciona; arrastar move;
      painel edita nome / área da vida / tipo de piso; excluir; "Restaurar exemplo" / "Limpar tudo".
- [x] O modo Jogar relê a casa construída (a `HouseScene` reinicia lendo o `LifeStore`).
- [x] Casa de exemplo (`template.ts`) fiel às adjacências reais; Corredor e áreas dos cães caminháveis.
- [x] Testes do modelo + grade; smoke test no navegador (desenhar cômodo → jogar).

### Fluxo do jogo (a construir — spec do Emerson)

Abrir → intro → **Novo jogo** → **editar personagem** (1 personagem só) → **criar a 1ª casa**
(pode ter mais de uma) → **Jogar**. Ver [`docs/fluxo-do-jogo.md`](docs/fluxo-do-jogo.md).

### Próximos passos

1. **Fluxo/onboarding**: menu inicial, criação de personagem, e suporte a **várias casas / 1 personagem**.
2. Móveis/objetos no construtor (viram tarefas — Regra Nº 1) e sprite animado do personagem.
3. **Módulo 2** — objetos e estados (flagship: a Pia com 4 estados).
4. **Módulo 3** — rotina e tarefas ("missões") reais.

## Referências reais (entradas do projeto)

Layout e adjacências reais da casa em [`docs/referencias/planta-casa.md`](docs/referencias/planta-casa.md).

## Idioma

UI, textos e domínio em **português do Brasil**. Nomes de código em inglês.
