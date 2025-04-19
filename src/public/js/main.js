document.addEventListener('DOMContentLoaded', function() {
  const nowPlayingElement = document.getElementById('now-playing');
  const username = document.querySelector('h1').textContent.replace('Welcome, ', '');
  
  // Store current track to detect changes
  let currentTrack = {
    artist: null,
    track: null
  };
  
  // Client-side colorful logging
  const clientLog = {
    info: (message) => {
      console.log('%c ℹ️ INFO ', 'background: #0077ff; color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    success: (message) => {
      console.log('%c ✅ SUCCESS ', 'background: #00cc66; color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    error: (message) => {
      console.log('%c ❌ ERROR ', 'background: #ff3860; color: white; padding: 2px 6px; border-radius: 4px;', message);
    },
    track: (artist, track) => {
      console.log('%c 🎵 NOW PLAYING ', 'background: #8a2be2; color: white; padding: 2px 6px; border-radius: 4px;', `${artist} - ${track}`);
    }
  };
  
  // Console welcome message
  console.log('%c 🎧 Last.fm Now Playing 🎧 ', 'background: linear-gradient(to right, #ff416c, #ff4b2b); color: white; font-size: 14px; padding: 4px 8px; border-radius: 4px;');
  
  clientLog.info(`Initializing for user: ${username}`);
  
  // Function to update the track with animation
  function updateTrackWithAnimation(data) {
    // Check if it's actually a new track
    const isNewTrack = currentTrack.track !== data.track || currentTrack.artist !== data.artist;
    
    // Update current track reference
    currentTrack = {
      artist: data.artist,
      track: data.track
    };
    
    // If this is the first track or there's no existing track element, just display it
    const existingTrack = document.querySelector('.track');
    if (!existingTrack) {
      displayTrack(data);
      return;
    }
    
    // If it's a new track, animate the transition
    if (isNewTrack) {
      clientLog.info('Track changed, animating transition');
      
      // Add fadeOut class to the existing track
      existingTrack.classList.add('fade-out');
      
      // After animation completes, update content and fade in
      setTimeout(() => {
        displayTrack(data);
        document.querySelector('.track').classList.add('fade-in');
      }, 500); // Match this to the animation duration in CSS
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
          <a href="${data.url}" target="_blank" class="track-link">View on Last.fm</a>
        </div>
      </div>
    `;
  }
  
  // Function to fetch now playing
  async function fetchNowPlaying() {
    clientLog.info('Fetching now playing track...');
    
    try {
      const response = await fetch('/api/now-playing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          authCode: localStorage.getItem('authCode') || 'default-auth-code',
          username: username.trim()
        })
      });
      
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
      
      // Update with animation if it's a new track
      updateTrackWithAnimation(data);
      
      clientLog.success('Track information updated');
    } catch (error) {
      clientLog.error(`Error fetching now playing: ${error.message}`);
      nowPlayingElement.innerHTML = `<div class="error">Error loading track data</div>`;
    }
  }
  
  fetchNowPlaying();
  
  setInterval(fetchNowPlaying, 10000);
  clientLog.info('Auto-refresh set to 10 seconds');
});