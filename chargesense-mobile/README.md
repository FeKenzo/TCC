# ChargeSense Mobile

Protótipo do TCC para mostrar corrente, tensão, potência ativa e temperatura de uma estação de recarga. As leituras ficam salvas no SQLite do próprio celular.

## Rodar pelo VS Code

É preciso ter Node.js 22, o SDK Android e um celular com depuração USB ativada ou um emulador funcionando. Execute `preparar-android-studio.bat` e abra `R:\chargesense-mobile` no VS Code. A unidade curta evita um erro de caminho longo do compilador Android nesta pasta do OneDrive.

No terminal:

```powershell
npm ci
npm run android
```

Para conferir o código sem abrir o aplicativo:

```powershell
npm run typecheck
```

## Onde está cada parte

- `src/App.tsx`: tela, formulário e histórico.
- `src/data/readings.ts`: criação do banco e funções para salvar e consultar leituras.
- `android/`: projeto Android gerado pelo Expo.

Na primeira abertura, o banco recebe quatro leituras de exemplo. O botão **Adicionar leitura** permite digitar outros valores. O botão **Simulação** gera uma leitura imediatamente e outra a cada 5 segundos; **Parar simulação** interrompe a geração. Essas leituras também são salvas no SQLite e aparecem no histórico. A simulação funciona enquanto a tela do aplicativo está aberta. Ainda não há conexão com sensores ou servidor.

As datas são salvas em UTC no banco e exibidas na tela no horário de Brasília (`America/Sao_Paulo`).

## Se quiser abrir no Android Studio

Abra `R:\chargesense-mobile\android` em **File > Open**. Mantenha a unidade `R:` enquanto estiver trabalhando. Depois, pode removê-la com `subst R: /D`.
