// Fullscreen Lyrics JavaScript
document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const trackTitle = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const previousLyric = document.getElementById('previous-lyric');
  const currentLyric = document.getElementById('current-lyric');
  const nextLyric = document.getElementById('next-lyric');
  const progressFill = document.getElementById('progress-fill');
  const currentTime = document.getElementById('current-time');
  const totalTime = document.getElementById('total-time');
  const exitBtn = document.getElementById('exit-fullscreen');
  const syncControls = document.getElementById('sync-controls');
  const albumBackground = document.getElementById('album-background');
  
  // State
  let lyricsData = null;
  let currentTrack = { artist: null, track: null };
  let spotifyTrackPosition = 0;
  let spotifyTrackDuration = 0;
  let lastSpotifyUpdate = 0;
  let syncOffset = 0;
  let lyricsInterval = null;
  let isSynced = false;
  
  // Console logging
  const log = {
    info: (msg) => console.log('%c ℹ️ FULLSCREEN ', 'background: rgba(255, 255, 255, 0.1); color: white; padding: 2px 6px; border-radius: 4px;', msg),
    success: (msg) => console.log('%c ✅ FULLSCREEN ', 'background: rgba(255, 255, 255, 0.2); color: white; padding: 2px 6px; border-radius: 4px;', msg),
    error: (msg) => console.log('%c ❌ FULLSCREEN ', 'background: rgba(255, 69, 58, 0.3); color: white; padding: 2px 6px; border-radius: 4px;', msg)
  };
  
  log.info('Apple Music fullscreen lyrics page loaded');
  
  // Initialize
  function init() {
    fetchNowPlaying();
    setInterval(fetchNowPlaying, 2000); // Update every 2 seconds
    
    // Event listeners
    exitBtn.addEventListener('click', exitFullscreen);
    
    // Sync controls
    document.getElementById('sync-backward').addEventListener('click', () => adjustSync(-2000));
    document.getElementById('sync-forward').addEventListener('click', () => adjustSync(2000));
    document.getElementById('sync-reset').addEventListener('click', resetSync);
    
    // Show sync controls on hover
    document.addEventListener('mousemove', () => {
      syncControls.style.opacity = '1';
      setTimeout(() => {
        syncControls.style.opacity = '0';
      }, 3000);
    });
  }
  
  // Fetch now playing
  async function fetchNowPlaying() {
    try {
      const response = await fetch('/api/now-playing');
      const data = await response.json();
      
      if (data.error) {
        log.error(data.error);
        return;
      }
      
      if (!data.nowPlaying) {
        trackTitle.textContent = 'Not Playing';
        trackArtist.textContent = 'No music currently playing';
        return;
      }
      
      // Update track info
      if (currentTrack.track !== data.track || currentTrack.artist !== data.artist) {
        log.info(`Track changed from "${currentTrack.artist} - ${currentTrack.track}" to "${data.artist} - ${data.track}"`);
        
        // Stop current sync
        if (lyricsInterval) {
          clearInterval(lyricsInterval);
          lyricsInterval = null;
          isSynced = false;
        }
        
        // Reset lyrics display
        previousLyric.querySelector('.lyric-text').textContent = '';
        currentLyric.querySelector('.lyric-text').textContent = 'Loading...';
        nextLyric.querySelector('.lyric-text').textContent = '';
        lyricsData = null;
        
        // Update track info
        currentTrack = { artist: data.artist, track: data.track };
        trackTitle.textContent = data.track;
        trackArtist.textContent = data.artist;
        
        // Update album background
        if (data.image) {
          albumBackground.style.backgroundImage = `url(${data.image})`;
          log.info(`Updated album background: ${data.image}`);
        }
        
        // Fetch lyrics for new track
        fetchLyrics(data.artist, data.track);
      }
      
      // Update position
      if (data.progress_ms !== undefined) {
        spotifyTrackPosition = data.progress_ms;
        lastSpotifyUpdate = Date.now();
      }
      if (data.duration_ms !== undefined) {
        spotifyTrackDuration = data.duration_ms;
      }
      
      // Update progress
      updateProgress();
      
    } catch (error) {
      log.error(`Error fetching now playing: ${error.message}`);
    }
  }
  
  // Fetch lyrics
  async function fetchLyrics(artist, track) {
    if (!artist || !track) return;
    
    log.info(`Fetching lyrics for: ${artist} - ${track}`);
    
    // Show loading state
    previousLyric.querySelector('.lyric-text').textContent = '';
    currentLyric.querySelector('.lyric-text').textContent = 'Loading lyrics...';
    nextLyric.querySelector('.lyric-text').textContent = '';
    
    try {
      const response = await fetch(`/api/lyrics?artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}`);
      const data = await response.json();
      
      if (data.found && data.syncedLyrics && data.syncedLyrics.length > 0) {
        lyricsData = data;
        log.success(`Loaded ${data.syncedLyrics.length} lyrics lines for new track`);
        
        // Reset sync offset for new track
        syncOffset = 0;
        
        // Start sync automatically after a short delay
        setTimeout(() => {
          startLyricsSync();
        }, 500);
      } else {
        log.error('No lyrics found for new track');
        previousLyric.querySelector('.lyric-text').textContent = '';
        currentLyric.querySelector('.lyric-text').textContent = 'No lyrics available';
        nextLyric.querySelector('.lyric-text').textContent = '';
      }
    } catch (error) {
      log.error(`Error fetching lyrics: ${error.message}`);
      previousLyric.querySelector('.lyric-text').textContent = '';
      currentLyric.querySelector('.lyric-text').textContent = 'Error loading lyrics';
      nextLyric.querySelector('.lyric-text').textContent = '';
    }
  }
  
  // Start lyrics sync
  function startLyricsSync() {
    if (lyricsInterval) clearInterval(lyricsInterval);
    
    isSynced = true;
    log.info('Starting lyrics sync for new track');
    
    // Show initial lyrics immediately
    const timeSinceLastUpdate = Date.now() - lastSpotifyUpdate;
    const estimatedCurrentPosition = spotifyTrackPosition + timeSinceLastUpdate;
    updateLyrics(estimatedCurrentPosition + syncOffset);
    
    lyricsInterval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastSpotifyUpdate;
      const estimatedCurrentPosition = spotifyTrackPosition + timeSinceLastUpdate;
      updateLyrics(estimatedCurrentPosition + syncOffset);
    }, 50);
  }
  
  // Update lyrics display
  function updateLyrics(currentTime) {
    if (!lyricsData || !lyricsData.syncedLyrics.length) return;
    
    let previousLine = '';
    let currentLine = '';
    let nextLine = '';
    let currentLineTime = 0;
    let nextLineTime = 0;
    
    // Find previous, current and next lines
    for (let i = 0; i < lyricsData.syncedLyrics.length; i++) {
      const line = lyricsData.syncedLyrics[i];
      const nextLineData = lyricsData.syncedLyrics[i + 1];
      const previousLineData = lyricsData.syncedLyrics[i - 1];
      
      if (currentTime >= line.time) {
        currentLine = line.text || '';
        currentLineTime = line.time;
        
        if (previousLineData) {
          previousLine = previousLineData.text || '';
        }
        
        if (nextLineData) {
          nextLine = nextLineData.text || '';
          nextLineTime = nextLineData.time;
        }
      } else {
        if (i === 0) {
          // Before first line
          previousLine = '';
          currentLine = 'Get ready...';
          nextLine = line.text || '';
          nextLineTime = line.time;
        }
        break;
      }
    }
    
    // Update previous line
    if (previousLyric.querySelector('.lyric-text').textContent !== previousLine) {
      previousLyric.querySelector('.lyric-text').textContent = previousLine;
      previousLyric.classList.add('previous');
    }
    
    // Update current line with animations
    if (currentLyric.querySelector('.lyric-text').textContent !== currentLine) {
      currentLyric.querySelector('.lyric-text').textContent = currentLine;
      currentLyric.classList.add('current');
      
      // Trigger animation
      currentLyric.style.animation = 'none';
      currentLyric.offsetHeight; // Trigger reflow
      currentLyric.style.animation = 'appleFadeInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      // Add word reveal animation to text
      const lyricText = currentLyric.querySelector('.lyric-text');
      lyricText.style.animation = 'appleWordReveal 0.6s ease-out';
    }
    
    // Update next line
    if (nextLyric.querySelector('.lyric-text').textContent !== nextLine) {
      nextLyric.querySelector('.lyric-text').textContent = nextLine;
      nextLyric.classList.add('next');
    }
  }
  
  // Update progress bar
  function updateProgress() {
    if (spotifyTrackDuration === 0) return;
    
    const progress = (spotifyTrackPosition / spotifyTrackDuration) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Update time display
    const currentMinutes = Math.floor(spotifyTrackPosition / 60000);
    const currentSeconds = Math.floor((spotifyTrackPosition % 60000) / 1000);
    const totalMinutes = Math.floor(spotifyTrackDuration / 60000);
    const totalSeconds = Math.floor((spotifyTrackDuration % 60000) / 1000);
    
    currentTime.textContent = `${currentMinutes}:${currentSeconds.toString().padStart(2, '0')}`;
    totalTime.textContent = `${totalMinutes}:${totalSeconds.toString().padStart(2, '0')}`;
  }
  
  // Sync adjustment functions
  function adjustSync(offsetMs) {
    syncOffset += offsetMs;
    log.info(`Sync adjusted by ${offsetMs}ms (total: ${syncOffset}ms)`);
  }
  
  function resetSync() {
    syncOffset = 0;
    log.info('Sync reset');
  }
  
  // Exit fullscreen
  function exitFullscreen() {
    if (lyricsInterval) {
      clearInterval(lyricsInterval);
    }
    window.location.href = '/dashboard';
  }
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    switch(e.key) {
      case 'Escape':
        exitFullscreen();
        break;
      case 'ArrowLeft':
        adjustSync(-2000);
        break;
      case 'ArrowRight':
        adjustSync(2000);
        break;
      case 'r':
      case 'R':
        resetSync();
        break;
    }
  });
  
  // Initialize
  init();
}); 