import "./ChatBox.css";
import React, { useState, useEffect, useRef } from "react";
import send from "../assets/send.svg";
import chat_avatar from "../assets/chat_avatar.svg";
import MessageBox from "../MessageBox/MessageBox";
import axios from "axios";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import Tooltip from "../Tooltip/Tooltip";

function ChatBox(props) {
  const audiobutton = useRef(null);
  const [isAudioText, setAudioText] = useState(false);
  const [message, setMessage] = useState("");
  const [chatMessage, setChatMessage] = useState([]);
  const [onGoingChat, setOnGoingChat] = useState(false);

  const { transcript, browserSupportsSpeechRecognition, resetTranscript } =
    useSpeechRecognition();
  const startListening = () =>
    SpeechRecognition.startListening({ continuous: true });

  useEffect(() => {
    setMessage(transcript);
  }, [transcript]);

  useEffect(() => {
    document.querySelector(".message-display").scrollTop =
      document.querySelector(".message-display").scrollHeight;
  }, [chatMessage]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (message.trim() === "") return;

    resetTranscript();
    let tempmessage = message.trim();
    setMessage("");
    setOnGoingChat(true);

    // Add the question and a "typing..." message
    const newMessages = [
      ...chatMessage,
      { text: tempmessage, isDisplay: true },
      { text: "Typing...", isDisplay: false },
    ];
    setChatMessage(newMessages);

    // Stop listening if speech-to-text is active
    if (isAudioText) {
      setAudioText(false);
      audiobutton.current.style.color = "#4c4e4f";
      SpeechRecognition.stopListening();
    }

    try {
      // Send the message to the backend
      const response = await axios.post(
        `http://localhost:8000/chat?question=${encodeURIComponent(tempmessage)}`,
        null, // No request body is needed
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const answer = response.data.answer;  // Get the answer from the backend

      // Add the response to chat
      setChatMessage([
        ...chatMessage,
        { text: tempmessage, isDisplay: true, image: chat_avatar },
        { text: answer, isDisplay: true, image: chat_avatar },
      ]);
    } catch (error) {
      setChatMessage([
        ...chatMessage,
        {
          text: "An error occurred while fetching the response. Please try again.",
          isDisplay: true,
          image: chat_avatar,
        },
      ]);
    } finally {
      setOnGoingChat(false);
    }
  };

  const handleChatEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleChat(e);
    }
  };

  const handleAudioToText = async (e) => {
    e.preventDefault();
    if (!(props.isUploaded || onGoingChat)) {
      if (isAudioText === false) {
        setAudioText(true);
        audiobutton.current.style.color = "#0FA958";
        startListening();
      } else {
        setAudioText(false);
        audiobutton.current.style.color = "#4c4e4f";
        SpeechRecognition.stopListening();
      }
    }
  };

  const handleChangeMessage = (e) => {
    setMessage(e.target.value);
  };

  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser does not support Speech Recognition.</div>;
  }

  return (
    <div className="chat-box">
      <div className="message-display">
        {!props.isUploaded ? (
          chatMessage.map((element, index) => {
            return (
              <MessageBox
                key={index}
                text={element.text}
                image={chat_avatar}
                isDisplay={element.isDisplay}
              />
            );
          })
        ) : (
          <div className="upload-text">Upload to Start Chat</div>
        )}
      </div>

      <form className="input">
        <input
          type="text"
          className="input-section"
          placeholder="Send a message..."
          onChange={handleChangeMessage}
          value={message}
          onKeyDown={handleChatEnter}
          disabled={onGoingChat}
        />
        <button
          className="text-to-audio"
          ref={audiobutton}
          onClick={handleAudioToText}
          onKeyDown={handleChatEnter}
          disabled={onGoingChat}
        >
          <Tooltip text="Click to enable Speech-to-Text">
            <i
              className={`fa-solid fa-microphone${
                isAudioText ? "-slash" : ""
              }`}
            ></i>
          </Tooltip>
        </button>

        <button
          className="send-button"
          onClick={handleChat}
          disabled={onGoingChat}
        >
          <img src={send} alt="send" />
        </button>
      </form>
    </div>
  );
}

export default ChatBox;
