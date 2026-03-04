# Guia de Submissao - Chrome Web Store

Este projeto ja deixa prontos os artefatos tecnicos principais para a publicacao.

## Arquivos prontos

- pacote para upload: `release/wpp-team-tag-0.1.0.zip`
- icone da extensao 128x128: `public/icons/icon128.png`
- small promo tile 440x280: `store-assets/chrome-web-store/small-promo-tile.png`
- politica de privacidade: `PRIVACY.md`

## O que ainda precisa ser feito manualmente

- capturar pelo menos 1 screenshot real da extensao em uso
- publicar a politica de privacidade em uma URL publica
- criar ou usar uma conta de desenvolvedor da Chrome Web Store

## Sugestao de textos para a listagem

### Nome

`WPP Team Tag`

### Resumo curto

`Prefixe mensagens do WhatsApp Web com o nome do atendente selecionado.`

### Descricao detalhada

`O WPP Team Tag facilita o trabalho de equipes que respondem clientes pelo WhatsApp Web. A extensao permite cadastrar 3 perfis de atendimento, selecionar o perfil ativo no popup e enviar mensagens ja prefixadas automaticamente no formato *Nome:* seguido do texto digitado.`

`A extensao funciona somente no WhatsApp Web, intercepta envio por Enter e por clique no botao de envio, evita duplicar prefixos e salva os nomes configurados localmente no navegador.`

`Nao ha login, senha ou sincronizacao externa. Todo o armazenamento de configuracao e feito com chrome.storage.local no proprio navegador do usuario.`

### Single purpose

`Adicionar automaticamente o nome do atendente no inicio das mensagens enviadas pelo usuario no WhatsApp Web.`

## Instrucoes sugeridas para o revisor

1. Abrir `https://web.whatsapp.com/` ja autenticado
2. Abrir o popup da extensao
3. Editar ou manter os 3 nomes disponiveis
4. Selecionar um dos perfis no dropdown
5. Digitar uma mensagem em qualquer conversa
6. Enviar com `Enter` ou clicando no botao enviar
7. Confirmar que a mensagem enviada sai no formato `*Nome:*` em uma linha e o conteudo da mensagem na linha seguinte

## Declaracoes de privacidade

Interpretacao conservadora baseada na documentacao oficial da Chrome Web Store:

- a extensao processa localmente texto digitado pelo usuario no WhatsApp Web para executar sua funcionalidade principal
- a extensao armazena localmente apenas os 3 nomes configurados e o perfil selecionado
- a extensao nao envia dados para servidores do desenvolvedor
- a extensao nao usa dados para publicidade
- a extensao nao vende dados
- a extensao nao usa dados para credit scoring

Ao preencher a aba de privacidade, revise a redacao exibida pelo dashboard no momento da submissao. A interface da loja pode mudar.

## Screenshots recomendados

Sugestao de 2 capturas reais para a loja:

1. popup aberto mostrando os 3 campos de nomes e o dropdown de perfil
2. conversa do WhatsApp Web com a mensagem enviada no formato `*Nome:*` e o texto na linha seguinte

## Publicacao da politica de privacidade

Se o repositorio estiver publico, voce pode usar a URL publica do arquivo `PRIVACY.md` no GitHub. Outra opcao e publicar o mesmo texto em GitHub Pages ou em um site institucional.

## Fontes oficiais

- publicacao na Chrome Web Store: https://developer.chrome.com/docs/webstore/publish/
- distribuicao de extensoes: https://developer.chrome.com/docs/extensions/how-to/distribute
- metodos alternativos de instalacao: https://developer.chrome.com/docs/extensions/how-to/distribute/install-extensions
- boas praticas de listagem e assets: https://developer.chrome.com/blog/new-extension-listing-features
