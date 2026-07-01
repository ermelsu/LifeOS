# Fluxo do jogo (onboarding)

> Definido pelo Emerson em 2026-07-01. É a sequência de telas desde abrir o LifeOS até jogar.

## Sequência

1. **Abrir o jogo** → uma **introdução** (cutscene/estilo). _A fazer depois._
2. **Menu inicial** → botão **Novo jogo** (e **Continuar**, se já existe save).
3. **Editar personagem** (tela estilo _anexo1_): nome, coisa favorita, preferência de animal
   (🐱/🐶) e aparência (pele, cabelo, camisa, calça e cores). **Existe apenas 1 personagem.**
4. **Criar a primeira casa** no construtor. **Pode haver mais de uma casa**, todas do mesmo
   personagem.
5. **Jogar** — caminhar pela casa ativa.

## Regras estruturais

- **1 personagem por save**; **N casas**. O personagem é global; cada casa é uma `HouseModel`
  independente (com `id` e `nome`). Há sempre uma **casa ativa**.
- Tudo é salvo no IndexedDB (local-first). "Continuar" carrega o personagem e as casas.

## Impacto no modelo de dados (LifeState v3)

- `character: Character | null` — criado na tela de personagem.
- `houses: HouseModel[]` — lista de casas (cada uma com `id`/`nome`).
- `activeHouseId: string | null` — qual casa está aberta.

## Estado da implementação

- [x] Menu inicial (Novo jogo / Continuar).
- [x] Editor de personagem (versão inicial: nome, coisa favorita, animal, cores; prévia do avatar).
- [x] Tela de casas (listar, criar nova, escolher, renomear, excluir).
- [x] Construtor e modo Jogar operando sobre a **casa ativa**.
- [ ] Introdução/cutscene inicial.
- [ ] Aparência com sprites reais (hoje é um avatar placeholder por cores).
