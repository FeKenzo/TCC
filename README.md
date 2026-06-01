<div align="center">

<br/>

# 👁️ DriveSafe
### Sistema de Detecção de Sonolência ao Volante

<br/>

![Status](https://img.shields.io/badge/status-funcional-brightgreen?style=for-the-badge)
![Tecnologia](https://img.shields.io/badge/tecnologia-Web%20%2F%20IA-blue?style=for-the-badge)
![Licença](https://img.shields.io/badge/licença-MIT-orange?style=for-the-badge)

<br/>

> **Projeto Interdisciplinar** — Engenharia de Computação · 8º Semestre  
> Disciplinas: Gestão de Projetos & Engenharia de Software

<br/>

---

</div>

## 📌 Sobre o Projeto

O **DriveSafe** é um sistema web de detecção de sonolência ao volante que utiliza **visão computacional** e **inteligência artificial** para monitorar em tempo real o estado de alerta do motorista por meio da câmera do dispositivo.

Ao identificar sinais de cansaço — olhos fechados por tempo prolongado ou bocejos — o sistema dispara imediatamente um **alarme sonoro** e um **alerta visual intenso** na tela, alertando o motorista antes que um acidente ocorra.

O projeto roda **100% no navegador**, sem necessidade de instalação de softwares adicionais.

<br/>

---

## 🎯 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| 📷 **Captura em tempo real** | Acessa a webcam do dispositivo diretamente pelo navegador |
| 🧠 **Detecção facial com IA** | Mapeia 468 pontos do rosto usando MediaPipe FaceMesh |
| 👁️ **Cálculo de EAR** | Mede a abertura dos olhos frame a frame *(Eye Aspect Ratio)* |
| 👄 **Cálculo de MAR** | Detecta bocejos pela abertura da boca *(Mouth Aspect Ratio)* |
| 🔴 **Flash de alerta** | Tela pisca em branco e vermelho durante estado de perigo |
| 🔊 **Alarme sonoro** | Tom agressivo gerado via Web Audio API, sem arquivos externos |
| 📊 **Painel de métricas** | Exibe EAR, MAR e nível de alerta em barras de progresso ao vivo |
| 📋 **Log de eventos** | Registro com timestamp de todos os eventos detectados |
| 🎥 **Seletor de câmera** | Permite escolher entre múltiplas câmeras conectadas ao PC |

<br/>

---

## 🧪 Como Funciona — A Ciência por Trás

### Eye Aspect Ratio (EAR)

O EAR é uma métrica que calcula a proporção entre a altura e a largura do olho com base nos landmarks faciais. Quando o olho está aberto, o valor é alto (~0.30). Quando fechado, cai para próximo de zero.

```
       P2   P3
        *   *
P1 *           * P4
        *   *
       P5   P6

EAR = (‖P2−P6‖ + ‖P3−P5‖) / (2 × ‖P1−P4‖)
```

O alerta é disparado quando o EAR fica **abaixo de 0.17** por mais de **~1.6 segundos contínuos**.

### Mouth Aspect Ratio (MAR)

De forma análoga ao EAR, o MAR mede a abertura da boca. Valores acima de **0.65** por mais de **~1.7 segundos** indicam bocejo e ativam o alerta de cansaço.

<br/>

---

## 🚀 Como Usar

### ▶ Opção 1 — Acesso direto online *(recomendado)*

Acesse o link do projeto hospedado no GitHub Pages — nenhuma instalação necessária:

```
https://seu-usuario.github.io/drivesafe/
```

1. Abra o link no **Google Chrome** ou **Microsoft Edge**
2. Clique em **"Iniciar Monitoramento"**
3. Permita o acesso à câmera quando solicitado
4. Selecione a câmera desejada no painel lateral
5. Posicione o rosto na frente da câmera e o sistema começa automaticamente

<br/>

### ▶ Opção 2 — Rodar localmente

```bash
# Clone ou baixe o repositório
git clone https://github.com/seu-usuario/drivesafe.git
cd drivesafe

# Inicie um servidor local com Python
python -m http.server 8080

# Acesse no navegador
# http://localhost:8080/index.html
```

<br/>

---

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Papel no Projeto |
|---|---|
| **HTML5 / CSS3 / JavaScript** | Interface e lógica da aplicação |
| **MediaPipe FaceMesh** | Detecção e mapeamento de 468 landmarks faciais |
| **Web Audio API** | Geração do alarme sonoro sem arquivos externos |
| **Canvas API** | Renderização dos contornos faciais sobre o vídeo |
| **MediaDevices API** | Acesso à câmera do navegador |

> Nenhuma biblioteca de UI ou framework JavaScript foi utilizado. O projeto é 100% vanilla.

<br/>

---

## 📐 Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────┐
│                    NAVEGADOR (Chrome/Edge)            │
│                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐  │
│  │  Câmera  │───▶│  MediaPipe   │───▶│  Motor de  │  │
│  │  (getUserMedia) │  FaceMesh  │    │  Detecção  │  │
│  └──────────┘    │  468 pts     │    │  EAR / MAR │  │
│                  └──────────────┘    └─────┬──────┘  │
│                                            │          │
│                         ┌──────────────────┤          │
│                         ▼                  ▼          │
│                  ┌─────────────┐   ┌──────────────┐  │
│                  │ Flash Visual │   │ Alarme Sonoro│  │
│                  │ (Canvas API) │   │ (Web Audio)  │  │
│                  └─────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────┘
```

<br/>

---

## ⚙️ Parâmetros de Configuração

Os limiares de detecção ficam no topo do arquivo `index.html` e podem ser ajustados conforme necessário:

```javascript
const EAR_THRESH  = 0.17;  // Limiar de fechamento dos olhos (menor = mais difícil de acionar)
const MAR_THRESH  = 0.65;  // Limiar de abertura da boca    (maior = mais difícil de acionar)
const EYE_FRAMES  = 48;    // Frames consecutivos para alerta de olhos (~1.6s a 30fps)
const YAWN_FRAMES = 50;    // Frames consecutivos para alerta de bocejo (~1.7s a 30fps)
```

<br/>

---

## 👥 Equipe

| Nome | Função |
|---|---|
| *(seu nome)* | Desenvolvedor / Engenheiro de Software |
| *(nome)* | Gerente de Projeto |
| *(nome)* | Analista de Requisitos |
| *(nome)* | Documentação / Testes |

<br/>

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos como parte do **Projeto Interdisciplinar** do curso de Engenharia de Computação.

---

<div align="center">

Feito com ☕ e muita atenção aos olhos abertos.

</div>
