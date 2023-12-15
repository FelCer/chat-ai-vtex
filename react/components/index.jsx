// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect, useState, createRef } from 'react';
import Linkify from 'linkify-react';
import axios from 'axios';
import {
  ChatRoom,
  SendMessageRequest,
} from 'amazon-ivs-chat-messaging';
import { uuidv4 } from '../helpers'

import * as config from '../resources/config.js';

// Components
import VideoPlayer from './videoPlayer/VideoPlayer';
import SignIn from './signin/SignIn.jsx';
import { useCssHandles } from 'vtex.css-handles'
// Styles
import './Chat.css';
import io from "socket.io-client"


const socket = io('http://localhost:40001')

const ChatAi = () => {
  const CSS_HANDLES = [
    "success-line",
    "chat-line-wrapper",
    "chat-line",
    "username",
    "main",
    "full-width",
    "full-height",
    "content-wrapper",
    "col-wrapper",
    "chat-wrapper",
    "messages",
    "fl",
    "fl-j-center",
    "message-container",
    "rounded mg-r-1",
    "btn btn--primary",
    "full-width rounded",
    "error-line",
    "input-message"
  ]
  const handles = useCssHandles(CSS_HANDLES)
  const [showSignIn, setShowSignIn] = useState(true);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatRoom, setChatRoom] = useState([]);
  // const [adminSocket, setAdminSocket] = useState(null)

  //efecto para un nuevo socket y un nuevo msjs de renderizado es probable que no se use

  // useEffect(() => {

  //   const adminSocket = io(`${config.API_URL}/admin`);
  //   setAdminSocket(adminSocket);

  //   return () => {
  //     adminSocket.disconnect();
  //   };
  // }, []);

  //efecto para un nuevo socket y un nuevo msjs de renderizado es probable que no se use

  const chatRef = createRef();
  const messagesEndRef = createRef();

  // Fetches a chat token
  const tokenProvider = async (selectedUsername) => {
    const uuid = uuidv4();
    const permissions = ['SEND_MESSAGE'];

    const data = {
      arn: config.CHAT_ROOM_ID,
      userId: `${selectedUsername}.${uuid}`,
      attributes: {
        username: `${selectedUsername}`,
      },
      capabilities: permissions,
    };

    let token;
    try {
      const response = await axios.post(`${config.API_URL}/auth`, data);
      token = {
        token: response.data.token,
        sessionExpirationTime: new Date(response.data.sessionExpirationTime),
        tokenExpirationTime: new Date(response.data.tokenExpirationTime),
      };
    } catch (error) {
      console.error('Error:', error);
    }

    return token;
  };

  const handleSignIn = (selectedUsername) => {
    // Set application state
    setUsername(selectedUsername);

    // Instantiate a chat room
    const room = new ChatRoom({
      regionOrUrl: config.CHAT_REGION,
      tokenProvider: () =>
        tokenProvider(selectedUsername),
    });
    setChatRoom(room);

    // Connect to the chat room
    room.connect();
  };

  useEffect(() => {
    // If chat room listeners are not available, do not continue
    if (!chatRoom.addListener) {
      return;
    }

    // Hide the sign in modal
    setShowSignIn(false);

    const unsubscribeOnConnected = chatRoom.addListener('connect', () => {
      // Connected to the chat room.
      renderConnect();
    });

    const unsubscribeOnDisconnected = chatRoom.addListener(
      'disconnect',
      (reason) => {
        // Disconnected from the chat room.
      }
    );

    const unsubscribeOnUserDisconnect = chatRoom.addListener(
      'userDisconnect',
      (disconnectUserEvent) => {
        /* Example event payload:
         * {
         *   id: "AYk6xKitV4On",
         *   userId": "R1BLTDN84zEO",
         *   reason": "Spam",
         *   sendTime": new Date("2022-10-11T12:56:41.113Z"),
         *   requestId": "b379050a-2324-497b-9604-575cb5a9c5cd",
         *   attributes": { UserId: "R1BLTDN84zEO", Reason: "Spam" }
         * }
         */
        renderDisconnect(disconnectUserEvent.reason);
      }
    );

    const unsubscribeOnConnecting = chatRoom.addListener('connecting', () => {
      // Connecting to the chat room.
    });

    const unsubscribeOnMessageReceived = chatRoom.addListener(
      'message',
      (message) => {

        socket.emit('sendMessage', (message))

        console.log("soy el ultimo mensaje", message)
        // Received a message
        const messageType = message.attributes?.message_type || 'MESSAGE';
        switch (messageType) {
          default:
            handleMessage(message);
            break;
        }
      }
    );

    return () => {
      unsubscribeOnConnected();
      unsubscribeOnDisconnected();
      unsubscribeOnUserDisconnect();
      unsubscribeOnConnecting();
      unsubscribeOnMessageReceived();
    };
  }, [chatRoom]);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    };
    scrollToBottom();
  });

  // Handlers
  const handleError = (data) => {
    const username = '';
    const userId = '';
    const message = `Error ${data.errorCode}: ${data.errorMessage}`;
    const messageId = '';
    const timestamp = `${Date.now()}`;

    const newMessage = {
      type: 'ERROR',
      timestamp,
      username,
      userId,
      message,
      messageId,
    };

    setMessages((prevState) => {
      return [...prevState, newMessage];
    });
  };

  const handleMessage = (data) => {
    const username = data.sender.attributes.username;
    const userId = data.sender.userId;
    const message = data.content;
    const messageId = data.id;
    const timestamp = data.sendTime;

    const newMessage = {
      type: 'MESSAGE',
      timestamp,
      username,
      userId,
      message,
      messageId,
    };

    setMessages((prevState) => {
      return [...prevState, newMessage];
    });
  };

  const handleOnClick = () => {
    setShowSignIn(true);
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (message) {
        sendMessage(message);
        setMessage('');
      }
    }
  };

  const sendMessage = async (message) => {
    const content = `${message.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}`;
    const request = new SendMessageRequest(content);
    try {
      await chatRoom.sendMessage(request);
    } catch (error) {
      handleError(error);
    }
  };
  // Renderers
  const renderErrorMessage = (errorMessage) => {
    return (
      <div className={`${handles['error-line']}`} key={errorMessage.timestamp}>
        <p>{errorMessage.message}</p>
      </div>
    );
  };


  const renderSuccessMessage = (successMessage) => {
    return (
      <div className={`${handles['success-line']}`} key={successMessage.timestamp}>
        <p>{successMessage.message}</p>
      </div>
    );
  };
  const renderMessage = (message) => {
    return (
      <div className={`${handles['chat-line-wrapper']}`} key={message.id}>
        <div className={`${handles['chat-line']}`}>
          <p>
            <span className={`${handles['username']}`}>{message.username}</span>
            <Linkify
              options={{
                ignoreTags: ['script', 'style'],
                nl2br: true,
                rel: 'noopener noreferrer',
                target: '_blank',
              }}
            >
              {message.message}
            </Linkify>
          </p>
        </div>
      </div>
    );
  };

  const renderMessages = () => {
    return messages.map((message) => {
      switch (message.type) {
        case 'ERROR':
          const errorMessage = renderErrorMessage(message);
          return errorMessage;
        case 'SUCCESS':
          const successMessage = renderSuccessMessage(message);
          return successMessage;
        case 'MESSAGE':
          const textMessage = renderMessage(message);
          return textMessage;
        default:
          console.info('Received unsupported message:', message);
          return <></>;
      }
    });
  };

  const renderDisconnect = (reason) => {
    const error = {
      type: 'ERROR',
      timestamp: `${Date.now()}`,
      username: '',
      userId: '',
      message: `Connection closed. Reason: ${reason}`,
    };
    setMessages((prevState) => {
      return [...prevState, error];
    });
  };

  const renderConnect = () => {
    const status = {
      type: 'SUCCESS',
      timestamp: `${Date.now()}`,
      username: '',
      userId: '',
      message: `Connected to the chat room.`,
    };
    setMessages((prevState) => {
      return [...prevState, status];
    });
  };

  const isChatConnected = () => {
    const chatState = chatRoom.state;
    return chatState === 'connected';
  };

  return (
    <>
      <div className={`${handles['main']} ${handles['full-width']} ${handles['full-height']}`}>
        <div className={`${handles['content-wrapper']}`}>
          <VideoPlayer
            playbackUrl={config.PLAYBACK_URL}
          />
          <div className={`${handles['col-wrapper']}`}>
            <div className={`${handles['chat-wrapper']}`}>
              <div className={`${handles['messages']}`}>
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
              <div className={`${handles['message-container']}`}>
                <input
                  ref={chatRef}
                  className={`${handles['input-message']} ${handles['rounded mg-r-1']} ${!username ? 'hidden' : ''}`}
                  type='text'
                  placeholder={
                    isChatConnected()
                      ? 'Say something'
                      : 'Waiting to connect...'
                  }
                  value={message}
                  maxLength={500}
                  disabled={!isChatConnected()}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                />
                {!username && (
                  <fieldset>
                    <button
                      onClick={handleOnClick}
                      className={`${handles['btn btn--primary']} ${handles['full-width rounded']}`}
                    >
                      Join the chat room
                    </button>
                  </fieldset>
                )}
              </div>
            </div>
          </div>
        </div>
        {showSignIn && <SignIn handleSignIn={handleSignIn} />}
      </div>
    </>
  );
};

ChatAi.defaultProps = {
  titleContent: "Mi Chat AI",
}

ChatAi.schema = {
  title: "Chat AI",
  type: "object",
  properties: {
    titleContent: {
      type: "string",
      title: "Título",
      default: "Mi Chat AI",
    }
  }
};

export default ChatAi;