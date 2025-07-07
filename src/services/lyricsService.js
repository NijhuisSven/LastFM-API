const axios = require('axios');
const log = require('../utils/logger');

class LyricsService {
  constructor() {
    this.baseUrl = 'https://lrclib.net/api';
  }

  async searchLyrics(artist, track) {
    try {
      log.info(`Searching lyrics for: ${artist} - ${track}`);
      
      // Clean artist and track names
      const cleanArtist = artist.replace(/[^\w\s]/g, '').trim();
      const cleanTrack = track.replace(/[^\w\s]/g, '').trim();
      
      log.info(`Cleaned search terms: ${cleanArtist} - ${cleanTrack}`);
      
      const response = await axios.get(`${this.baseUrl}/search`, {
        params: {
          artist_name: cleanArtist,
          track_name: cleanTrack
        }
      });

      log.info(`Search response: ${response.data?.length || 0} results found`);
      log.info('Full search response:', JSON.stringify(response.data, null, 2));

      if (response.data && response.data.length > 0) {
        // Log all results for debugging
        response.data.forEach((result, index) => {
          log.info(`Result ${index + 1}: ${result.artistName} - ${result.trackName} (ID: ${result.id})`);
        });
        
        // Return the first result (most relevant)
        return response.data[0];
      }
      
      return null;
    } catch (error) {
      log.error(`Error searching lyrics: ${error.message}`);
      throw new Error('Failed to search lyrics');
    }
  }

  async getLyrics(lyricsId) {
    try {
      log.info(`Fetching lyrics with ID: ${lyricsId}`);
      
      const response = await axios.get(`${this.baseUrl}/get/${lyricsId}`);
      
      log.info('Full lyrics response:', JSON.stringify(response.data, null, 2));
      
      if (response.data) {
        return {
          id: response.data.id,
          artist: response.data.artistName,
          track: response.data.trackName,
          album: response.data.albumName,
          duration: response.data.duration,
          plain_lyrics: response.data.plainLyrics,
          synced_lyrics: response.data.syncedLyrics,
          source: response.data.source
        };
      }
      
      return null;
    } catch (error) {
      log.error(`Error fetching lyrics: ${error.message}`);
      throw new Error('Failed to fetch lyrics');
    }
  }

  parseSyncedLyrics(syncedLyrics) {
    if (!syncedLyrics) return [];
    
    const lines = syncedLyrics.split('\n');
    const parsedLyrics = [];
    
    for (const line of lines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/);
      if (match) {
        const [, minutes, seconds, milliseconds, text] = match;
        const timeInMs = (parseInt(minutes) * 60 + parseInt(seconds)) * 1000 + parseInt(milliseconds.padEnd(3, '0'));
        
        parsedLyrics.push({
          time: timeInMs,
          text: text.trim()
        });
      }
    }
    
    return parsedLyrics.sort((a, b) => a.time - b.time);
  }

  createSimpleTimedLyrics(plainLyrics, duration) {
    if (!plainLyrics) return [];
    
    const lines = plainLyrics.split('\n').filter(line => line.trim().length > 0);
    const simpleSyncedLyrics = [];
    
    if (lines.length === 0) return [];
    
    // Calculate time per line (distribute evenly across the song duration)
    const timePerLine = Math.floor((duration * 1000) / lines.length);
    
    lines.forEach((line, index) => {
      simpleSyncedLyrics.push({
        time: index * timePerLine,
        text: line.trim()
      });
    });
    
    log.info(`Created ${simpleSyncedLyrics.length} simple timed lyrics lines`);
    return simpleSyncedLyrics;
  }

  async getTimedLyrics(artist, track) {
    try {
      log.info(`Getting timed lyrics for: ${artist} - ${track}`);
      
      // First search for lyrics
      const searchResult = await this.searchLyrics(artist, track);
      
      if (!searchResult) {
        log.info('No search results found');
        return {
          found: false,
          message: 'No lyrics found for this track'
        };
      }

      log.info(`Found lyrics with ID: ${searchResult.id}`);

      // Get the full lyrics data
      const lyricsData = await this.getLyrics(searchResult.id);
      
      if (!lyricsData) {
        log.error('Failed to fetch lyrics data');
        return {
          found: false,
          message: 'Failed to fetch lyrics data'
        };
      }

      // Parse synced lyrics
      const syncedLyrics = this.parseSyncedLyrics(lyricsData.synced_lyrics);
      
      log.info(`Parsed ${syncedLyrics.length} synced lyrics lines`);
      
      // If no synced lyrics, try to create simple timed lyrics from plain lyrics
      if (syncedLyrics.length === 0 && lyricsData.plain_lyrics) {
        log.info('No synced lyrics found, creating simple timed lyrics from plain lyrics');
        const simpleSyncedLyrics = this.createSimpleTimedLyrics(lyricsData.plain_lyrics, lyricsData.duration);
        
        return {
          found: true,
          artist: lyricsData.artist,
          track: lyricsData.track,
          album: lyricsData.album,
          duration: lyricsData.duration,
          plainLyrics: lyricsData.plain_lyrics,
          syncedLyrics: simpleSyncedLyrics,
          source: lyricsData.source,
          isSimpleTimed: true
        };
      }
      
      if (syncedLyrics.length === 0) {
        return {
          found: false,
          message: 'No synchronized lyrics available for this track'
        };
      }
      
      return {
        found: true,
        artist: lyricsData.artist,
        track: lyricsData.track,
        album: lyricsData.album,
        duration: lyricsData.duration,
        plainLyrics: lyricsData.plain_lyrics,
        syncedLyrics: syncedLyrics,
        source: lyricsData.source
      };
    } catch (error) {
      log.error(`Error getting timed lyrics: ${error.message}`);
      throw new Error('Failed to get timed lyrics');
    }
  }
}

module.exports = new LyricsService(); 