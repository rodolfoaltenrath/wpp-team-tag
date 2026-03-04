# Politica de Privacidade - WPP Team Tag

Ultima atualizacao: 3 de marco de 2026

## Resumo

O WPP Team Tag processa dados localmente no navegador para prefixar mensagens enviadas pelo usuario no WhatsApp Web com o nome do perfil selecionado.

## Quais dados a extensao utiliza

- nomes configurados pelo usuario para os 3 perfis da extensao
- perfil atualmente selecionado
- texto digitado pelo usuario no composer do WhatsApp Web, apenas no momento do envio
- contexto do chat ativo no WhatsApp Web, apenas para enviar a mensagem prefixada corretamente

## Como esses dados sao usados

- os nomes dos perfis e o perfil selecionado sao armazenados em `chrome.storage.local`
- o texto digitado e processado localmente para montar a mensagem final no formato `*Nome:*\nMensagem`
- a extensao aciona o proprio WhatsApp Web para enviar a mensagem ja prefixada usando a sessao autenticada do usuario

## O que a extensao nao faz

- nao envia dados para servidores do desenvolvedor
- nao usa analytics
- nao vende dados
- nao compartilha informacoes com terceiros para publicidade
- nao funciona fora de `https://web.whatsapp.com/*`

## Compartilhamento com terceiros

O envio da mensagem acontece dentro do proprio WhatsApp Web. Portanto, quando o usuario confirma o envio, a mensagem segue o fluxo normal do WhatsApp/Meta, conforme os termos e politicas desses servicos.

## Retencao

- os nomes dos perfis permanecem salvos localmente no navegador ate que o usuario os altere ou remova a extensao
- o texto da mensagem nao e armazenado pela extensao apos o envio

## Permissoes utilizadas

- `storage`: salvar os nomes dos 3 perfis e o perfil selecionado
- `https://web.whatsapp.com/*`: limitar a extensao ao dominio onde a funcionalidade e necessaria

## Contato

Para duvidas sobre suporte ou privacidade, utilize o contato informado na pagina publica da extensao na Chrome Web Store.
