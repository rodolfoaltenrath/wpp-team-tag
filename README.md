# WPP Team Tag

Extensao para Chromium que prefixa mensagens do WhatsApp Web com o nome do perfil selecionado.

Exemplo de saida:

```text
*Ana:*
Ola, como posso ajudar?
```

## Funcionalidades

- Seleciona 1 entre 3 perfis no popup da extensao
- Permite editar os 3 nomes e salvar tudo em `chrome.storage.local`
- Intercepta envio por `Enter` e por clique no botao enviar
- Evita duplicar prefixo quando a mensagem ja comeca com um perfil conhecido
- Funciona apenas em `https://web.whatsapp.com/*`

## Stack

- TypeScript
- Vue 3
- Vite
- CRXJS
- Manifest V3
- `@wppconnect/wa-js` para envio estavel no contexto da pagina

## Scripts

```bash
npm install
npm run dev
npm run build
npm run assets
npm run package
```

## Desenvolvimento local

1. Rode `npm install`
2. Rode `npm run build`
3. Abra `chrome://extensions`
4. Ative `Modo do desenvolvedor`
5. Clique em `Carregar sem compactacao`
6. Selecione a pasta `dist`
7. Abra `https://web.whatsapp.com/`
8. Escolha o perfil no popup e teste o envio

## Empacotamento

Para gerar o zip pronto para submissao na Chrome Web Store:

```bash
npm run package
```

Arquivos gerados:

- pacote da extensao: `release/wpp-team-tag-<version>.zip`
- icone 128x128: `public/icons/icon128.png`
- small promo tile: `store-assets/chrome-web-store/small-promo-tile.png`

## Publicacao na Chrome Web Store

Os arquivos e textos de apoio para a publicacao estao aqui:

- guia de submissao: [docs/chrome-web-store.md](docs/chrome-web-store.md)
- politica de privacidade: [PRIVACY.md](PRIVACY.md)

Antes de subir para a loja, ainda falta capturar pelo menos 1 screenshot real da extensao em uso. O resto da base para submissao ja esta preparado no repositorio.
