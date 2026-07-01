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
| **Quarto** | Canto superior esquerdo. |
| **Escritório** | Ao lado do Quarto, à esquerda, acessado pelo Corredor. |
| **Quarto "bagunças/mudança"** | Cômodo destacado entre o Corredor e a Sala. Hoje usado como depósito temporário de mudança. _A confirmar: vira "Depósito"? Fica no mapa?_ |
| **Cozinha** | Centro-direita, abaixo da Sala. Dá acesso às áreas externas. |
| **Área externa — Cachorros da grade** | Duas manchas: uma **grande** (inferior esquerda) e uma **menor** (centro-inferior). É "a grade" mencionada na seção 9.5. |
| **Cachorros do jardim** | Área à direita, separada da grade. Segundo grupo de cães. |
| **Limite virtual** | Marcação do robô (barreira), canto inferior direito — não é um cômodo. |

## Adjacências reais (grafo de circulação)

A **Sala** é o hub central e o ponto de entrada da casa (confirmado pelo Emerson: "eu entro
pela sala, a sala é o central"). Isso valida o placeholder da seção 8. O Corredor é apenas a
passagem para a ala esquerda (Quarto/Escritório):

```
Sala  (entrada + hub central)
 ├── Corredor
 │    ├── Quarto
 │    ├── Escritório
 │    └── Quarto (bagunças/mudança)   [status a confirmar]
 └── Cozinha
      ├── Área externa — Cachorros da grade (grande + menor)
      └── Cachorros do jardim
```

## Áreas dos cachorros (seção 9.5)

A planta mostra **dois territórios distintos** de cães:

1. **Cachorros da grade** — "a grade", em duas subáreas (uma grande, uma menor).
2. **Cachorros do jardim** — grupo separado, à direita.

Isso impacta a modelagem de `Dog`/`Room`: cada cão pertence a **um território** (grade _ou_ jardim). Um dos cães da grade é a **Tisha**.

## Perguntas em aberto para o Emerson

_(Não improvisar — seção 12: "Pergunte quando faltar informação real".)_

1. O **Corredor** deve ser um cômodo caminhável no mapa (passagem larga) ou apenas o meio de ligação entre portas? (A Sala já está confirmada como hub/entrada.)
2. O **"Quarto bagunças/mudança"** entra no mapa como cômodo (ex.: futuro **Depósito** da seção 8) ou é temporário e fica de fora por enquanto?
3. Confirmar a divisão dos cães: **quais/quantos** ficam na **grade** e **quais/quantos** no **jardim**? (Nomes reais — a Tisha é da grade?)
4. As áreas de **Banheiro** e **Lavanderia / Área de serviço** (previstas na seção 8) não aparecem rotuladas nesta captura — onde ficam em relação a este layout?
5. Há **quintal/jardim** caminhável além das áreas dos cães, ou o jardim _é_ a área dos cães do jardim?
