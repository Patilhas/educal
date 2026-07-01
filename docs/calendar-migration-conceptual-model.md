# Modelo conceptual — migração do calendário com grafo de dependências

## 1. Objetivo

Modelar a migração do calendário de um ano letivo para o seguinte como um **grafo de dependências**.

A ideia é que cada processo do calendário seja um **nó** e que as regras entre processos sejam **arestas** ou **restrições**.
Assim, em vez de copiar datas “à mão”, o sistema passa a:

- saber **o que depende de quê**;
- saber **o que pode acontecer em simultâneo**;
- saber **o que está bloqueado por férias, fins de semana ou feriados**;
- saber **o que precisa de duração mínima**;
- saber **quando uma violação obriga a recuar no tempo**.

---

## 2. Princípio base

> **Regra base:** se houver incumprimento, o evento deve recuar no tempo até encontrar uma posição válida.

Isto significa que a migração não deve tentar “forçar” um evento para a frente quando viola uma regra crítica.
O comportamento padrão deve ser:

1. tentar manter a estrutura relativa do calendário;
2. validar todas as restrições;
3. se houver conflito, ajustar para trás no tempo;
4. se ainda não houver solução, sinalizar conflito insolúvel.

---

## 3. Dois exemplos reais de aplicação

A sequência usada nos exemplos é sempre esta:
1. mostrar o **ano transato**, já válido;
2. fazer a **cópia mecânica para o ano seguinte**, trocando apenas o ano;
3. correr a **validação passo a passo**;
4. se houver falha, aplicar o **recuo no tempo** até a regra voltar a cumprir-se.

### Exemplo real 1 — Candidaturas

#### 1) Ano transato
Fluxo original:
- envio do edital pelo júri;
- homologação pelo presidente;
- publicação oficial;
- abertura das candidaturas;
- fecho das candidaturas.

Datas do ano transato:
- envio do edital: **2026-06-10**
- homologação: **2026-06-11**
- publicação: **2026-06-16**
- abertura das candidaturas: **2026-06-17**
- fecho das candidaturas: **2026-06-30**

#### 2) Cópia para o ano seguinte
Copiando apenas o ano:
- envio do edital: **2027-06-10**
- homologação: **2027-06-11**
- publicação: **2027-06-16**
- abertura das candidaturas: **2027-06-17**
- fecho das candidaturas: **2027-06-30**

#### 3) Validação passo a passo
1. **Verificar o tipo de dia** em cada data de início/fim.
    - 2027-06-10 = quinta-feira
    - 2027-06-11 = sexta-feira
    - 2027-06-16 = quarta-feira
    - 2027-06-17 = quinta-feira
    - 2027-06-30 = quarta-feira
2. **Verificar a dependência entre fases**.
    - edital < homologação < publicação < abertura < fecho
    - a ordem está correta.
3. **Verificar os 2 dias úteis entre homologação e publicação**.
    - entre 2027-06-11 e 2027-06-16 existem **2027-06-12** (sexta) e **2027-06-15** (segunda)
    - portanto existem **2 dias úteis no meio**
    - a regra cumpre-se.
4. **Verificar a duração mínima das candidaturas**.
    - 2027-06-17 até 2027-06-30 mantém uma janela suficiente
    - a duração mínima fica respeitada.
5. **Conclusão**.
    - a cópia para o ano seguinte já fica válida
    - **não é necessária qualquer correção**.

#### Resultado final
- envio do edital: **2027-06-10**
- homologação: **2027-06-11**
- publicação: **2027-06-16**
- abertura das candidaturas: **2027-06-17**
- fecho das candidaturas: **2027-06-30**

---

### Exemplo real 2 — Matrículas e inscrições

#### 1) Ano transato
Blocos originais:
- matrículas normais: **2026-09-01** a **2026-09-02**
- matrículas internacionais: **2026-09-04** a **2026-09-08**
- matrículas de pós-graduação: **2026-09-09** a **2026-09-11**
- matrículas CNA: **2026-09-14** a **2026-09-16**
- inscrições em UC: **2026-09-17** a **2026-09-23**

#### 2) Cópia para o ano seguinte
Copiando apenas o ano:
- matrículas normais: **2027-09-01** a **2027-09-02**
- matrículas internacionais: **2027-09-04** a **2027-09-08**
- matrículas de pós-graduação: **2027-09-09** a **2027-09-11**
- matrículas CNA: **2027-09-14** a **2027-09-16**
- inscrições em UC: **2027-09-17** a **2027-09-23**

#### 3) Validação passo a passo
1. **Verificar os dias de início e fim**.
    - matrículas normais: quarta-feira a quinta-feira
    - internacionais: sábado a quarta-feira
    - pós-graduação: quinta-feira a sábado
    - CNA: terça-feira a quinta-feira
    - UC: sexta-feira a quinta-feira
2. **Primeiro conflito**: matrículas internacionais.
    - 2027-09-04 é **sábado**
    - início não pode cair ao fim de semana
    - solução: recuar o bloco inteiro para **2027-09-03 a 2027-09-07**.
3. **Revalidar a exclusividade**.
    - matrículas normais terminam em **2027-09-02**
    - internacionais começam em **2027-09-03**
    - não há sobreposição.
4. **Segundo conflito**: matrículas de pós-graduação.
    - 2027-09-11 é **sábado**
    - fim não pode cair ao fim de semana
    - solução: recuar o bloco inteiro para **2027-09-08 a 2027-09-10**.
5. **Revalidar a cadeia inteira**.
    - internacionais terminam em **2027-09-07**
    - pós-graduação começa em **2027-09-08**
    - continua tudo sem sobreposição.
6. **Verificar CNA e UC**.
    - CNA: **2027-09-14 a 2027-09-16**
    - UC: **2027-09-17 a 2027-09-23**
    - ambos continuam válidos e depois da fase anterior.

#### Resultado final
- matrículas normais: **2027-09-01** a **2027-09-02**
- matrículas internacionais: **2027-09-03** a **2027-09-07**
- matrículas de pós-graduação: **2027-09-08** a **2027-09-10**
- matrículas CNA: **2027-09-14** a **2027-09-16**
- inscrições em UC: **2027-09-17** a **2027-09-23**

#### Leitura conceptual
Aqui vê-se claramente a lógica do grafo:
- cada bloco é copiado do ano transato;
- cada bloco é validado individualmente;
- se um bloco cai em fim de semana, recua-se o bloco inteiro;
- depois volta-se a validar a exclusividade entre blocos.

---

### Exemplo real 3 — Nova restrição introduzida a meio da migração

#### Contexto
Aqui o ponto importante não é um conflito do ano transato, mas sim uma **nova restrição** que aparece quando o calendário já estava quase migrado.

Depois de copiar o fluxo de candidaturas para 2027, a instituição introduz uma regra nova:
- entre **2027-06-14** e **2027-06-16** não pode haver publicação nem atos administrativos ligados à abertura do processo;
- essa janela corresponde a uma interrupção interna do sistema.

#### Ano transato
Fluxo original já válido:
- envio do edital: **2026-06-10**
- homologação: **2026-06-11**
- publicação: **2026-06-16**
- abertura das candidaturas: **2026-06-17**
- fecho das candidaturas: **2026-06-30**

#### Cópia para o ano seguinte
Copiando apenas o ano:
- envio do edital: **2027-06-10**
- homologação: **2027-06-11**
- publicação: **2027-06-16**
- abertura das candidaturas: **2027-06-17**
- fecho das candidaturas: **2027-06-30**

#### Nova restrição que altera o resultado
Quando a nova regra entra, a publicação em **2027-06-16** deixa de ser válida porque cai dentro da janela bloqueada.

#### Validação passo a passo
1. **Verificar a nova janela interdita**.
   - 2027-06-14 a 2027-06-16 estão bloqueados.
2. **Verificar o impacto na publicação**.
   - a publicação prevista em **2027-06-16** fica inválida.
3. **Recuar a publicação para trás no tempo**.
   - a primeira data útil disponível antes da janela bloqueada é **2027-06-11**.
4. **Revalidar o intervalo entre homologação e publicação**.
   - para manter os **2 dias úteis**, a homologação tem de recuar também.
   - homologação passa de **2027-06-11** para **2027-06-08**.
5. **Revalidar os dias de calendário**.
   - 2027-06-08 = terça-feira
   - 2027-06-11 = sexta-feira
   - ambas as datas são úteis.
6. **Verificar a abertura das candidaturas**.
   - a abertura pode manter-se em **2027-06-17** porque continua depois da publicação e fora da janela bloqueada.

#### Resultado final após a nova restrição
- envio do edital: **2027-06-10**
- homologação: **2027-06-08**
- publicação: **2027-06-11**
- abertura das candidaturas: **2027-06-17**
- fecho das candidaturas: **2027-06-30**

#### Leitura conceptual
Este exemplo mostra bem a diferença entre:
- **copiar o calendário**;
- **validar o calendário**;
- **e corrigir o calendário quando surge uma nova restrição**.

Ou seja: nem todas as datas têm de mudar, mas as que colidem com a nova regra têm de recuar até deixar de haver conflito.

---

### Exemplo real 4 — Nova tolerância afeta as inscrições em UC

#### Contexto
Depois da migração inicial, a instituição introduz uma nova tolerância interna:
- entre **2027-09-10** e **2027-09-11** não pode haver inscrições em UC;
- essa janela corresponde a uma indisponibilidade da secretaria académica.

#### Ano transato
Bloco já válido:
- matrículas CNA: **2026-09-01** a **2026-09-02**
- inscrições em UC: **2026-09-07** a **2026-09-11**

#### Cópia para o ano seguinte
Copiando apenas o ano:
- matrículas CNA: **2027-09-01** a **2027-09-02**
- inscrições em UC: **2027-09-07** a **2027-09-11**

#### Nova restrição que altera o resultado
A data final das inscrições em UC em **2027-09-11** passa a ser inválida, porque cai dentro da nova janela bloqueada.

#### Validação passo a passo
1. **Verificar a janela bloqueada**.
   - 2027-09-10 e 2027-09-11 estão bloqueados.
2. **Verificar o impacto no fim das inscrições em UC**.
   - o fim previsto em **2027-09-11** fica inválido.
3. **Recuar a fase de inscrições para trás no tempo**.
   - mantendo a mesma duração mínima, a fase passa de **2027-09-07 a 2027-09-11** para **2027-09-03 a 2027-09-07**.
4. **Verificar os dias de calendário**.
   - 2027-09-03 = sexta-feira
   - 2027-09-07 = terça-feira
   - o bloco não começa nem termina em fim de semana.
5. **Revalidar a relação com a fase anterior**.
   - matrículas CNA terminam em **2027-09-02**
   - inscrições em UC começam em **2027-09-03**
   - não há sobreposição.

#### Resultado final após a nova restrição
- matrículas CNA: **2027-09-01** a **2027-09-02**
- inscrições em UC: **2027-09-03** a **2027-09-07**

#### Leitura conceptual
Este exemplo mostra uma situação importante: uma fase que já estava correta pode ficar inválida depois de surgir uma nova restrição.

Nesse caso, o sistema não deve tentar manter a data antiga.
Deve recuar a fase afetada, e depois voltar a validar a sua duração e a relação com a fase anterior.

---

## 7. Estratégia de migração

### 7.1 Entrada
O sistema recebe:
- calendário do ano transato;
- lista de eventos e respetivas datas;
- regras globais;
- regras por categoria;
- restrições de período anual.

### 7.2 Transformação
O sistema faz:
1. criar os nós do ano seguinte;
2. copiar relações de dependência;
3. aplicar deslocamento temporal base;
4. validar restrições;
5. corrigir conflitos recuando no tempo;
6. confirmar ou reportar erro.

### 7.3 Saída
O resultado é:
- calendário migrado;
- lista de conflitos resolvidos;
- lista de conflitos não resolvidos;
- registo das alterações automáticas.

---

## 8. Regra de resolução de conflitos

Quando um evento viola uma regra:

### Caso A — conflito resolúvel
O evento pode ser ajustado para trás no tempo até:
- sair de um fim de semana;
- sair de um feriado;
- respeitar o período mínimo;
- respeitar o intervalo entre eventos.

### Caso B — conflito estrutural
Se recuar no tempo fizer o evento colidir com outro bloqueio impossível, o sistema deve:
- marcar o conflito;
- pedir validação humana;
- não assumir uma data inválida.

---

## 9. Exemplo simulado: `candidaturas` e `inscrições`

### 9.1 Nós
- `Candidaturas`
- `Homologação`
- `Publicação`
- `Inscrições`
- `Matrículas normais`
- `Matrículas internacionais`
- `Matrículas pós-graduação`
- `Matrículas CNA`

### 9.2 Dependências
- `Candidaturas -> Homologação`
- `Homologação -> Publicação`
- `Publicação -> Inscrições`
- `Inscrições -> Matrículas`

### 9.3 Regras de exclusão
- `Matrículas normais` não podem sobrepor-se a `Matrículas internacionais`
- `Matrículas normais` não podem sobrepor-se a `Matrículas pós-graduação`
- `Matrículas normais` não podem sobrepor-se a `Matrículas CNA`

### 9.4 Regras temporais
- `Inscrições` têm duração mínima de 5 dias;
- entre `Homologação` e `Publicação` devem existir pelo menos 2 dias úteis;
- início e fim não podem cair em fim de semana ou feriado.

### 9.5 Resultado esperado
O sistema tenta manter a ordem:
1. candidaturas;
2. homologação;
3. publicação;
4. inscrições;
5. matrículas.

Se `publicação` cair num sábado, o sistema recua para sexta-feira útil anterior.
Se isso quebrar a regra dos 2 dias úteis entre `homologação` e `publicação`, o sistema recua mais até satisfazer tudo.

---

## 10. Como isto se traduz no código

O modelo conceptual pode ser implementado em três camadas:

### 10.1 Camada de definição
Lista de regras e tipos de nós.

### 10.2 Camada de validação
Funções puras que verificam:
- feriados;
- fins de semana;
- sobreposições;
- duração mínima;
- dependências.

### 10.3 Camada de migração
Algoritmo que:
- ordena os nós;
- aplica offsets;
- resolve conflitos;
- produz o calendário final.

---

## 11. Modelo mental simples

Podes pensar nisto como:

- **nó** = uma fase do calendário;
- **aresta** = “isto depende daquilo”;
- **restrição** = “isto não pode acontecer aqui”;
- **resolução** = “se falhar, recua no tempo”.

---

## 12. Conclusão

Sim, o teu orientador está a referir-se exatamente a isto: um **grafo de dependências** para transformar regras soltas num sistema ordenável e validável.

Para o teu caso, o melhor é começar por um subconjunto realista:
1. `candidaturas`
2. `homologação`
3. `publicação`
4. `inscrições`
5. `matrículas`

Depois adicionas as restrições de férias, fins de semana, feriados e sobreposições.

Se quiseres, no passo seguinte eu posso transformar este modelo conceptual em:
- **um diagrama textual mais formal**, ou
- **uma estrutura TypeScript** para começares a implementar no projeto.

---

## 13. Dois exemplos reais de aplicação

### Exemplo real 1 — Candidaturas

#### Contexto
Uma instituição define o seguinte fluxo:
- envio do edital pelo júri;
- homologação pelo presidente;
- publicação oficial;
- abertura das candidaturas;
- fecho das candidaturas.

#### Exemplo com datas
Ano transato:
- envio do edital: **2026-06-10**
- homologação: **2026-06-11**
- publicação: **2026-06-16**
- abertura das candidaturas: **2026-06-17**
- fecho das candidaturas: **2026-06-30**

Validação do ano transato (já conforme regras):
- início/fim em dias úteis;
- pelo menos 2 dias úteis entre homologação e publicação (12 e 15 de junho).

Migração para o ano seguinte:
- envio do edital: **2027-06-10**
- homologação: **2027-06-12**
- publicação prevista: **2027-06-14**
- abertura prevista das candidaturas: **2027-06-15**
- fecho previsto das candidaturas: **2027-06-29**

#### Transição passo a passo
1. O sistema tenta copiar o padrão do ano anterior para 2027.
2. A homologação cai em **2027-06-12** (**sábado**), por isso é recuada para **2027-06-11** (**sexta-feira**), porque início/fim não podem cair ao fim de semana.
3. A publicação estava prevista para **2027-06-14** (**segunda-feira**).
4. Mas a regra diz que têm de existir pelo menos **2 dias úteis** entre homologação e publicação.
5. Como **2027-06-12** e **2027-06-13** não contam como dias úteis, a publicação é recuada para **2027-06-16** (**quarta-feira**).
6. A abertura das candidaturas mantém a lógica relativa do processo e passa de **2027-06-15** para **2027-06-17** (**quinta-feira**), porque depende da publicação.

#### Convenção de contagem (importante)
Neste documento, está a ser usada a convenção **estrita**: “2 dias úteis entre A e B” significa contar só os dias úteis **no meio** (excluindo o dia de A e o dia de B).

Com homologação em **2027-06-11** (sexta):
- publicação em **2027-06-14** (segunda) => 0 dias úteis entre;
- publicação em **2027-06-15** (terça) => 1 dia útil entre (segunda);
- publicação em **2027-06-16** (quarta) => 2 dias úteis entre (segunda e terça).

Se a tua instituição usar a convenção “do dia seguinte até ao dia da publicação, inclusive”, então **2027-06-15** pode ser válido.

#### Conflito na migração
O conflito não é “trocar dias sem motivo”; o motivo é este:
- homologação em fim de semana;
- intervalo mínimo de 2 dias úteis entre homologação e publicação.

#### Solução aplicada
O sistema resolve em cadeia:
- homologação: **2027-06-12 → 2027-06-11**;
- publicação: **2027-06-14 → 2027-06-16** (adiada para cumprir 2 dias úteis estritos);
- abertura das candidaturas: **2027-06-15 → 2027-06-17**.

#### Dependências
- o envio do edital tem de acontecer antes da homologação;
- a homologação tem de acontecer antes da publicação;
- a publicação tem de acontecer antes da abertura das candidaturas;
- as candidaturas só podem abrir depois da publicação.

#### Regras aplicáveis
- entre homologação e publicação têm de existir pelo menos **2 dias úteis**;
- início e fim não podem cair em **fim de semana**;
- início e fim não podem cair em **feriado**;
- o período de candidaturas não pode ter duração inferior ao mínimo definido pela instituição.

#### Resultado conceptual
Se a publicação cair num domingo, o sistema recua para sexta-feira.
Se isso violar a regra dos 2 dias úteis entre homologação e publicação, o sistema recua mais um dia útil até encontrar uma posição válida.

---

### Exemplo real 2 — Matrículas e inscrições

#### Contexto
Depois das candidaturas, a instituição abre várias fases de matrícula e inscrição:
- matrículas normais;
- matrículas de estudantes internacionais;
- matrículas de pós-graduação;
- matrículas por ingresso CNA;
- inscrições em UC.

#### Exemplo com datas
Ano transato:
- matrículas normais: **2026-09-01** a **2026-09-03**
- matrículas internacionais: **2026-09-04** a **2026-09-08**
- matrículas pós-graduação: **2026-09-09** a **2026-09-11**
- matrículas CNA: **2026-09-14** a **2026-09-16**
- inscrições em UC: **2026-09-17** a **2026-09-23**

Validação do ano transato (já conforme regras):
- blocos sem sobreposição entre categorias exclusivas;
- início/fim dos blocos em dias úteis;
- inscrições UC com duração mínima >= 5 dias corridos.

Migração para o ano seguinte:
- matrículas normais previstas: **2027-09-02** a **2027-09-06**
- matrículas internacionais previstas: **2027-09-05** a **2027-09-09**
- matrículas pós-graduação previstas: **2027-09-08** a **2027-09-11**
- matrículas CNA previstas: **2027-09-11** a **2027-09-14**
- inscrições em UC previstas: **2027-09-15** a **2027-09-19**

#### Transição passo a passo
1. As matrículas normais ficam em **2027-09-02 a 2027-09-06**.
2. As matrículas internacionais estavam previstas para **2027-09-05 a 2027-09-09**.
3. Isso gera conflito porque **05/09** e **06/09** sobrepõem-se com as matrículas normais.
4. Para eliminar a sobreposição, o bloco internacional recua/anda para **2027-09-07 a 2027-09-10**.
5. Mas agora este bloco colide com a fase seguinte: as matrículas de pós-graduação, previstas para **2027-09-08 a 2027-09-11**.
6. Então a pós-graduação é movida para **2027-09-11 a 2027-09-14**.
7. Isso faz a fase CNA, prevista para **2027-09-11 a 2027-09-14**, colidir com a pós-graduação.
8. A fase CNA passa então para **2027-09-15 a 2027-09-18**.
9. As inscrições em UC não podem começar enquanto ainda houver um bloco de matrícula ativo, por isso sobem para **2027-09-19 a 2027-09-23**.

#### Conflito na migração
Os dias mudam por causa de conflitos reais:
- sobreposição entre blocos de matrícula;
- exclusividade entre categorias;
- necessidade de manter as inscrições em UC depois do último bloco.

#### Solução aplicada
O sistema aplica uma correção em cadeia:
- matrículas internacionais: **05-09 → 07-10**;
- pós-graduação: **08-11 → 11-14**;
- CNA: **11-14 → 15-18**;
- inscrições em UC: **15-19 → 19-23**.

Assim fica claro que não se está a mover dias “sem razão”: cada deslocação resolve um bloqueio concreto.

#### Dependências
- as matrículas só podem começar depois do fecho/publicação do processo de candidatura;
- as inscrições em UC só podem abrir depois de a matrícula base estar disponível;
- os diferentes tipos de matrícula não podem ocorrer em simultâneo se a regra institucional os tornar exclusivos.

#### Regras aplicáveis
- a fase de inscrições em UC deve durar pelo menos **5 dias**;
- os tipos de matrícula não podem sobrepor-se entre si se pertencerem ao mesmo bloco exclusivo;
- início e fim não podem cair em fins de semana ou feriados;
- se houver tolerância de férias, a fase tem de ser empurrada para fora desse intervalo.

#### Resultado conceptual
Se as matrículas normais estiverem marcadas para um período que colide com as matrículas internacionais, o sistema deve tratar isso como conflito estrutural.
Nesse caso, o recuo no tempo só é válido se ainda respeitar a relação com a candidatura e as regras de duração mínima.


