# StudyMate - AI Study Assistant

StudyMate is a modern, polished AI chat interface designed to help students with their studies. It features a clean, responsive UI with support for multiple AI providers (OpenAI, Anthropic, Gemini, Local) and a focus on user experience.

![StudyMate Screenshot](./client/public/opengraph.jpg)

## Features

- **Modern Chat Interface**: Clean, bubble-style chat with distinct user and AI roles.
- **Theme Support**: Built-in Light and Dark modes.
- **Conversation Management**: Create, delete, and categorize conversations (Study, Essay, Code, Language, General).
- **Settings Configuration**: Configure your own API keys for various AI providers (OpenAI, Anthropic, Gemini) directly in the browser (stored locally).
- **Voice Input**: Simulated voice input interface for hands-free interaction.
- **Export & Share**: Easily export conversations to text files or copy them to the clipboard.
- **Responsive Design**: Fully responsive layout with a collapsible sidebar for mobile and desktop.

## Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Variables for theming
- **Icons**: Lucide React
- **Routing**: Wouter
- **State Management**: React Hooks (Context/Local State)

## Getting Started

1.  **Clone the repository**
    ```bash
    git clone https://github.com/23f1002643/UI-Spark.git
    cd UI-Spark
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npm run dev
    ```

4.  **Open in your browser**
    The application will start at `http://localhost:5000`.

## Configuration

To use the AI features, click the **Settings** gear icon in the top right corner and enter your API key for your preferred provider. Keys are stored securely in your browser's LocalStorage and are never sent to any backend server other than the AI provider's API.

## License

MIT
