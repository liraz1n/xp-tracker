# Dados de XP por Cripta

Base de coleta para montar tabelas oficiais de cripta no XP Tracker.

Na build 1.3.0, os dados de cripta passaram a suportar faixas de nível do jogador. Os valores atuais da Cripta Nível 1 foram cadastrados como base conhecida para jogadores de nível 28 ou superior. A faixa de nível 22 a 27 ficará preparada para receber os próximos valores coletados.

Na build 1.3.1, a calculadora completa e o plano sugerido foram ocultados temporariamente no site. O fluxo principal ficou focado no registro rápido de runs, com botão de desfazer último progresso e campo de XP atual do usuário nas configurações.

Na build 1.3.2, o layout mobile recebeu seções recolhíveis para estimativas, marcos do farm e histórico inteligente. O desktop permanece com esses blocos abertos.

Na build 1.3.3, a aba Masmorras recebeu ordem fixa e seletor de 4 ou 5 jogadores no registro rápido.

| Cripta | Trecho / marco derrotado | XP acumulado | Status | Observação | Registrado em |
| --- | --- | ---: | --- | --- | --- |
| Nível 1 | Até derrotar o nível 29, 4 jogadores | 49.859 | Confirmado | Base conhecida para jogador nível 28+. | 2026-05-27 |
| Nível 1 | Até derrotar o nível 30, 4 jogadores | 53.942 | Confirmado | Base conhecida para jogador nível 28+. | 2026-05-27 |
| Nível 3 | Até derrotar o nível 7 | 18.832 | Parcial | Primeiro dado informado para iniciar a tabela da Cripta 3. | 2026-05-26 |
| Nível 3 | Até derrotar o nível 9 | 26.065 | Parcial | Progresso acumulado informado após derrotar o nível 9. | 2026-05-26 |
| Nível 3 | Até derrotar o nível 10 | 30.065 | Parcial | Progresso acumulado informado após derrotar o nível 10. | 2026-05-26 |
| Nível 3 | Até derrotar o nível 11 | 34.346 | Parcial | Progresso acumulado informado após derrotar o nível 11. | 2026-05-26 |
| Nível 3 | Até derrotar o nível 12 | 38.926 | Parcial | Progresso acumulado informado após derrotar o nível 12. | 2026-05-26 |

## Análise inicial da Cripta Nível 3

Os dados parecem ser acumulados até o marco derrotado. A partir do nível 9, o ganho incremental de XP cresce a cada novo nível, então a curva não parece fixa/linear.

| Intervalo conhecido | XP adicional | Leitura inicial |
| --- | ---: | --- |
| Nível 7 até nível 9 | 7.233 | Faltam os dados isolados do nível 8 e do nível 9 para separar esse salto. |
| Nível 9 até nível 10 | 4.000 | Primeiro salto isolado confirmado. |
| Nível 10 até nível 11 | 4.281 | O XP subiu 281 em relação ao salto anterior. |
| Nível 11 até nível 12 | 4.580 | O XP subiu 299 em relação ao salto anterior. |

Padrão provisório: depois do nível 9, cada nível está adicionando cerca de 280 a 300 XP a mais que o nível anterior. Ainda não dá para confirmar uma fórmula oficial, mas a tendência é progressiva.

Gold: não será usado na tabela porque o valor é irregular e não entra no cálculo principal do XP Tracker.

## Próximos dados desejados

- Cripta Nível 3: XP até derrotar o nível 8.
- Cripta Nível 3: XP até outros marcos derrotados.
- Cripta Nível 3: confirmação se o valor muda por jogador, grupo, bônus ou evento.
- Cripta Nível 1: dados para 5 jogadores dos níveis 27, 28, 29 e 30.
