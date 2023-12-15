// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, createRef, useEffect } from "react";
import { useCssHandles } from 'vtex.css-handles'
// Styles
import '../Chat.css';

const SignIn = ({ handleSignIn }) => {
  const [username, setUsername] = useState("");
  const [loaded, setLoaded] = useState(false);
  const inputRef = createRef();
  const CSS_HANDLES = [
    'modal',
    'pos-absolute',
    'top-0',
    'bottom-0',
    'modal__el',
    'mg-b-2',
    'mg-b-05',
    'radius',
    'btn btn--primary rounded mg-t-1',
    'modal__overlay'
  ]
  const handles = useCssHandles(CSS_HANDLES)
  useEffect(() => {
    setLoaded(true);
    inputRef.current.focus();
  }, [loaded]); // eslint-disable-line

  return (
    <div className={`${handles['modal']} ${handles['pos-absolute']} ${handles['top-0']} ${handles['bottom-0']}`}>
      <div className={`${handles['modal__el']}`}>
        <h1 className={`${handles['mg-b-2']}`}>Join the chat room</h1>
        <form onSubmit={(e) => { e.preventDefault() }}>
          <fieldset>
            <label htmlFor="name" className={`${handles['mg-b-05']}`}>
              Username
            </label>
            <input
              name="name"
              id="name"
              ref={inputRef}
              type="text"
              className={`${handles['radius']}`}
              placeholder="Type here..."
              autoComplete="off"
              value={username}
              onChange={(e) => {
                e.preventDefault();
                setUsername(e.target.value);
              }}
            />
            <hr />
            <hr />
            <button
              onClick={(e) => {
                handleSignIn(username, "");
              }}
              className={`${handles['btn btn--primary rounded mg-t-1']}`}
              disabled={!username}
            >
              Start chatting
            </button>
          </fieldset>
        </form>
      </div>
      <div className={`${handles['modal__overlay']}`}></div>
    </div>
  );
};

export default SignIn;
