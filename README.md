# email-unigran-notas

Este script monitora as alterações na tabela de notas da UNIGRAN e envia uma notificação por e-mail sempre que uma mudança é detectada.

## Funcionalidades

- Acesso automático ao portal da UNIGRAN.
- Monitoramento de mudanças na tabela de notas.
- Envio de e-mails automáticos com capturas de tela quando mudanças são detectadas.

## Pré-requisitos

Antes de começar, certifique-se de ter o Node.js instalado em sua máquina. Além disso, você precisará das credenciais de acesso ao portal e das configurações de e-mail.

### Enviando E-mails com Resend

Para o envio de e-mails, este projeto utiliza o serviço [Resend](https://resend.com). Resend facilita o envio de e-mails transacionais e fornece uma API robusta para integração com aplicativos.

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/nsrau/email-unigran-notas.git
cd email-unigran-notas
npm install
```

## Configuração

Antes de executar o script, é necessário configurar as variáveis de ambiente para o remetente e o destinatário do e-mail.

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
UNIGRAN_USERNAME=seu_usuario_aqui
UNIGRAN_PASSWORD=sua_senha_aqui
EMAIL_SENDER=seuemail@dominio.com
EMAIL_TO=emaildestinatario@dominio.com
RESEND_API_KEY=sua_api_key_aqui
```

Você deve substituir seu_usuario_aqui, sua_senha_aqui, seuemail@dominio.com, emaildestinatario@dominio.com e sua_api_key_aqui com os valores reais que você pretende usar no seu projeto. O valor de DEBUG também deve ser substituído por true ou false dependendo se você quiser ver ou não
o browser.

## Uso

Para iniciar o monitoramento e o envio de e-mails, execute:
```bash
npm start
```

