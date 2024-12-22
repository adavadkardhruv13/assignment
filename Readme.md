# ChatBox Component

The `ChatBox` is a React-based chat interface that supports text input and speech-to-text functionality using browser speech recognition. It is designed to interact with a backend API to provide conversational responses.

## Features
- **Real-Time Messaging**: Allows users to send and receive messages in real-time using OpenAI.
- **Speech-to-Text**: Enables voice input using the browser's speech recognition API.
- **API Integration**: Sends user messages to a backend server and displays the AI's responses.
- **Auto-Scroll**: Automatically scrolls to the latest message in the chat window.
- **Dynamic UI**: Visual indicators for typing status and audio recording.
- **Error Handling**: Displays error messages in case of API call failures.

---

## Technologies Used
- **Frontend**: React
- **Backend**: FastAPI, OpenAI, Embeddings
- **Database**: PostgreSQL
- **Styling**: CSS
- **API Calls**: Axios
- **Speech Recognition**: `react-speech-recognition`
- **Icons & Images**: Font Awesome, custom SVGs

---


---

## Installation
1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Install dependencies:
   ```bash
   install requirenments.txt
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Start the backend server:
   ```bash
   uvicorn app:main dev
   ```

---

## Configuration
### Backend API
- The chat interface expects a POST endpoint at `http://localhost:3000/` that accepts a payload:
  ```json
  {
    "question": "User's message"
  }
  ```
  - The server should respond with an array of messages in the following format:
    ```json
    [
      { "content": "AI Response 1" },
      { "content": "AI Response 2" }
    ]
    ```

---

## Component Structure
### State Variables
- `message`: Stores the text input from the user.
- `chatMessage`: Stores all messages displayed in the chat interface.
- `onGoingChat`: Indicates if a chat interaction is in progress.
- `isAudioText`: Tracks the status of speech-to-text recording.

### Props
- `isUploaded` (Boolean): Controls whether the chat is active or disabled based on file upload status.

---

## Usage
### Sending Messages
1. Type a message in the input box and press **Enter** or click the send button.
2. The message is sent to the backend, and the response is displayed in the chat window.

### Speech-to-Text
1. Click the microphone button to enable voice input.
2. Speak into your device's microphone. The text will appear in the input box.
3. Click the microphone button again to stop voice input.




---

## Future Improvements
- Add support for multiple language speech recognition.
- Enable real-time streaming of AI responses.


---

## Example API Response
For testing purposes, you can simulate the following response from the backend:
```json
[
  { "content": "Hi there! How can I help you?" },
  { "content": "Feel free to ask any questions." }
]
```

---

## Contribution
Feel free to submit issues or create pull requests for any feature requests or bug fixes.

---

## License
This project is open-source and available under the [MIT License](LICENSE).

---

## Acknowledgements
- [React Speech Recognition](https://www.npmjs.com/package/react-speech-recognition)
- [Axios](https://axios-http.com/)
- [Font Awesome](https://fontawesome.com/)
