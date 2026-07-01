# Cachorros — roster real

> Entrada do projeto (seção 13). Fonte da verdade sobre **quantos** cães existem e **onde**
> cada um fica. Alimenta a modelagem de `Dog` e o Módulo 7. Informado pelo Emerson em
> 2026-07-01.

## Territórios

A casa tem **três territórios** externos de cães, mais os que ficam **dentro de casa**.
Cada `Dog` pertence a **um** território.

### 🟩 Grade (área externa — subáreas grande + menor) — 5 cães
1. Margot
2. Princesa
3. Max
4. Hércules
5. Sky

### 🌳 Jardim — parte 1 (cães maiores) — 9 cães
1. Nina
2. Hector
3. Lua
4. Nymeria
5. Lady
6. Marie
7. Dobby
8. Peppe
9. Vhagar

### 🐕 Jardim — parte 2 (chihuahuas) — 5 cães
1. **Tisha**
2. Agostinho
3. Jake
4. Canela
5. Penélope

### 🏠 Dentro de casa (em cuidado, com o Emerson) — 1 cão
1. **Sansa** — está sendo cuidada dentro de casa, junto do Emerson.

## Total: 20 cães

| Território | Qtd. |
|---|---|
| Grade | 5 |
| Jardim — parte 1 (maiores) | 9 |
| Jardim — parte 2 (chihuahuas) | 5 |
| Dentro de casa | 1 |
| **Total** | **20** |

## Notas de modelagem

- O jardim é **dividido em 2 partes** (maiores × chihuahuas); tratar como duas subáreas do
  mesmo território "Jardim", ou dois territórios irmãos — decidir no Módulo 7.
- **Sansa** é um caso especial: cão **dentro de casa**, em cuidado. Provavelmente aparece na
  Sala/Quarto e não numa área externa. Pode ter status extra (ex.: em recuperação).
- Com 20 cães, o painel de cuidados **precisa escalar bem** (seção 9.5): visão de lista por
  território + destaque só para quem tem pendência (água, fezes, banho, medicamento).

## Correção ao documento-mestre

O documento-mestre (seções 9.5 e 13) citava a **Tisha como cão da grade**. **Correto:** a
Tisha é **chihuahua do jardim (parte 2)**. As menções foram ajustadas para apontar para este
arquivo como fonte da verdade.

## Pendências

- **Fotos/estados iniciais** de cada cão (saúde, último banho, medicamentos em uso) para
  semear os dados quando o Módulo 7 começar.
