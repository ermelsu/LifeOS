# LifeOS — Documento-Mestre para o Claude Code

> **O que é este arquivo:** a especificação oficial e o prompt de partida do projeto **LifeOS**. Foi escrito para ser lido por um agente de código (Claude Code) que vai construir o sistema do zero, em módulos. Leia o documento inteiro antes de escrever qualquer linha. A **Regra Nº 1 (O Espelho da Realidade)** é inviolável e orienta todas as decisões.

---

## 0. Como o Claude Code deve usar este documento

- Este é o **contrato do projeto**. Nenhuma funcionalidade entra no LifeOS sem passar no teste da Regra Nº 1.
- A implementação é **modular e incremental**. Cada módulo termina em algo que roda e pode ser aberto no navegador. Nunca "quebrar" o app entre módulos.
- Sempre que uma decisão de design não estiver clara aqui, **pergunte ao Emerson** antes de improvisar — especialmente em qualquer coisa que envolva o layout real da casa, os cachorros reais, ou dados pessoais.
- O idioma do projeto (UI, comentários de domínio, textos) é **português do Brasil**. Nomes de código podem ser em inglês.

---

## 1. Visão

O LifeOS é um **jogo de navegador em pixel art**, com câmera e estética inspiradas em jogos como Stardew Valley, mas **não é um jogo de fantasia**. Não tem NPCs, não tem dinheiro de jogo, não tem combate, não tem fases, não tem história inventada.

O LifeOS é um **Gêmeo Digital da Vida (Life Digital Twin)**: uma representação virtual fiel da casa do usuário, da sua rotina, dos seus recursos e dos seus hábitos, onde cada objeto, tarefa e ambiente reflete o estado real do mundo físico.

O usuário é o próprio personagem. Ele não tem fases para vencer — ele tem **a própria casa** para manter viva. Ao abrir o LifeOS, ele deve entender o estado atual da própria vida **só de olhar o ambiente**, sem abrir menu, planilha ou relatório.

A pergunta que o mundo responde, em silêncio, é uma só:

> **"Como está minha vida neste momento?"**

O objetivo do usuário não é ganhar pontos. É olhar para a casa e vê-la **bonita, organizada, abastecida e viva**. A própria casa é a maior recompensa.

---

## 2. Regra Nº 1 — O ESPELHO DA REALIDADE (INVIOLÁVEL)

**O jogo nunca simula uma realidade fictícia. Ele espelha a realidade.**

Toda informação dentro do LifeOS corresponde ao estado real da vida do usuário.

- Se há uma pilha de louça na pia do jogo, é porque **existe louça suja de verdade**.
- Se a geladeira mostra uma caixa de leite, é porque **há uma caixa de leite na geladeira real**.
- Se o cachorro precisa de água, é porque **essa tarefa está realmente pendente**.
- Se o quarto aparece impecável, é porque o usuário **o arrumou de verdade**.

Três consequências diretas que valem para **todo** o código:

1. **O mundo nunca mente.** O usuário nunca deve precisar pensar "será que eu lavei a louça?". A resposta está na frente dele: a pia está limpa, ou não.
2. **Nada acontece sozinho.** A cozinha **não** fica bagunçada porque passaram três dias. Ela só fica bagunçada porque o usuário marcou que sujou louça, ou porque uma rotina recorrente gerou aquela tarefa. Estados **não decaem automaticamente pelo tempo** (exceto onde a própria realidade impõe tempo, como validade de alimento).
3. **O personagem representa o usuário; não faz nada por ele.** O usuário executa a tarefa na vida real, abre o jogo e clica em "Concluir". O personagem então executa a animação. **A animação é uma celebração da ação real, nunca um substituto.**

**Teste de qualquer funcionalidade nova:** _"Isso representa algo real da vida do usuário?"_ Se sim, pertence ao projeto. Se não, não entra.

---

## 3. Pilares de design (filosofia de produto)

Estes princípios definem a *sensação* do LifeOS. Devem ser respeitados em toda a interface.

- **A casa é a interface.** Menus são o último recurso, não o primeiro. Cada cômodo é uma área da vida; cada objeto tem um estado; cada ambiente transmite uma mensagem.
- **Nada existe por decoração.** Todo objeto no mapa existe porque existe um objeto real correspondente. Se algo deixa de existir fisicamente, pode ser removido do mapa.
- **Comunicação visual em vez de avisos.** O ambiente informa as necessidades. Pia cheia = tem louça. Cesto cheio = tem roupa. Cama desarrumada = pendência. Evitar notificações exageradas.
- **Movimento físico.** O personagem sempre se desloca até o objeto. Nunca "teletransportar" para uma atividade via menu. Quer cozinhar? Caminha até o fogão. Quer trabalhar? Vai até o computador. A caminhada faz parte da experiência.
- **Mudanças graduais.** Ambientes evoluem aos poucos (muito bagunçado → bagunçado → aceitável → organizado → muito organizado), nunca de forma brusca. Isso cria sensação de progresso contínuo.
- **A interface desaparece.** Enquanto o usuário só caminha, existe apenas o ambiente. Painéis aparecem só quando necessários. Isso reduz fadiga visual.
- **Descoberta natural.** Funcionalidades são encontradas explorando: clicar no computador revela ações; abrir a geladeira mostra o estoque; clicar num cachorro abre seu painel de cuidados.
- **Tempo real.** O relógio do mundo acompanha o horário real. A casa amanhece, anoitece e usa luz artificial conforme a hora de verdade.
- **A casa é a recompensa.** O prêmio não é XP. É a casa bonita. E ela conta uma história: uma cozinha impecável indica disciplina; uma despensa abastecida, planejamento; a área dos cães limpa, atenção aos animais. A casa é um **diário silencioso**.
- **A casa cresce junto com a vida real.** Novo móvel comprado → pode ser adicionado ao mapa. Reforma → layout atualizado. O mapa nunca é definitivo.

---

## 4. Os seis pilares do sistema

O LifeOS é composto por seis camadas conectadas, todas alimentadas pelo **mesmo modelo de dados**:

1. **🏠 Gêmeo Digital da Casa** — representa visualmente cada cômodo, objeto e tarefa da casa real.
2. **📦 Estoque Doméstico** — alimentos, produtos de limpeza, higiene e medicamentos, com quantidade, consumo e previsão de reposição.
3. **💰 Centro Financeiro** — receitas e despesas, cada compra associada ao estoque, estatísticas por categoria, metas e evolução do patrimônio.
4. **📋 Gestão da Rotina** — tarefas, hábitos, projetos, trabalho, academia e cuidados com os cachorros, usando o personagem e o ambiente como interface.
5. **🎮 Camada de Gamificação** — níveis por área, XP, moedas de mérito, conquistas, sequências (streaks) e recompensas.
6. **🧠 Assistente Inteligente** — uma IA que lê todo o sistema e atua como gerente da vida do usuário, sugerindo a próxima melhor ação e alertando sobre estoque, finanças e hábitos.

---

## 5. Direção estética

- **Estilo:** 2D pixel art, câmera *top-down* (visão de cima levemente inclinada, no espírito de Stardew Valley), animações de personagem e de objetos.
- **Identidade própria:** inspirado no *gênero*, mas com **assets originais**. Não copiar arte, tiles ou sprites do Stardew Valley (questão de direitos autorais e de identidade). O mapa **não** é uma fazenda de fantasia — é a **casa real do Emerson**.
- **Início com placeholders:** para não travar o desenvolvimento, começar com tiles/sprites de placeholder (ex.: assets de pixel art abertos/livres) e substituir depois por arte customizada que reproduza a casa real a partir das imagens de referência.
- **Iluminação em tempo real:** overlay de cor/luz que muda com a hora real (amanhecer, meio-dia, tarde com sombras longas, noite com luz artificial).
- **Som ambiente por cômodo:** leve na cozinha, ruído de máquina na lavanderia quando em uso, silêncio no quarto, vento/pássaros/cães na área externa. Confortável, nunca poluído.
- **Clima (fase posterior):** inicialmente só visual; futuramente sincronizado com dados meteorológicos da cidade do usuário. Função apenas de imersão.
- **Transições sem tela de carregamento perceptível** entre cômodos. Portas funcionam como portas reais.

---

## 6. Stack técnica e princípios de arquitetura

### Stack (decidida)

- **Linguagem:** TypeScript (segurança de tipos é importante num sistema com muitos dados).
- **Engine do mundo:** **Phaser 3** (tilemaps, sprites, animações, câmera 2D — ideal para navegador).
- **Build/dev:** **Vite** (rápido, moderno, ótima DX).
- **Painéis de dados (inventário, finanças, tarefas, status dos cães):** overlays em **HTML/CSS/DOM** por cima do canvas do Phaser — HTML lida muito melhor com dados densos do que desenhar tudo no canvas.
- **Persistência (fase 1):** **IndexedDB** (via wrapper leve, ex.: Dexie.js). Funciona offline, sem backend, e **publica como site estático** — permite começar pelo **GitHub Pages**.
- **Backend (módulo posterior):** Node.js + banco (PostgreSQL ou similar) **só quando** houver necessidade real de sincronização entre dispositivos ou dados mais pesados. Não bloquear o início com isso.
- **Salvamento:** automático.

### Princípio de arquitetura mais importante

**Separe o MODELO DE DOMÍNIO (a fonte da verdade sobre a vida do usuário) da CAMADA DE APRESENTAÇÃO (Phaser + HTML).**

- O estado da vida — cômodos, objetos, estados, estoque, tarefas, finanças, cães, streak — vive num **domínio independente do Phaser**, testável isoladamente, persistido no IndexedDB.
- O Phaser **lê** desse domínio e **renderiza**. Os painéis HTML também leem do mesmo domínio.
- Toda ação do usuário (concluir tarefa, registrar compra) muda o **domínio**; a apresentação reage à mudança.
- Isso é essencial porque **as seis camadas (incluindo o Assistente Inteligente) consomem o mesmo modelo**. Se o estado morar dentro das cenas do Phaser, o projeto não escala.

Sugestão de organização em camadas: `domain/` (entidades, regras, sem dependência de Phaser) · `data/` (persistência IndexedDB) · `game/` (cenas, sprites, animações Phaser) · `ui/` (painéis HTML) · `app/` (composição, relógio, save loop).

---

## 7. Modelo de dados (entidades centrais)

Rascunho das entidades. Os nomes e campos podem ser refinados, mas o **conjunto de conceitos** deve existir.

- **Room** — `id`, `nome`, `areaDaVida` (conforto/alimentação/descanso/higiene/roupas/trabalho/cães…), `layout/tilemapRef`, `cômodosVizinhos[]`.
- **GameObject** (objeto interativo) — `id`, `roomId`, `tipo`, `posição`, `estadoAtual`, `açõesDisponíveis[]`. Existe só se existe um objeto real correspondente.
- **ObjectState** — `id`, `objectId`, `nome`, `spriteVariant`, `ordem` (para a evolução gradual). Ex.: pia = limpa → pouca louça → louça acumulada → muito cheia.
- **Action** — `id`, `label`, `taskTemplateId?`, `animação`. Só ações coerentes com o objeto (nada de "menu administrativo").
- **Task** — `id`, `título`, `categoria`, `prioridade`, `dificuldade`, `tempoEstimado`, `energiaNecessária`, `recorrência`, `objetoVinculado?`, `status`, `data`, `concluídaEm`.
- **TaskTemplate** — modelo de tarefa recorrente (regras de recorrência que geram tarefas do dia).
- **InventoryItem** — `id`, `nome`, `categoria`, `localDeArmazenamento` (o item **sabe em que cômodo/recipiente fica**), `quantidade`, `unidade`, `dataDeCompra`, `validade`, `preçoPago`, `mercado`, `consumoMédio`.
- **Purchase** — `id`, `data`, `mercado`, `categoria`, `valorTotal`, `itens[]`.
- **FinanceEntry** — `id`, `data`, `tipo` (receita/despesa), `categoria`, `valor`, `compraVinculada?`.
- **Dog** — `id`, `nome`, `saúde`, `alimentação`, `água`, `fezes`, `últimoBanho`, `medicamentos`, `humor`.
- **DogCareLog** — `id`, `dogId`, `ação`, `timestamp`, `observação`.
- **Streak** — `sequênciaAtual`, `maiorSequência`, `conclusõesDiárias[]` (percentual por dia).
- **LifeArea / Level** — `área`, `nível`, `xp` (progressão separada por área).
- **Achievement** — `id`, `nome`, `condição`, `desbloqueadoEm`.
- **Asset (Patrimônio)** — `id`, `nome`, `custo`, `dataDeCompra`, `garantia`, `notaFiscal`, `estadoDeConservação`, `vidaÚtilEstimada`.
- **Reward** — `id`, `nome`, `custoEmMoedas`.
- **GameClock** — relógio do jogo sincronizado ao relógio real.

---

## 8. O mapa da casa

O layout final virá das **imagens de referência do Emerson** (ver seção 13). Até lá, use um layout de placeholder fiel a esta estrutura. A disposição de referência ramifica a partir da sala:

```
Sala
 ├── Cozinha
 ├── Quarto
 ├── Banheiro
 ├── Área de serviço (Lavanderia)
 ├── Escritório
 └── Quintal / Área externa
      └── Área dos cachorros (a "grade")
```

> **Atualização (2026-07-01):** a planta real (mapa do robô aspirador) confirma que a **Sala é o hub central e o ponto de entrada** da casa ("eu entro pela sala"). O Corredor é só a passagem para a ala esquerda (Quarto/Escritório). Ver [`docs/referencias/planta-casa.md`](referencias/planta-casa.md) para as adjacências reais e as perguntas em aberto.

Cada cômodo é uma **área da vida**:

| Cômodo | Representa |
|---|---|
| Sala | Conforto, lazer, convivência |
| Cozinha | Alimentação, organização doméstica, estoque alimentar |
| Quarto | Descanso, qualidade do sono, conforto, organização pessoal |
| Banheiro | Higiene, autocuidado, medicamentos, produtos pessoais |
| Lavanderia / Área de serviço | Roupas, limpeza, organização doméstica |
| Escritório | Trabalho, estudos, projetos, criação de conteúdo |
| Área dos cachorros | Cuidados com os animais |

**Cômodos futuros previstos:** Garagem, Jardim, Academia, Oficina, Depósito. Cada ambiente novo adiciona novos sistemas.

### Catálogo de objetos por cômodo (com estados e ações)

Ações são sempre físicas e coerentes. Nada deve parecer um menu de administração.

**Cozinha**
- **Pia** — *estados:* limpa · pouca louça · louça acumulada · muito cheia. *ações:* lavar louça · lavar pia · limpar bancada. *(Objeto-referência para a evolução gradual de estados — implementar primeiro.)*
- **Fogão** — *estados:* limpo · precisando de limpeza. *ações:* preparar refeição · registrar limpeza.
- **Geladeira** — *estados:* cheia · parcialmente abastecida · quase vazia. *ações:* ver alimentos · guardar compras · retirar alimentos · ver validade.
- **Freezer** — inventário próprio (carnes, gelo…).
- **Despensa** — inventário próprio (arroz, feijão, macarrão, café…).
- **Bancada** — *estados:* limpa · suja.
- **Lixeira** — *estados:* vazia · cheia. *ações:* trocar saco do lixo.

**Quarto**
- **Cama** — *estados:* arrumada · desarrumada. *ações:* dormir · descansar · ler · arrumar.

**Banheiro**
- **Cesto de lixo** — vazio · cheio → trocar.
- **Box/Pia** — *ações:* tomar banho · escovar dentes.
- **Armário de remédios** — inventário de medicamentos (com validade).

**Lavanderia / Área de serviço**
- **Cesto de roupa** — vazio · cheio.
- **Máquina de lavar** — ociosa · lavando (com som/animação quando em uso). *ações:* lavar roupas.
- **Varal** — vazio · com roupa estendida.
- *(Fluxo da roupa em etapas reais: cesto cheio → máquina funcionando → roupa no varal → roupa dobrada.)*

**Escritório**
- **Computador** — *ações:* trabalhar · editar vídeo · programar · estudar · abrir projetos.

**Sala**
- **Sofá** — sentar · descansar.
- **TV / Videogame** — lazer (recompensas em moedas).

**Área dos cachorros ("a grade")**
- Área externa igual à realidade. Aparecem **todos os cães** que estão na grade. Cada um tem painel de status próprio (ver seção 9).

---

## 9. Especificação dos sistemas

### 9.1 Gestão da Rotina (tarefas e "missões")

- Cada **Task** tem: prioridade, dificuldade, tempo estimado, energia necessária, recorrência e categoria.
- A tela do dia funciona como **missões**: uma checklist do que fazer hoje (arrumar cama, lavar louça, academia, preparar almoço, passear com cães, editar vídeo…).
- Fluxo de conclusão: usuário clica na atividade → personagem **caminha até o objeto** → inicia animação → HUD mostra "Lavando louça… tempo iniciado" → usuário conclui a tarefa **na vida real** → aperta **Concluir** → estado do objeto muda → recompensa é concedida.
- **Tarefas recorrentes** são geradas por `TaskTemplate` (ex.: arrumar cama todo dia). Uma rotina recorrente **pode** gerar a pendência do dia — isso é a única forma "automática" permitida, e ainda assim representa a realidade (a cama de fato precisa ser arrumada de novo).

### 9.2 Estados de objetos e comunicação visual

- Cada objeto muda de **sprite** conforme o estado. A mudança é a "recompensa visual" da tarefa.
- A evolução é **gradual** (vários estágios), nunca brusca.
- Ao concluir tarefas: pia fica limpa; cama muda de sprite; lixeira esvazia; despensa passa a exibir novos produtos.

### 9.3 Estoque Doméstico e Inventário

- **Cada local tem seu próprio inventário**, visível ao caminhar até ele: geladeira, freezer, despensa, banheiro, área de limpeza.
- Exemplo de inventário: `Leite ×1` significa uma caixa de leite. `Ovos (12)`, `Frango (3 kg)`, etc.
- **Uso automático de itens:** ao clicar em "Preparar almoço", o jogo verifica se há os ingredientes (✔️/❌) e informa o que falta ("Está faltando cebola"). O item que falta pode ir destacado para a lista de compras.

### 9.4 Compras, Finanças e Previsão

- **Sem OCR de cupom fiscal** (decisão travada — ver seção 10). Registro é **manual**.
- **Ciclo da compra:** o usuário chega do mercado → abre o jogo → vai até a **porta** → escolhe **🛒 Nova compra** → informa mercado, categoria e valor total → adiciona os produtos (podendo reusar itens já cadastrados).
- Ao salvar, **o estoque se atualiza sozinho** porque **cada produto já sabe onde é armazenado** (leite/carne/frango → geladeira; arroz/feijão → despensa; papel higiênico → banheiro; detergente → área de limpeza). O usuário **não** coloca item por item em cada cômodo.
- **Ao mesmo tempo**, a compra vira uma **despesa** na categoria certa. Um lançamento só, sem duplicar.
- **Histórico por item:** quantidade atual, última compra, quantidade comprada, preço, mercado, consumo médio → o sistema **prevê quando vai acabar**.
- **Lista de compras inteligente:** quando um item fica baixo (ex.: restam 2 caixas de leite), o sistema já sugere "⚠️ Comprar leite" **antes de acabar**.
- **Previsão por hábito:** aprende o consumo (ex.: 1 ovo/dia → restam 8 → acaba em 8 dias) e recomenda repor quando faltar menos de uma semana.
- **Painel financeiro integrado (mensal):** salário/receitas, mercado, academia, combustível, lazer, investimentos, assinaturas, sobra do mês.
- **Estatísticas financeiras:** % gasto por categoria (alimentação, lazer, jogos, academia…).
- **Patrimônio:** móveis e eletrônicos também são cadastrados (geladeira, fogão, computador, monitor, TV, videogames, robô aspirador) com custo, data de compra, garantia, nota fiscal, estado de conservação e vida útil estimada.

### 9.5 Cachorros

- Área externa igual à real; mostra os cães **da grade**.
- **Painel de status por cão:** ❤️ saúde · 🍖 alimentação · 💧 água · 💩 fezes (precisa recolher?) · 🚿 banho (há quantos dias) · 💊 medicamentos · 😊 humor.
- **Ações ao clicar no cão:** alimentar · trocar água · dar banho · brincar · passear · aplicar medicamento · registrar observação.
- Gera **histórico de cuidados** (`DogCareLog`) e evita esquecer necessidades.
- **Escalável:** deve ser fácil ver e escalar para vários cães. (A quantidade e os nomes reais virão das imagens de referência — um dos cães mencionados é a **Tisha**.)
- Fezes não recolhidas **aparecem**; depois de recolher, **somem** (Regra Nº 1).

### 9.6 Streak (sequência) e metas diárias

- Todo dia tem um **percentual de conclusão** (ex.: 16 de 20 tarefas = 80%).
- **Meta mínima: 75%** (decisão travada). Bateu a meta → o dia conta como concluído e a sequência avança 🔥. Ficou abaixo (ex.: 70%) → a sequência é interrompida.
- Incentiva **consistência sem exigir perfeição**.
- **Medalhas de consistência:** 🥉 7 dias · 🥈 30 dias · 🥇 100 dias · 💎 365 dias. Ficam expostas no perfil do personagem.

### 9.7 Níveis e XP por área da vida

- **Não existe nível geral.** Cada área evolui separadamente: Organização, Saúde, Trabalho, Finanças, Estudos.
- Quanto mais atividades de uma categoria, mais aquela área sobe de nível.

### 9.8 Moedas e recompensas

- **Moedas = mérito**, não dinheiro real (decisão travada). Ganhas ao concluir tarefas.
- Servem para **"comprar" recompensas pessoais**: 🎮 jogar videogame (ex.: 40) · 🎬 assistir filme (ex.: 80) · 🍕 pedir pizza (ex.: 300) · 🛍️ comprar um jogo novo (ex.: 2.000).
- A lógica: antes da recompensa, o usuário precisa **ganhá-la** cumprindo responsabilidades.
- Cada atividade gera XP da área + moedas + progresso de sequência (ex.: lavar louça → +XP Organização, +moedas, +1 na sequência; treinar → +XP Saúde, +moedas).

### 9.9 Conquistas

- Ex.: 7 dias seguidos lavando louça · 30 treinos concluídos · cozinha organizada por 15 dias · geladeira sempre abastecida por um mês · dormir cedo por 10 dias seguidos.

### 9.10 Estado e humor da casa

- **Estado geral da casa** por cômodo (ex.: Organização 82% · Cozinha 60% · Quarto 95% · Banheiro 70% · Lavanderia 40% · Cães 90%). Basta olhar o mapa para saber onde falta atenção.
- **Humor da casa** (reflexo, nunca punição exagerada):
  - Tudo em ordem → mais iluminação, plantas bonitas, música ambiente alegre, personagem mais animado, cães brincando.
  - Muitas tarefas negligenciadas → louça acumulada, sacos de lixo aparecendo, poeira, roupas acumuladas, cães pedindo atenção.
- É só um **reflexo visual do estado real** — ajuda a perceber rápido o que precisa ser feito.

### 9.11 Estatísticas

- Maior sequência já alcançada · média de conclusão · dias perfeitos (100%) · dias acima da meta · horário médio de término · atividades mais realizadas · atividades mais adiadas.

### 9.12 Assistente Inteligente (🧠)

- Uma IA que **lê todo o sistema** (casa, rotina, estoque, finanças, cães) e atua como **gerente da vida**, ajudando a decidir **o que fazer agora**, não só registrando o passado.
- Exemplos de fala:
  - "Você tem ingredientes suficientes para cozinhar até sexta-feira."
  - "O detergente deve acabar em três dias."
  - "Você já está há 18 dias sem limpar o ventilador."
  - "Hoje, completar mais duas tarefas fará você atingir 75% e manter sua sequência de 42 dias."
  - "Você gastou mais com delivery do que com mercado neste mês. Vale rever esse hábito?"
  - "Seu freezer está cheio de frango. Que tal planejar refeições com ele antes de comprar mais?"
- É a camada que transforma o LifeOS de "organizador com aparência de jogo" em um **Life OS de verdade**.

---

## 10. Decisões travadas (não reabrir sem conversar com o Emerson)

1. **Meta diária do streak = 75%** (não 50%).
2. **Finanças por registro manual, sem OCR de cupom fiscal** — evitar a complexidade e o risco de erro justamente na parte mais importante.
3. **Cada produto sabe seu local de armazenamento** — um único cadastro de compra atualiza o cômodo certo.
4. **Moedas são mérito, não dinheiro real.**
5. **Sem NPCs, sem combate, sem história inventada, sem economia de dinheiro de jogo.**
6. **O personagem registra ações reais; não as executa pelo usuário.** Animação = celebração.
7. **Nada decai automaticamente pelo tempo.** Só muda por marcação do usuário ou por rotina recorrente (que também representa a realidade).
8. **Início local-first e estático** (IndexedDB + GitHub Pages). Backend só em módulo posterior, se necessário.
9. **Assets originais**, inspirados no gênero, sem copiar arte do Stardew Valley.
10. **Nome do projeto: LifeOS.**

---

## 11. Plano de implementação modular

Cada módulo termina com algo que **roda no navegador** e pode ser aberto. Ordem pensada para ver o conceito de pé o quanto antes e ir crescendo sem quebrar nada.

### Módulo 0 — Fundação técnica
- **Objetivo:** montar o esqueleto do projeto.
- Repositório no GitHub; estrutura em camadas (`domain/`, `data/`, `game/`, `ui/`, `app/`); TypeScript (strict) + Vite + Phaser 3; wrapper de IndexedDB (ex.: Dexie); pipeline de **deploy no GitHub Pages**; loop de **salvamento automático**.
- **Pronto quando:** um projeto vazio compila, roda localmente e publica uma página em branco no GitHub Pages.

### Módulo 1 — O mundo caminhável (MVP visual)
- **Objetivo:** provar o conceito. Abrir o navegador e "entrar na casa".
- Um cômodo (a **Cozinha**) em tilemap; sprite do personagem; **movimento** (clique-para-andar e/ou teclado) com câmera; **relógio em tempo real** afetando a iluminação (amanhecer/dia/tarde/noite).
- **Pronto quando:** dá para caminhar pela cozinha e a luz muda conforme a hora real.

### Módulo 2 — Objetos e estados
- **Objetivo:** a casa começa a "falar".
- Objetos interativos com estados; clicar num objeto abre ações coerentes; personagem **caminha até** o objeto; animação; botão **Concluir**; o sprite muda de estado; estados **persistem** no IndexedDB.
- **Flagship:** a **Pia** com seus 4 estados (limpa → pouca louça → louça acumulada → muito cheia).
- **Pronto quando:** marcar "lavar louça" faz o personagem ir até a pia, animar e deixar a pia limpa — e ao reabrir o app, o estado continua salvo.

### Módulo 3 — Rotina e tarefas ("missões")
- **Objetivo:** o dia a dia.
- Modelo de `Task` completo (prioridade, dificuldade, tempo, energia, recorrência, categoria); checklist do dia; vínculo tarefa↔objeto; `TaskTemplate` gerando tarefas recorrentes; conclusão pelo fluxo do Módulo 2.
- **Pronto quando:** o usuário vê as tarefas de hoje, conclui pela casa e o dia registra o progresso.

### Módulo 4 — Streak, metas e progressão
- **Objetivo:** motivação por consistência.
- Percentual diário; meta de **75%**; contador de sequência 🔥; medalhas (7/30/100/365); níveis e XP **por área**; painel de estatísticas.
- **Pronto quando:** concluir tarefas move o percentual do dia, mantém/quebra a sequência e evolui as áreas.

### Módulo 5 — Estoque doméstico e inventário
- **Objetivo:** o que existe na casa.
- Inventário por local (geladeira, freezer, despensa, banheiro, área de limpeza); itens com quantidade, unidade, validade e local; ver estoque caminhando até o recipiente; verificação de ingredientes ao "preparar refeição" (✔️/❌ + o que falta).
- **Pronto quando:** dá para abrir a geladeira e ver os alimentos reais; "preparar almoço" avisa o que falta.

### Módulo 6 — Compras, finanças e previsão
- **Objetivo:** o ciclo da compra e o dinheiro.
- Evento **🛒 Nova compra** na porta; cadastro manual de produtos (com local de armazenamento); atualização automática do estoque; a compra vira despesa na categoria certa; histórico por item; consumo médio + **previsão de término**; **lista de compras inteligente**; painel financeiro mensal; estatísticas por categoria; cadastro de **patrimônio**.
- **Pronto quando:** registrar uma compra abastece os cômodos certos e lança a despesa de uma vez só, e o sistema começa a prever reposições.

### Módulo 7 — Área dos cachorros
- **Objetivo:** os cães.
- Entidades `Dog` (escalável para vários); painel de status por cão; ações de cuidado; `DogCareLog` (histórico); lembretes quando algo fica pendente (fezes aparecem/somem, banho por dias, medicamentos em dia).
- **Pronto quando:** a área externa mostra os cães, cada um com status, e cuidar deles atualiza o painel e o histórico.

### Módulo 8 — Moedas, recompensas e conquistas
- **Objetivo:** fechar a gamificação.
- Economia de **moedas de mérito**; loja de recompensas pessoais (jogar, filme, pizza, jogo novo); sistema de conquistas.
- **Pronto quando:** concluir tarefas dá moedas e o usuário pode "gastar" numa recompensa; conquistas desbloqueiam.

### Módulo 9 — Casa completa + humor da casa
- **Objetivo:** a casa inteira, viva.
- Todos os cômodos (sala, quarto, banheiro, lavanderia, escritório, quintal); som ambiente por cômodo; **estado geral por cômodo**; **humor da casa** refletindo o estado global; clima visual.
- **Pronto quando:** dá para circular pela casa toda e ela reage visualmente ao cuidado.

### Módulo 10 — Assistente Inteligente
- **Objetivo:** o gerente da vida.
- Camada de IA lendo todo o modelo; sugestão da **próxima melhor tarefa**; alertas de estoque/finanças/hábitos; insights (ex.: delivery × mercado, "cozinhe o frango do freezer").
- **Pronto quando:** o assistente dá recomendações úteis baseadas no estado real do sistema.

### Módulo 11 (opcional) — Backend e sincronização
- **Objetivo:** vários dispositivos / dados pesados.
- Node.js + banco; sincronização; migração dos dados locais.
- **Pronto quando:** o mesmo LifeOS abre sincronizado em mais de um aparelho.

*(Cômodos e sistemas futuros — garagem, jardim, academia, oficina, depósito; clima meteorológico real — entram como módulos adicionais depois.)*

---

## 12. Convenções de trabalho para o Claude Code

- **TypeScript strict.** Domínio sem dependência de Phaser; testável isolado.
- **Fonte da verdade no domínio**, apresentação (Phaser + HTML) só reage. Nunca guardar estado de vida dentro de cenas do Phaser.
- **Cada módulo é entregável.** Nunca deixar o app quebrado entre módulos. Commits pequenos e descritivos.
- **Salvar cedo, salvar sempre.** Persistência no IndexedDB desde o Módulo 0.
- **Placeholders primeiro, arte depois.** Não travar em assets; deixar a troca de arte fácil.
- **Toda feature passa no teste da Regra Nº 1.** Se não representa algo real, não entra.
- **Pergunte quando faltar informação real** (layout, cães, categorias, dados pessoais) em vez de inventar.

---

## 13. Pendências — o que ainda vem do Emerson

Estes itens são **entradas do projeto** e devem ser solicitados antes de finalizar as partes correspondentes:

- **Imagens de referência da casa** (fotos e/ou planta) para reproduzir o layout e a disposição real dos cômodos e objetos. _(Recebida uma planta do robô aspirador em 2026-07-01 — ver `docs/referencias/planta-casa.md`.)_
- **Imagem de referência da área dos cachorros ("a grade")** e a **lista real dos cães** (nomes, quantidade). Um deles é a **Tisha**.
- **Adjacências reais** entre cômodos (a estrutura da seção 8 é um placeholder).
- **Estoque inicial real** (o que já existe em geladeira, freezer, despensa, banheiro, área de limpeza) para semear o inventário.
- **Categorias financeiras e renda** que o Emerson quer acompanhar.
- **Catálogo de recompensas** e seus preços em moedas (os valores da seção 9.8 são exemplos).
- **Metas específicas** por área (academia na semana, litros de água, horas de sono, horas de trabalho, etc.).

---

*Fim do documento-mestre. Construir na ordem dos módulos, respeitando a Regra Nº 1 em cada linha. A meta final não é fazer um jogo — é fazer o Emerson abrir o navegador e ver, em segundos, como está a própria vida.*
