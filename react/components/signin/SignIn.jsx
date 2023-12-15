// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useState, createRef, useEffect } from "react";

const SignIn = ({ handleSignIn }) => {
  const [username, setUsername] = useState("");
  const [loaded, setLoaded] = useState(false);
  const inputRef = createRef();

  useEffect(() => {
    setLoaded(true);
    inputRef.current.focus();
  }, [loaded]); // eslint-disable-line

  return (
    <div className="modal pos-absolute top-0 bottom-0">
      <div className="modal__el">
        <h1 className="mg-b-2">Join the chat room</h1>
        <form onSubmit={(e) => { e.preventDefault() }}>
          <fieldset>
            <label htmlFor="name" className="mg-b-05">
              Username
            </label>
            <input
              name="name"
              id="name"
              ref={inputRef}
              type="text"
              className="radius"
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
              className="btn btn--primary rounded mg-t-1"
              disabled={!username}
            >
              Start chatting
            </button>
          </fieldset>
        </form>
      </div>
      <div className="modal__overlay"></div>
    </div>
  );
};

export default SignIn;
