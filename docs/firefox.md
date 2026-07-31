# Firefox

## Compatibilidade

A extensão usa Manifest V3, scripts no contexto `MAIN` e a declaração atual de privacidade do
Firefox. Por isso, o build declara Firefox 140 ou mais recente e também funciona na linha ESR 140.
O mesmo código e comportamento do Chrome são usados nos dois navegadores.

O manifesto declara o ID estável `wpp-team-tag@altenrath.dev`. Também declara o nome do perfil
e a mensagem como dados necessários, pois eles são enviados ao próprio WhatsApp quando o usuário
confirma o envio. Nenhum desses dados é enviado ao desenvolvedor.

## Teste local

Gere e valide o build:

```powershell
npm.cmd run build:firefox
```

Depois:

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em `Carregar extensão temporária`.
3. Selecione `dist-firefox/manifest.json`.
4. Abra `https://web.whatsapp.com/`.

Também é possível iniciar um perfil temporário automaticamente:

```powershell
npm.cmd run run:firefox
```

## Pacote para submissão

```powershell
npm.cmd run package:firefox
```

O ZIP é criado em `release/firefox`. Ele serve para validação e submissão, mas não pode ser
instalado permanentemente no Firefox comum sem a assinatura da Mozilla.

## XPI para instalação permanente

Crie uma conta no portal de desenvolvedores da Mozilla e gere as credenciais da API. No
PowerShell, defina-as apenas na sessão atual:

```powershell
$env:WEB_EXT_API_KEY = "sua-chave-JWT"
$env:WEB_EXT_API_SECRET = "seu-segredo-JWT"
npm.cmd run sign:firefox
```

O comando envia o pacote para assinatura no canal não listado e baixa o XPI assinado em
`release/firefox`. Esse XPI pode ser aberto diretamente no Firefox e instalado sem modo de
desenvolvedor.

Não salve as credenciais da Mozilla no repositório.
