# Sincronização dos dados do portal

O navegador e a PWA usam o mesmo fluxo de dados. `lib/store.ts` mantém apenas
dados em memória; snapshots antigos de `sessionStorage` são descartados.
A entrada em uma rota aguarda uma leitura atual da sessão e dos dados básicos.

## Alterações e telas abertas

- A API observa as coleções do MongoDB com um change stream por instância e
  disponibiliza `/api/v1/sync/stream` autenticado por Bearer no cabeçalho.
- O canal envia somente recursos invalidados e revisões. Os registros continuam
  sendo lidos pelos endpoints existentes, com suas permissões.
- `usePortalSync` agrupa avisos, atualiza os recursos compartilhados e publica
  suas revisões. Reconexão, foco, retorno do app e reconexão da internet validam
  novamente os dados. O canal tem heartbeat e reconexão automática.
- Cada consumidor deve assinar `usePortalRevision` para seus recursos. Consultas
  específicas da página devem ser refeitas quando a revisão muda. Um getter do
  store, sozinho, não assina atualizações.
- Resultados de consultas são separados de formulários em edição. Atualizações
  de servidor não devem desmontar o editor nem inicializar novamente seu rascunho.

## Concorrência

Leituras aguardam escritas locais pendentes. Uma resposta iniciada antes de uma
invalidação é descartada e consultada novamente. Paginação e carregamentos em
lote também verificam a revisão, evitando misturar páginas de versões diferentes.
Respostas de uma sessão anterior não podem preencher ou encerrar a sessão atual.
Falhas transitórias mantêm o recurso pendente para uma nova leitura; não se
convertem em listas vazias ou perfis incompletos.

O banco é a fonte dos dados. Durante uma interrupção de rede não é possível
confirmar novas alterações; ao restabelecer a conexão, o handshake obriga uma
nova leitura completa, incluindo alterações perdidas durante a interrupção.

## Manutenção e validação

Ao adicionar uma coleção, atualizar o mapeamento de recursos em `SyncService`
na API e suas dependências em `lib/portal-data.ts`. Ao adicionar uma tela,
assinar os recursos usados, inclusive detalhes abertos e listas de opções.

Testes focados: `portal-live-sync.spec.ts`, `portal-request-consistency.spec.ts`,
`profile-session-hydration.spec.ts` e `portal-loading-recovery.spec.ts`.
Na API, `test/sync.e2e-spec.ts` usa um replica set temporário, verifica autenticação,
entrega para dois clientes, exclusão e reconexão. `/api/v1/health` informa
`liveSync` para verificar se o cursor do banco está conectado em produção.
