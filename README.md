# WPP Team Tag

Extensao para Chrome e Firefox que prefixa mensagens do WhatsApp Web com o nome do perfil selecionado.

Exemplo de saida:

```text
_*Ana:*_
Ola, como posso ajudar?
```

## Funcionalidades

- Seleciona 1 entre 3 perfis no popup da extensao
- Permite editar os 3 nomes e salvar tudo em `chrome.storage.local`
- Intercepta envio por `Enter` e por clique no botao enviar
- Evita duplicar prefixo quando a mensagem ja comeca com um perfil conhecido
- Preserva o fluxo nativo de respostas e anexos do WhatsApp
- Funciona apenas em `https://web.whatsapp.com/*`

## Stack

- TypeScript
- Vue 3
- Vite
- CRXJS
- Manifest V3
- `@wppconnect/wa-js` para enviar o texto sem alterar o editor interno do WhatsApp

## Scripts

```bash
npm install
npm run dev
npm test
npm run build
npm run assets
npm run package
npm run package:firefox
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

No Firefox 140 ou mais recente:

1. Rode `npm run build:firefox`
2. Abra `about:debugging#/runtime/this-firefox`
3. Clique em `Carregar extensão temporária`
4. Selecione `dist-firefox/manifest.json`
5. Abra `https://web.whatsapp.com/`

Também é possível abrir um perfil temporário automaticamente com:

```bash
npm run run:firefox
```

## Empacotamento

Para gerar o zip pronto para submissao na Chrome Web Store:

```bash
npm run package
```

Arquivos gerados:

- pacote da extensao: `release/wpp-team-tag-<version>.zip`
- pacote Firefox para validação ou envio à Mozilla: `release/firefox/*.zip`
- icone 128x128: `public/icons/icon128.png`
- small promo tile: `store-assets/chrome-web-store/small-promo-tile.png`

O Firefox comum exige que o pacote seja assinado pela Mozilla para instalação permanente.
Consulte [docs/firefox.md](docs/firefox.md) para gerar o XPI assinado.

## Publicacao na Chrome Web Store

Os arquivos e textos de apoio para a publicacao estao aqui:

- guia de submissao: [docs/chrome-web-store.md](docs/chrome-web-store.md)
- politica de privacidade: [PRIVACY.md](PRIVACY.md)

Antes de subir para a loja, ainda falta capturar pelo menos 1 screenshot real da extensao em uso. O resto da base para submissao ja esta preparado no repositorio.
