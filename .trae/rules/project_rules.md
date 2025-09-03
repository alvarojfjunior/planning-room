### Requisitos funcionais:

1. **Página inicial (`/`)**
   - Botão "Criar Sala"
   - Ao clicar, abrir um modal para o usuário inserir:
     - Avatar (avatar aleatório como padrão, mas o usuário pode alterar) utilizando a biblioteca DiceBear.
     - Nome da sala
     - Nome do usuário
     - Papel: Participante ou Espectador
   - Após confirmar, redirecionar para `/room/[roomId]`, onde `[roomId]` é um identificador único simples (como `abc123`).
   - O usuário que criar a sala é o host, os demais são convidados;
   - Caso o host saia da sala, a sala é excluída;
   - Convidados podem entrar na sala via link, porem o host deve aceitar em tempo real;

2. **Página da sala (`/room/[roomId]`)**
   - Mostrar nome da sala e nome dos usuários conectados (ably)
   - O layout desta página deve ser igual uma mesa de jogo de poker, A UI deve ser interativa e moderna com uma mesa central e uma cadeira para cada usuário na sala. Está tela é dinamica. A votação deve se parecer com uma partida de poker;
   - Lista de "issues" (tarefas) — cada uma é uma rodada de votação
     - Host pode **criar, editar e excluir** issues, e escolher qual issue é a atual (current).
     - Os demais usuário (convidados), apenas veem a issue atual e votam;
   - Sistema de votação secreta:
     - Participantes votam de forma oculta (valores de 1 a 5)
     - Quando todos os participantes tiverem votado, os votos são revelados (Animação mostrando o voto que cada usuácio colocou (revelar as cartas))
     - Todos os usuários (host e convidados) podem ver os votos de todos os outros usuários após todos votarem;
     - Quando todos os votos forem iguais, o host pode passar para a próxima issue;
     - A ediçao fica aberta (podendo alterar) até que todos concordem em um unico voto. 
   - Botão de “Próxima rodada” (ativa apenas se todos os votos forem iguais)
   - O botão de proxima deve salvar o resultado numero da issue finalizada;
   - Botão de “Exportar” resultados das rodadas (JSON ou CSV)

3. **Regras de funcionamento:**
   - Nenhum dado deve ser persistido em banco
   - Toda comunicação entre usuários deve acontecer via ably
   - O "host" da sala (criador) atua como organizador

### Tecnologias:

- Framework: **Next.js (App Router)**
- Estilo: **TailwindCSS** (para layout moderno e responsivo)
- Comunicação em tempo real: **ably**
- Armazenamento local: `localStorage`
- Exportação: `planning-poker-export.xls` (excel)

### Extras:
- O app tem animações, tem a UI moderna, e icones modernos;
- O app tem um backend que controla as sessoes;
- O idioma do app é o ingles;
- O app segue os principios de clean code SOLID;
- O app segue os principios de clean architecture;
- O app é responsivo;
- O app é mobile first;
- O app é acessível;
- O app é otimizado para performance;
- O app é otimizado para carregamento;
- O app é otimizado para SEO;
- Interfaces devem ser modernas, simples e responsivas
- O código deve estar bem organizado, com componentes reutilizáveis
- Preferência por hooks simples (`useState`, `useEffect`, `useContext`)
- Não utilizar banco de dados, ORM ou autenticação de terceiros