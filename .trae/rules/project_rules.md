### Requisitos funcionais:

1. **Página inicial (`/`)**
   - Botão "Criar Sala"
   - Ao clicar, abrir um modal para o usuário inserir:
     - Nome da sala
     - Nome do usuário
     - Papel: Participante ou Espectador
   - Após confirmar, redirecionar para `/room/[roomId]`, onde `[roomId]` é um identificador único simples (como `abc123`).

2. **Página da sala (`/room/[roomId]`)**
   - Mostrar nome da sala e nome dos usuários conectados (socket.io)
   - Lista de "issues" (tarefas) — cada uma é uma rodada de votação
     - Participantes podem **criar, editar e excluir** issues
   - Sistema de votação secreta:
     - Participantes votam de forma oculta (valores de 1 a 5)
     - Quando todos os participantes tiverem votado, os votos são revelados
     - Só é possível passar para a próxima issue quando todos tiverem votado com o **mesmo valor**
   - Botão de “Próxima rodada” (ativa apenas se todos os votos forem iguais)
   - Botão de “Exportar” resultados das rodadas (JSON ou CSV)

3. **Regras de funcionamento:**
   - Nenhum dado deve ser persistido em banco
   - Toda comunicação entre usuários deve acontecer via WebSocket (Socket.IO)
   - Armazenamento temporário permitido via localStorage para dados do usuário (nome, papel, etc)
   - O "host" da sala (criador) atua como organizador, mas sem lógica de moderação

### Tecnologias:

- Framework: **Next.js (App Router)**
- Estilo: **TailwindCSS** (para layout moderno e responsivo)
- Comunicação em tempo real: **Socket.IO**
- Armazenamento local: `localStorage`
- Exportação: `FileSaver.js` ou apenas download direto via `Blob`

### Extras:

- Interfaces devem ser modernas, simples e responsivas
- O código deve estar bem organizado, com componentes reutilizáveis
- Preferência por hooks simples (`useState`, `useEffect`, `useContext`)
- Não utilizar banco de dados, ORM ou autenticação de terceiros

Crie a estrutura inicial completa do projeto com rotas, socket server e exemplos de componentes.