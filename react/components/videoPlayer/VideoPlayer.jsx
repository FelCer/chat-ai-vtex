// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import React, { useEffect } from 'react';

// Styles
import './VideoPlayer.css';
import { useCssHandles } from 'vtex.css-handles'
// Styles
import './VideoPlayer.css';

const VideoPlayer = ({
  playbackUrl,
}) => {

  const CSS_HANDLES = [
    'player-wrapper',
    'aspect-169',
    'pos-relative',
    'full-height',
    'video-element',
    'pos-absolute',
    'full-width'
  ]
  const handles = useCssHandles(CSS_HANDLES)

  useEffect(() => {
    const MediaPlayerPackage = window.IVSPlayer;

    // First, check if the browser supports the Amazon IVS player.
    if (!MediaPlayerPackage?.isPlayerSupported) {
      console.warn(
        'The current browser does not support the Amazon IVS player.'
      );
      return;
    }

    const PlayerState = MediaPlayerPackage.PlayerState;
    const PlayerEventType = MediaPlayerPackage.PlayerEventType;

    // Initialize player
    const player = MediaPlayerPackage.create();
    player.attachHTMLVideoElement(document.getElementById('video-player'));

    // Attach event listeners
    player.addEventListener(PlayerState.PLAYING, () => {
      console.info('Player State - PLAYING');
    });
    player.addEventListener(PlayerState.ENDED, () => {
      console.info('Player State - ENDED');
    });
    player.addEventListener(PlayerState.READY, () => {
      console.info('Player State - READY');
    });
    player.addEventListener(PlayerEventType.ERROR, (err) => {
      console.warn('Player Event - ERROR:', err);
    });

    // Setup stream and play
    player.setAutoplay(true);
    player.load(playbackUrl);
    player.setVolume(0.5);
  }, []); // eslint-disable-line

  return (
    <>
      <div className={`${handles['player-wrapper']}`}>
        <div className={`${handles['aspect-169']} ${handles['pos-relative']} ${handles['full-width']} ${handles['full-height']}`}>
          <img className={`${handles['video-element']}`} src='https://i.pinimg.com/736x/3d/2f/06/3d2f06e79473b43304044154d18c68e8.jpg' alt='image' style={{ width: '100%', height: '100%' }} />
        </div>
      </div>
    </>
  );
};

export default VideoPlayer;
