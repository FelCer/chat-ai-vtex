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

const ChatAi = () => {
  const CSS_HANDLES = [
    "success-line",
  ]
  
  const handles = useCssHandles(CSS_HANDLES)

  const [showSignIn, setShowSignIn] = useState(true);
  const [username, setUsername] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatRoom, setChatRoom] = useState([]);

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
      <div className='error-line' key={errorMessage.timestamp}>
        <p>{errorMessage.message}</p>
      </div>
    );
  };

  const renderSuccessMessage = (successMessage) => {
    return (
      <div className={`${handles['success-line']}` key={successMessage.timestamp}>
        <p>{successMessage.message}</p>
      </div>
    );
  };
  const renderMessage = (message) => {
    return (
      <div className={`${handles['chat-line-wrapper']}` key={message.id}>
        <div className={`${handles['chat-line']}`>
          <p>
            <span className='username'>{message.username}</span>
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
      <div className='main full-width full-height chat-container'>
        <div className='content-wrapper mg-2'>
          <VideoPlayer
            playbackUrl={config.PLAYBACK_URL}
          />
          <div className='col-wrapper'>
            <div className='chat-wrapper'>
              <div className='messages'>
                {renderMessages()}
                <div ref={messagesEndRef} />
              </div>
              <div className='composer fl fl-j-center'>
                <input
                  ref={chatRef}
                  className={`rounded mg-r-1 ${!username ? 'hidden' : ''}`}
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
                      className='btn btn--primary full-width rounded'
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