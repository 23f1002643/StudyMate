<div align="center">

# ✦ StudyMate
### AI-Powered Learning Assistant

[![Netlify Status](https://api.netlify.com/api/v1/badges/studymateagent/deploy-status)](https://studymateagent.netlify.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vitejs.dev/)

**[🚀 Live Demo](https://studymateagent.netlify.app)** · Built by [Saini](https://github.com/23f1002643) · IIT Madras BS Program

</div>

---

## What is StudyMate?

StudyMate is a **privacy-first, multi-provider AI learning assistant** built for students. Unlike ChatGPT or Claude.ai, StudyMate is:

- 🔑 **Bring Your Own Key** — your API key stays in your browser, never touches our servers
- 🤖 **Multi-provider** — switch between OpenAI, Anthropic (Claude), Google Gemini, or local Ollama models
- 📚 **Study-focused** — purpose-built modes for learning, not just general chat
- 💰 **Essentially free to run** — deploy on Netlify/Vercel for $0, pay only your actual API usage
- 🔒 **Privacy-first** — all conversation data stored locally in your browser (localStorage)

---

## Features

### 💬 Smart Chat
Multi-turn conversations with full markdown rendering — code blocks, tables, LaTeX math notation, and more. System prompts are tuned per subject category (Study, Essay, Code, Language, General).

### 🧠 Study Agent Mode
An AI agent that follows a structured pedagogical flow:
1. Assesses what you already know
2. Creates a personalized study plan
3. Teaches concepts using the Socratic method
4. Runs comprehension checks after each concept
5. Identifies and revisits weak areas
6. Closes with a mini-quiz

### 🎯 MCQ Quiz Mode
- Enter any topic → AI generates N multiple-choice questions
- Instant feedback with correct/wrong highlighting
- Detailed explanations for each answer
- Score summary with weak area review at the end

### ⚡ Flashcard Mode
- Paste your notes or describe a topic
- AI generates flashcards with front/back + difficulty rating
- Easy / Medium / Hard self-rating after each card (spaced repetition style)
- Session summary showing your performance distribution

### 📎 RAG — Chat With Your Notes
Upload `.txt` or `.md` files as context documents. StudyMate chunks your content and injects the most relevant chunks into each query — so the AI answers based on *your* notes, not just its training data.

### 🎙️ Voice Input
Web Speech API integration with `en-IN` locale support — works great for Hindi/Hinglish queries.

### 📋 Prompt Templates
5 one-click study prompts built in:
- Explain concept step-by-step
- Quiz me on this topic
- Summarize key points
- Debug my code
- Create a study plan

### 💰 Token & Cost Tracker
Real-time tracking of tokens used and estimated USD cost per model — so you always know what you're spending.

---

## Supported AI Providers

| Provider | Models |
|----------|--------|
| **OpenAI** | gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo |
| **Anthropic** | claude-3-5-sonnet, claude-3-haiku, claude-3-opus |
| **Google Gemini** | gemini-1.5-pro, gemini-1.5-flash, gemini-pro |
| **Local (Ollama)** | llama3, mistral, codellama, any Ollama model |

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| State | React hooks + localStorage |
| Backend | Express.js (static server only) |
| Routing | Wouter |
| Deployment | Netlify |

---

## Getting Started

### Prerequisites
- Node.js 18+
- An API key from OpenAI / Anthropic / Google, OR [Ollama](https://ollama.ai) running locally

### Installation

```bash
git clone https://github.com/23f1002643/StudyMate.git
cd StudyMate
npm install
npm run dev
```

App runs at `http://localhost:5000`

### Setting up your API Key

1. Open StudyMate in your browser
2. Click the **Settings** icon (top right)
3. Select your AI provider
4. Paste your API key
5. Choose your preferred model
6. Click **Save** — you're ready!

> 🔒 Your API key is stored only in your browser's localStorage. It is never sent to StudyMate's server.

### Using Local Models (Ollama)

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3

# Start the server
ollama serve
```

Then select **Local (Ollama)** in Settings and pick your model.

---

## Deployment

### Netlify (Recommended — Free)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/23f1002643/StudyMate)

**Build settings:**
```
Build command:  npm run build
Publish dir:    dist/public
```

### Vercel

```bash
npm i -g vercel
vercel --prod
```

---

## Project Structure

```
StudyMate/
├── client/
│   └── src/
│       ├── components/studymate/   # UI components
│       │   ├── ChatArea.tsx        # Main chat view
│       │   ├── ChatInput.tsx       # Input + voice + templates
│       │   ├── ChatMessage.tsx     # Message bubble + markdown
│       │   ├── ChatHeader.tsx      # Top bar + context docs
│       │   ├── Sidebar.tsx         # Conversation list
│       │   ├── EmptyState.tsx      # Welcome / mode picker
│       │   ├── MCQMode.tsx         # Quiz mode UI
│       │   ├── FlashcardMode.tsx   # Flashcard UI
│       │   └── SettingsDialog.tsx  # API key + model config
│       ├── hooks/
│       │   ├── useConversations.ts # Conversation state + persistence
│       │   ├── useSettings.ts      # Settings state
│       │   ├── useMCQ.ts           # MCQ session state
│       │   ├── useFlashcards.ts    # Flashcard session state
│       │   └── useTheme.ts         # Dark/light mode
│       ├── lib/
│       │   ├── api.ts              # LLM calls (OpenAI/Anthropic/Gemini/Ollama)
│       │   ├── markdown.ts         # Markdown renderer
│       │   └── storage.ts          # localStorage persistence
│       ├── types/
│       │   └── chat.ts             # All TypeScript types
│       └── pages/
│           └── Index.tsx           # Main app page
├── server/
│   └── index.ts                    # Express static server
└── package.json
```

---

## How It Compares

| Feature | StudyMate | ChatGPT | Claude.ai |
|---------|-----------|---------|-----------|
| Bring Your Own Key | ✅ | ❌ | ❌ |
| Multi-provider | ✅ | ❌ | ❌ |
| MCQ Generator | ✅ | ❌ | ❌ |
| Flashcards | ✅ | ❌ | ❌ |
| Study Agent | ✅ | ❌ | ❌ |
| Notes RAG | ✅ | Limited | ❌ |
| Offline PWA | ✅ (WIP) | ❌ | ❌ |
| Cost Tracker | ✅ | ❌ | ❌ |
| Self-hostable | ✅ | ❌ | ❌ |
| Data stays local | ✅ | ❌ | ❌ |

---

## Roadmap

- [ ] PDF upload support for RAG
- [ ] PWA offline mode
- [ ] Anki export for flashcards
- [ ] Pomodoro timer integration
- [ ] Math formula rendering (KaTeX)
- [ ] Multi-language UI

---

## License

MIT — do whatever you want with it.

---

<div align="center">
Made with ❤️ by <a href="https://github.com/23f1002643">Saini</a> · IIT Madras BS Program
</div>
