# Planta real da casa — referência

> Entrada do projeto conforme a **seção 13** do documento-mestre ("Imagens de referência
> da casa" e "Adjacências reais entre cômodos"). Esta é a **fonte da verdade** sobre o
> layout; substitui o placeholder da seção 8 (que assumia a Sala como hub).

## Origem

Mapa capturado pelo robô aspirador da casa do Emerson (enviado em 2026-07-01).
_TODO: commitar a imagem original em `docs/referencias/planta-casa.png` para arquivo._

## Cômodos identificados

| Cômodo | Observações da planta |
|---|---|
| **Sala** | Direita, área verde ampla. **É o hub central e o ponto de entrada da casa** ("eu entro pela sala"). Todos os caminhos passam por ela. |
| **Corredor** | Faixa no topo. Passagem que liga a Sala ao Quarto e ao Escritório (não é o hub — só o corredor de acesso à ala esquerda). |
| **Quarto** | Canto superior esquerdo. **Suíte**: o **Banheiro** fica dentro do quarto (não é cômodo separado no mapa). |
| **Escritório** | Ao lado do Quarto, à esquerda, acessado pelo Corredor. **Objetos reais:** guarda-roupa (precisa ser ajeitado), mesinha e poltrona. _(Além do computador da seção 8.)_ |
| **Quarto "bagunças/mudança"** | **Fica FORA do plano por enquanto** (não vira cômodo caminhável). Aparece no mapa apenas com **uma única ação: "Ajeitar quarto da bagunça da mudança"** — nada mais. |
| **Cozinha** | Centro-direita, abaixo da Sala. Dá acesso às áreas externas. |
| **Área externa — Cachorros da grade** | Duas manchas: uma **grande** (inferior esquerda) e uma **menor** (centro-inferior). É "a grade" mencionada na seção 9.5. |
| **Jardim (Cachorros do jardim)** | Área à direita, separada da grade. **Dividido em 2 partes:** (1) cães maiores; (2) chihuahuas. A **Lavanderia / Área de serviço** fica no **deck do jardim**. |
| **Banheiro** | **Dentro do Quarto (suíte)** — não é cômodo à parte. |
| **Lavanderia / Área de serviço** | No **deck do jardim** (área externa). |
| **Limite virtual** | Marcação do robô (barreira), canto inferior direito — não é um cômodo. |

## Adjacências reais (grafo de circulação)

A **Sala** é o hub central e o ponto de entrada da casa (confirmado pelo Emerson: "eu entro
pela sala, a sala é o central"). Isso valida o placeholder da seção 8. O Corredor é apenas a
passagem para a ala esquerda (Quarto/Escritório):

```
Sala  (entrada + hub central)
 ├── Corredor
 │    ├── Quarto  (suíte → Banheiro dentro)
 │    └── Escritório
 └── Cozinha
      ├── Área externa — Cachorros da grade (grande + menor)
      └── Jardim
           ├── parte 1 — cães maiores
           ├── parte 2 — chihuahuas
           └── deck → Lavanderia / Área de serviço

Fora do mapa caminhável:
 └── Quarto da bagunça da mudança  → só a ação "Ajeitar quarto da bagunça da mudança"
```

### Expansão futura do mapa
- Poder **adicionar cômodos a partir de uma parede** (abrir uma parede → novo cômodo).
- Um **editor de mapa** dentro do próprio app, para o Emerson ajustar o layout depois.
- _(Ambos são módulos posteriores; anotados aqui para não se perderem.)_

## Áreas dos cachorros (seção 9.5)

A casa tem **três territórios** de cães + cães dentro de casa. Roster completo e correção da
Tisha em [`cachorros.md`](cachorros.md). Resumo dos territórios:

1. **Grade** (área externa, duas subáreas: grande + menor) — 5 cães.
2. **Jardim — parte 1** (cães maiores) — 9 cães.
3. **Jardim — parte 2** (chihuahuas) — 5 cães.
4. **Dentro de casa** (com o Emerson, em cuidado) — a **Sansa**.

> **Correção:** o documento-mestre original supunha a **Tisha na grade**. Na verdade a Tisha é
> **chihuahua do jardim (parte 2)**. Ver `cachorros.md`.

## Perguntas em aberto para o Emerson

_(Não improvisar — seção 12: "Pergunte quando faltar informação real".)_

Resolvidas nesta rodada:
- ✅ **Quarto da bagunça da mudança** → fora do mapa; só a ação "Ajeitar quarto da bagunça da mudança".
- ✅ **Banheiro** → suíte, dentro do Quarto.
- ✅ **Lavanderia** → no deck do jardim.
- ✅ **Divisão dos cães** → ver `cachorros.md` (Tisha é do jardim, não da grade).

Ainda em aberto:
1. O **Corredor** é caminhável (passagem larga) ou só ligação entre portas?
2. A **grade** e o **jardim** são áreas caminháveis (o personagem entra) ou só painéis de cuidado dos cães vistos de fora?
3. Nomes/estado dos objetos ainda não detalhados (Cozinha, Sala, Quarto) — virão por cômodo quando cada um entrar no mapa.
