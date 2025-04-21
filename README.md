# Simple AI Chat Agent

A lightweight web application that allows users to interact with various AI language models including GPT-4.1 Mini/Nano and Gemini 2.0 Flash.

## Features

- **Multi-Model Support**: Interact with different AI models (OpenAI GPT and Google Gemini)
- **Streaming Responses**: Enable/disable real-time streaming of AI responses
- **Chain of Thought Reasoning**: See the AI's step-by-step reasoning process
- **Token Usage Tracking**: Monitor your token consumption
- **Responsive Design**: Works on both desktop and mobile devices
- **Customizable Settings**: Adjust the application behavior through a settings panel

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js with Express
- **APIs**: OpenAI API and Google Gemini API
- **Architecture**: Modular JavaScript pattern with IIFE (Immediately Invoked Function Expressions)

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/Simple-Ai-Agent-v5.git
   cd Simple-Ai-Agent-v5
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3005
   ```

## Usage

1. When you first load the application, you will be prompted for an API key password.
2. Once authenticated, you can select your preferred AI model from the dropdown menu.
3. Type your message in the input field and click "Send" to start a conversation.
4. Access settings by clicking the "Settings" button in the top right corner.
5. Toggle options like streaming responses and Chain of Thought reasoning.

## Project Structure

```
.
├── css/                 # Stylesheet files
│   └── styles.css       # Main stylesheet
├── js/                  # JavaScript modules
│   ├── app.js           # Main application entry point
│   ├── api-service.js   # Handles API communications
│   ├── chat-controller.js # Manages chat interactions
│   ├── settings-controller.js # Manages application settings
│   ├── ui-controller.js # Handles UI updates
│   └── utils.js         # Utility functions
├── index.html           # Main HTML entry point
├── server.js            # Express server configuration
└── package.json         # Project dependencies and scripts
```

## Security

- API keys are stored encrypted and require a password to decrypt
- No API keys are stored in plaintext in the codebase
- Authentication is required to use the application

## Development

To run the application in development mode with automatic reloading:

```
npm run dev
```

## License

[MIT License](LICENSE)

## Acknowledgements

- OpenAI for the GPT API
- Google for the Gemini API
- Node.js and Express communities for the excellent server framework 