document.addEventListener('DOMContentLoaded', function() {
  const nowPlayingElement = document.getElementById('now-playing');
  const lyricsContainer = document.getElementById('lyrics-container');
  const lyricsDisplay = document.getElementById('lyrics-display');
  const toggleLyricsBtn = document.getElementById('toggle-lyrics');
  const syncLyricsBtn = document.getElementById('sync-lyrics');
  const displayName = document.querySelector('h1').textContent.replace('Welcome, ', '');
  
  // Store current track to detect changes
  let currentTrack = {
    artist: null,
    track: null
  };
  
  // Lyrics state
  let currentLyricsTrack = { artist: null, track: null }; // Track current lyrics track
  let lyricsData = null;
  let lyricsInterval = null;
  let isLyricsVisible = false;
  let isLyricsSynced = false;
  let syncStartTime = null; // Track when sync started
  let syncOffset = 0; // Offset to adjust timing
  let trackStartTime = null; // Track when the current track started playing
  let syncSpeed = 1.0; // Speed multiplier for sync (1.0 = normal speed)
  let spotifyTrackPosition = 0; // Current position in Spotify track (ms)
  let spotifyTrackDuration = 0; // Total duration of Spotify track (ms)
  let lastSpotifyUpdate = 0; // Last time we got Spotify position update
  
  // Client-side colorful logging
  const clientLog = {
    info: (message) => {
      console.log('%c ℹ️ INFO ', 'background: rgba(255, 255, 255, 0.1); color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    success: (message) => {
      console.log('%c ✅ SUCCESS ', 'background: rgba(255, 255, 255, 0.2); color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    error: (message) => {
      console.log('%c ❌ ERROR ', 'background: rgba(255, 69, 58, 0.3); color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    track: (artist, track) => {
      console.log('%c 🎵 NOW PLAYING ', 'background: rgba(255, 255, 255, 0.15); color: white; padding: 2px 6px; border-radius: 4px;', `${artist} - ${track}`);
    }
  };
  
  // Console welcome message
  console.log('%c 🎧 Apple Music Now Playing 🎧 ', 'background: rgba(255, 255, 255, 0.1); color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
  
  // Simple test to check if JavaScript is loading
  console.log('JavaScript is loaded!');
  console.log('Elements found:', {
    nowPlaying: !!nowPlayingElement,
    lyricsContainer: !!lyricsContainer,
    lyricsDisplay: !!lyricsDisplay,
    toggleLyricsBtn: !!toggleLyricsBtn,
    syncLyricsBtn: !!syncLyricsBtn
  });
  
  // Test if lyrics container is visible
  if (lyricsContainer) {
    console.log('Lyrics container display style:', lyricsContainer.style.display);
    console.log('Lyrics container computed style:', window.getComputedStyle(lyricsContainer).display);
  }
  
  clientLog.info(`Initializing for user: ${displayName}`);
  
  // Function to update the track with animation
  function updateTrackWithAnimation(data) {
    // Check if it's actually a new track
    const isNewTrack = currentTrack.track !== data.track || currentTrack.artist !== data.artist;
    
    // Update current track reference
    currentTrack = {
      artist: data.artist,
      track: data.track
    };
    
    // Store Spotify track position and duration
    if (data.progress_ms !== undefined) {
      spotifyTrackPosition = data.progress_ms;
      lastSpotifyUpdate = Date.now();
    }
    if (data.duration_ms !== undefined) {
      spotifyTrackDuration = data.duration_ms;
    }
    
    // If this is the first track or there's no existing track element, just display it
    const existingTrack = document.querySelector('.track');
    if (!existingTrack) {
      displayTrack(data);
      return;
    }
    
    // If it's a new track, animate the transition
    if (isNewTrack) {
      clientLog.info('Track changed, animating transition');
      
      // Set track start time for new tracks
      if (data.nowPlaying) {
        trackStartTime = Date.now();
        clientLog.info('New track started, setting track start time');
      }
      
      // Add fadeOut class to the existing track
      existingTrack.classList.add('fade-out');
      
      // After animation completes, update content and fade in
      setTimeout(() => {
        displayTrack(data);
        document.querySelector('.track').classList.add('fade-in');
      }, 500); // Match this to the animation duration in CSS
    }
    
    // If it's a new track, fetch lyrics and auto-start sync
    if (isNewTrack && data.nowPlaying) {
      // Lyrics loading is now handled in fetchNowPlaying for better timing
      clientLog.info('New track detected, lyrics will be loaded by fetchNowPlaying');
    }
  }
  
  // Update the displayTrack function to include the equalizer
  function displayTrack(data) {
    nowPlayingElement.innerHTML = `
      <div class="track">
        <img src="${data.image || '/img/default-album.png'}" alt="${data.album}" class="track-image spinning">
        <div class="track-info">
          <h3>
            ${data.track}
            <span class="equalizer">
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
              <span class="bar"></span>
            </span>
          </h3>
          <div class="track-meta">by ${data.artist}</div>
          <div class="track-meta">on ${data.album || 'Unknown album'}</div>
          <a href="${data.url}" target="_blank" class="track-link">View on Spotify</a>
        </div>
      </div>
    `;
  }
  
  // Function to fetch now playing
  async function fetchNowPlaying() {
    clientLog.info('Fetching now playing track...');
    
    try {
      const response = await fetch('/api/now-playing');
      const data = await response.json();
      
      if (data.error) {
        clientLog.error(data.error);
        nowPlayingElement.innerHTML = `<div class="not-playing">${data.error}</div>`;
        return;
      }
      
      if (!data.nowPlaying) {
        clientLog.info('Not currently playing any music');
        
        // If we previously had a track and now nothing is playing
        if (currentTrack.track !== null) {
          const existingTrack = document.querySelector('.track');
          if (existingTrack) {
            existingTrack.classList.add('fade-out');
            setTimeout(() => {
              nowPlayingElement.innerHTML = `<div class="not-playing fade-in">Not currently playing any music</div>`;
            }, 500);
          } else {
            nowPlayingElement.innerHTML = `<div class="not-playing">Not currently playing any music</div>`;
          }
          currentTrack = { artist: null, track: null };
        } else {
          nowPlayingElement.innerHTML = `<div class="not-playing">Not currently playing any music</div>`;
        }
        return;
      }
      
      clientLog.track(data.artist, data.track);
      
      // Update Spotify position if available
      if (data.progress_ms !== undefined) {
        spotifyTrackPosition = data.progress_ms;
        lastSpotifyUpdate = Date.now();
      }
      if (data.duration_ms !== undefined) {
        spotifyTrackDuration = data.duration_ms;
      }
      
      // Check if this is the first time we're getting track data
      const isFirstTrack = currentTrack.track === null && currentTrack.artist === null;
      
      // Update with animation if it's a new track
      updateTrackWithAnimation(data);
      
      // If this is the first track or we don't have lyrics yet, fetch them immediately
      if ((isFirstTrack || !lyricsData) && data.nowPlaying) {
        clientLog.info('First track detected or no lyrics loaded, fetching lyrics immediately');
        fetchLyrics(data.artist, data.track).then(() => {
          // Auto-start lyrics sync for first track regardless of position
          if (lyricsData && lyricsData.syncedLyrics.length > 0) {
            const firstLyricTime = lyricsData.syncedLyrics[0]?.time || 0;
            const timeDiff = Math.abs(spotifyTrackPosition - firstLyricTime);
            
            // Always auto-start sync, regardless of position
            setTimeout(() => {
              clientLog.info(`Auto-starting lyrics sync for first track (position: ${Math.floor(spotifyTrackPosition/1000)}s, lyrics start: ${Math.floor(firstLyricTime/1000)}s, diff: ${Math.floor(timeDiff/1000)}s)`);
              syncLyrics();
            }, 1000); // Wait 1 second after lyrics load
          }
        });
      }
      
      clientLog.success('Track information updated');
    } catch (error) {
      clientLog.error(`Error fetching now playing: ${error.message}`);
      nowPlayingElement.innerHTML = `<div class="error">Error loading track data</div>`;
    }
  }
  
  // Lyrics functions
  async function fetchLyrics(artist, track) {
    if (!artist || !track) {
      clientLog.error('No artist or track provided for lyrics');
      return;
    }
    
    // Check if we already have lyrics for this track
    if (currentLyricsTrack.artist === artist && currentLyricsTrack.track === track) {
      clientLog.info(`Lyrics already loaded for: ${artist} - ${track}`);
      return;
    }
    
    clientLog.info(`Fetching lyrics for: ${artist} - ${track}`);
    lyricsDisplay.innerHTML = '<div class="lyrics-loading">Loading lyrics...</div>';
    
    try {
      const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
      const data = await response.json();
      
      clientLog.info('Lyrics API response:', data);
      
      if (data.found && data.syncedLyrics && data.syncedLyrics.length > 0) {
        lyricsData = data;
        currentLyricsTrack = { artist: artist, track: track }; // Update current lyrics track
        displayLyrics(data);
        clientLog.success('Lyrics loaded successfully');
      } else {
        displayLyricsError(data.message || 'No synchronized lyrics found for this track');
        clientLog.error('No lyrics found');
      }
    } catch (error) {
      clientLog.error(`Error fetching lyrics: ${error.message}`);
      displayLyricsError('Failed to load lyrics');
    }
  }
  
  function displayLyrics(data) {
    if (!data.syncedLyrics || data.syncedLyrics.length === 0) {
      displayLyricsError('No synchronized lyrics available');
      return;
    }
    
    const timingInfo = data.isSimpleTimed ? ' (Simple timing)' : '';
    const firstLyricTime = data.syncedLyrics[0]?.time || 0;
    const spotifyPosition = Math.floor(spotifyTrackPosition / 1000);
    const timeDiff = Math.abs(spotifyTrackPosition - firstLyricTime);
    
    lyricsDisplay.innerHTML = `
      <div class="lyrics-info">
        <span>${data.artist || 'Unknown Artist'} - ${data.track || 'Unknown Track'}</span>
        <span class="lyrics-timer" id="lyrics-timer">00:00</span>
      </div>
      <div class="lyrics-content">
        <div class="lyrics-line" id="current-lyric-line">Ready to start...</div>
        <div class="lyrics-status" id="lyrics-status">Spotify: ${spotifyPosition}s | First lyrics: ${Math.floor(firstLyricTime/1000)}s | Auto-sync starting...</div>
      </div>
      <div class="lyrics-controls">
        <button id="sync-backward" class="sync-btn" title="Sync Backward (-2s)">⏪</button>
        <button id="sync-forward" class="sync-btn" title="Sync Forward (+2s)">⏩</button>
        <button id="sync-slower" class="sync-btn" title="Slower Speed">🐌</button>
        <button id="sync-faster" class="sync-btn" title="Faster Speed">⚡</button>
        <button id="sync-reset" class="sync-btn" title="Reset Sync">🔄</button>
        <button id="sync-start" class="sync-btn sync-start-btn" title="Start Sync Now">▶️</button>
      </div>
      <div class="lyrics-source">Source: ${data.source || 'lrclib.net'}${timingInfo}</div>
    `;
    
    if (syncLyricsBtn) {
      syncLyricsBtn.style.display = 'inline-block';
    }
    clientLog.success(`Displayed ${data.syncedLyrics.length} lyrics lines${data.isSimpleTimed ? ' (simple timing)' : ''}`);
    clientLog.info(`Spotify position: ${spotifyPosition}s, First lyrics: ${Math.floor(firstLyricTime/1000)}s, Time diff: ${Math.floor(timeDiff/1000)}s`);
    
    // Add sync control listeners
    addSyncControlListeners();
    
    // Automatically show lyrics but DON'T start sync automatically
    isLyricsVisible = true;
    lyricsDisplay.style.display = 'block';
    toggleLyricsBtn.textContent = 'Hide Lyrics';
    
    // Don't auto-start sync - let user control it
    clientLog.info('Lyrics loaded. Auto-sync will start in 1 second...');
  }
  
  function displayLyricsError(message) {
    lyricsDisplay.innerHTML = `
      <div class="lyrics-error">
        ${message}
      </div>
    `;
    if (syncLyricsBtn) {
      syncLyricsBtn.style.display = 'none';
    }
  }
  
  function toggleLyrics() {
    isLyricsVisible = !isLyricsVisible;
    lyricsDisplay.style.display = isLyricsVisible ? 'block' : 'none';
    if (toggleLyricsBtn) {
      toggleLyricsBtn.textContent = isLyricsVisible ? 'Hide Lyrics' : 'Show Lyrics';
    }
  }
  
  function syncLyrics() {
    if (!lyricsData || !lyricsData.syncedLyrics.length) {
      clientLog.error('No lyrics data available for sync');
      return;
    }
    
    // Check if required elements exist
    const timerElement = document.getElementById('lyrics-timer');
    const currentLineElement = document.getElementById('current-lyric-line');
    
    if (!timerElement || !currentLineElement) {
      clientLog.error('Required lyrics elements not found, cannot sync');
      return;
    }
    
    isLyricsSynced = !isLyricsSynced;
    syncLyricsBtn.textContent = isLyricsSynced ? 'Stop Sync' : 'Sync with Track';
    
    if (isLyricsSynced) {
      startLyricsSync();
    } else {
      stopLyricsSync();
    }
  }
  
  function startLyricsSync() {
    if (lyricsInterval) clearInterval(lyricsInterval);
    
    // Use Spotify track position as the base time
    const baseTime = spotifyTrackPosition;
    syncStartTime = Date.now() - baseTime; // Calculate when the track should have started
    clientLog.info(`Starting lyrics sync with Spotify position: ${Math.floor(baseTime/1000)}s`);
    
    const timerElement = document.getElementById('lyrics-timer');
    const statusElement = document.getElementById('lyrics-status');
    
    // Check if timer element exists
    if (!timerElement) {
      clientLog.error('Timer element not found, cannot start lyrics sync');
      return;
    }
    
    // Update status with more helpful information
    if (statusElement) {
      const firstLyricTime = lyricsData?.syncedLyrics[0]?.time || 0;
      const timeDiff = Math.abs(baseTime - firstLyricTime);
      statusElement.textContent = `Sync started at ${Math.floor(baseTime/1000)}s (${Math.floor(timeDiff/1000)}s from lyrics start) - adjust timing as needed`;
    }
    
    clientLog.info('Starting lyrics sync with Spotify timing...');
    
    lyricsInterval = setInterval(() => {
      // Calculate current time based on Spotify position + elapsed time since last update
      const timeSinceLastUpdate = Date.now() - lastSpotifyUpdate;
      const estimatedCurrentPosition = spotifyTrackPosition + timeSinceLastUpdate;
      const currentTime = Math.floor((estimatedCurrentPosition + syncOffset) / 1000);
      
      // Update timer (with null check)
      if (timerElement) {
        const minutes = Math.floor(currentTime / 60);
        const seconds = currentTime % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      
      // Update active line using the calculated time
      updateActiveLyricLine(estimatedCurrentPosition + syncOffset);
    }, 50); // Update every 50ms for smooth lyrics
  }
  
  function stopLyricsSync() {
    if (lyricsInterval) {
      clearInterval(lyricsInterval);
      lyricsInterval = null;
    }
    
    // Reset current line
    const currentLineElement = document.getElementById('current-lyric-line');
    if (currentLineElement) {
      currentLineElement.textContent = 'Ready to start...';
      currentLineElement.classList.remove('active');
    }
    
    // Reset timer with null check
    const timerElement = document.getElementById('lyrics-timer');
    if (timerElement) {
      timerElement.textContent = '00:00';
    }
    
    // Reset status
    const statusElement = document.getElementById('lyrics-status');
    if (statusElement && lyricsData) {
      const firstLyricTime = lyricsData.syncedLyrics[0]?.time || 0;
      statusElement.textContent = `First lyrics start at ${Math.floor(firstLyricTime/1000)}s`;
    }
    
    clientLog.info('Lyrics sync stopped');
  }
  
  // Function to adjust sync timing
  function adjustSyncTiming(offsetMs) {
    if (!isLyricsSynced) return;
    
    syncOffset += offsetMs;
    clientLog.info(`Sync timing adjusted by ${offsetMs}ms (total offset: ${syncOffset}ms)`);
  }
  
  // Function to adjust sync speed
  function adjustSyncSpeed(speedMultiplier) {
    if (!isLyricsSynced) return;
    
    syncSpeed *= speedMultiplier;
    clientLog.info(`Sync speed adjusted to ${syncSpeed.toFixed(2)}x`);
  }
  
  // Function to reset sync timing
  function resetSyncTiming() {
    syncOffset = 0;
    syncSpeed = 1.0;
    if (isLyricsSynced && trackStartTime) {
      syncStartTime = trackStartTime;
    }
    clientLog.info('Sync timing and speed reset');
  }
  
  function updateActiveLyricLine(currentTime) {
    const currentLineElement = document.getElementById('current-lyric-line');
    if (!currentLineElement || !lyricsData || !lyricsData.syncedLyrics.length) return;
    
    let currentLine = 'Ready to start...';
    let isActive = false;
    let nextLineTime = null;
    
    // Find the current line based on time
    for (let i = 0; i < lyricsData.syncedLyrics.length; i++) {
      const line = lyricsData.syncedLyrics[i];
      const nextLine = lyricsData.syncedLyrics[i + 1];
      
      if (currentTime >= line.time) {
        currentLine = line.text || '';
        isActive = true;
        
        // Get next line time for better timing
        if (nextLine) {
          nextLineTime = nextLine.time;
        }
      } else {
        // We haven't reached this line yet
        nextLineTime = line.time;
        break;
      }
    }
    
    // Update the display with smooth transition
    if (currentLineElement.textContent !== currentLine) {
      currentLineElement.classList.add('fade-out');
      
      setTimeout(() => {
        currentLineElement.textContent = currentLine;
        currentLineElement.classList.remove('fade-out');
        currentLineElement.classList.add('fade-in');
        
        setTimeout(() => {
          currentLineElement.classList.remove('fade-in');
        }, 100);
      }, 50);
    }
    
    // Update active state
    if (isActive) {
      currentLineElement.classList.add('active');
    } else {
      currentLineElement.classList.remove('active');
    }
    
    // Add timing info for debugging
    if (nextLineTime !== null) {
      const timeUntilNext = nextLineTime - currentTime;
      if (timeUntilNext > 0 && timeUntilNext < 2000) {
        // Log when we're close to the next line
        clientLog.info(`Next line in ${Math.round(timeUntilNext)}ms: "${lyricsData.syncedLyrics.find(l => l.time === nextLineTime)?.text}"`);
      }
    }
    
    // Log current timing info every 10 seconds
    if (Math.floor(currentTime / 10000) % 10 === 0 && currentTime > 0) {
      clientLog.info(`Current time: ${Math.floor(currentTime/1000)}s, Spotify: ${Math.floor(spotifyTrackPosition/1000)}s, Offset: ${syncOffset}ms`);
    }
  }
  
  // Add sync control event listeners after lyrics are displayed
  function addSyncControlListeners() {
    const syncBackwardBtn = document.getElementById('sync-backward');
    const syncForwardBtn = document.getElementById('sync-forward');
    const syncSlowerBtn = document.getElementById('sync-slower');
    const syncFasterBtn = document.getElementById('sync-faster');
    const syncResetBtn = document.getElementById('sync-reset');
    const syncStartBtn = document.getElementById('sync-start');
    
    syncBackwardBtn?.addEventListener('click', () => adjustSyncTiming(-2000)); // -2 seconds
    syncForwardBtn?.addEventListener('click', () => adjustSyncTiming(2000)); // +2 seconds
    syncSlowerBtn?.addEventListener('click', () => adjustSyncSpeed(0.9)); // 10% slower
    syncFasterBtn?.addEventListener('click', () => adjustSyncSpeed(1.1)); // 10% faster
    syncResetBtn?.addEventListener('click', resetSyncTiming);
    syncStartBtn?.addEventListener('click', () => {
      if (!isLyricsSynced) {
        syncLyrics();
      }
    });
  }
  
  // Event listeners
  toggleLyricsBtn?.addEventListener('click', toggleLyrics);
  syncLyricsBtn?.addEventListener('click', syncLyrics);
  
  fetchNowPlaying();
  
  setInterval(fetchNowPlaying, 3000); // Update every 3 seconds
  clientLog.info('Auto-refresh set to 3 seconds');
});