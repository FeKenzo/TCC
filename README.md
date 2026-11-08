# ChargeSense Mobile

Aplicativo Android desenvolvido como protótipo do TCC para acompanhar as grandezas elétricas de uma estação de recarga. A tela mostra **corrente, tensão, potência ativa e temperatura**, além de um histórico de leituras.

## O que o aplicativo faz

- Mostra a leitura mais recente de cada grandeza.
- Permite cadastrar uma leitura manualmente.
- Tem um botão **Simulação** que cria uma leitura imediatamente e outra a cada 5 segundos. O botão **Parar simulação** interrompe a geração.
- Salva as leituras em um banco SQLite no próprio aparelho.
- Mostra os horários no fuso de Brasília (`America/Sao_Paulo`).

Os valores da simulação são exemplos para testar a interface. **O aplicativo ainda não recebe dados de sensores ou de um servidor.** A simulação funciona enquanto a tela do app está aberta.

## Tecnologias

React Native, Expo, TypeScript e SQLite (`expo-sqlite`). O projeto Android fica na pasta [`chargesense-mobile/android`](chargesense-mobile/android).

## Como testar no emulador Android

Instale Node.js 22, Android Studio com o Android SDK e JDK 21. Crie e inicie um celular virtual pelo **Device Manager** do Android Studio.

No terminal, a partir da raiz deste repositório:

```powershell
cd chargesense-mobile
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm ci
npm run android
```

O comando compila o aplicativo, instala no emulador e inicia o Metro. Mantenha o terminal aberto durante o teste.

Se o Windows reclamar de **caminho muito longo**, execute `preparar-android-studio.bat` dentro de `chargesense-mobile`. Depois abra `R:\chargesense-mobile` no VS Code e, nessa pasta, configure `ANDROID_HOME` como acima antes de executar `npm ci` e `npm run android`. O script usa `R:` como unidade temporária; se ela já estiver ocupada, altere a letra no script.

Para abrir o projeto nativo no Android Studio, use **File > Open** e selecione `chargesense-mobile/android` (ou `R:\chargesense-mobile\android` quando usar a unidade curta).

## Estrutura principal

| Caminho | Conteúdo |
| --- | --- |
| [`chargesense-mobile/src/App.tsx`](chargesense-mobile/src/App.tsx) | Tela, formulário, simulação e histórico |
| [`chargesense-mobile/src/data/readings.ts`](chargesense-mobile/src/data/readings.ts) | Criação do banco e consultas SQLite |
| [`chargesense-mobile/README.md`](chargesense-mobile/README.md) | Instruções do aplicativo |

Para verificar o TypeScript sem abrir o emulador:

```powershell
cd chargesense-mobile
npm run typecheck
```
