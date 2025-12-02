/**
 * Cloudflare Worker - Spotify API Proxy
 * 
 * Deploy lên Cloudflare Workers (miễn phí 100,000 requests/ngày)
 * 
 * Cách deploy:
 * 1. Vào https://dash.cloudflare.com/ → Workers & Pages → Create
 * 2. Tạo Worker mới, paste code này vào
 * 3. Thêm Environment Variables:
 *    - SPOTIFY_CLIENT_ID
 *    - SPOTIFY_CLIENT_SECRET
 *    - SPOTIFY_REFRESH_TOKEN
 * 4. Deploy và lấy URL (ví dụ: https://spotify-api.your-account.workers.dev)
 * 5. Cập nhật SPOTIFY_API_URL trong nuxt.config.ts
 */

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// Lấy Access Token từ Refresh Token
async function getAccessToken(env) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: env.SPOTIFY_REFRESH_TOKEN,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get access token');
  }

  const data = await response.json();
  return data.access_token;
}

// Gọi Spotify API
async function spotifyApi(endpoint, accessToken) {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 204) return null;
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}

// Map track data
function mapTrack(track, playedAt, progress) {
  if (!track) return null;
  return {
    name: track.name || 'Unknown Track',
    artist: track.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    image: track.album?.images?.find(img => img.height === 300)?.url ||
           track.album?.images?.[0]?.url || '',
    url: track.external_urls?.spotify || '',
    date: playedAt ? new Date(playedAt).getTime() : Date.now(),
    nowPlaying: false,
    duration: track.duration_ms || 0,
    progress: progress || 0,
  };
}

// Map artist data
function mapArtist(artist) {
  if (!artist) return null;
  return {
    name: artist.name || 'Unknown Artist',
    image: artist.images?.find(img => img.height === 300)?.url ||
           artist.images?.[0]?.url || '',
    url: artist.external_urls?.spotify || '',
    plays: 0,
  };
}

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Kiểm tra credentials
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET || !env.SPOTIFY_REFRESH_TOKEN) {
      return new Response(JSON.stringify({
        error: false,
        notConfigured: true,
        message: 'Spotify chưa được cấu hình',
        user: null,
        topTracks: [],
        topArtists: [],
        recentTracks: [],
        currentlyPlaying: null,
      }), { headers: corsHeaders });
    }

    try {
      const accessToken = await getAccessToken(env);

      // Fetch data song song
      const [user, topTracks, topArtists, recentlyPlayed] = await Promise.all([
        spotifyApi('/me', accessToken),
        spotifyApi('/me/top/tracks?limit=6&time_range=short_term', accessToken),
        spotifyApi('/me/top/artists?limit=4&time_range=short_term', accessToken),
        spotifyApi('/me/player/recently-played?limit=14', accessToken),
      ]);

      // Format user info
      const formattedUserInfo = {
        name: user.display_name || user.id || 'Unknown User',
        image: user.images?.[0]?.url || '',
        url: user.external_urls?.spotify || '',
        totalPlays: 0,
        registered: 0,
        followers: user.followers?.total || 0,
        id: user.id,
      };

      // Format tracks và artists
      const formattedTopTracks = (topTracks.items || [])
        .map(track => mapTrack(track))
        .filter(Boolean);

      const formattedTopArtists = (topArtists.items || [])
        .map(artist => mapArtist(artist))
        .filter(Boolean);

      const formattedRecentTracks = (recentlyPlayed.items || [])
        .map(item => mapTrack(item.track, item.played_at))
        .filter(Boolean);

      // Currently playing
      let currentlyPlayingTrack = null;
      let totalListeningTime = 0;

      try {
        const currentlyPlaying = await spotifyApi('/me/player/currently-playing', accessToken);
        if (currentlyPlaying?.is_playing && currentlyPlaying?.item) {
          const progress = currentlyPlaying.progress_ms || 0;
          currentlyPlayingTrack = mapTrack(currentlyPlaying.item, undefined, progress);
          if (currentlyPlayingTrack) {
            currentlyPlayingTrack.nowPlaying = true;
          }
        }
      } catch (e) {
        // No track playing
      }

      // Tính total listening time
      const allTracks = [...formattedTopTracks, ...formattedRecentTracks];
      totalListeningTime = allTracks.reduce((total, track) => total + (track?.duration || 0), 0);

      return new Response(JSON.stringify({
        user: formattedUserInfo,
        topTracks: formattedTopTracks,
        topArtists: formattedTopArtists,
        recentTracks: formattedRecentTracks,
        currentlyPlaying: currentlyPlayingTrack,
        totalListeningTime,
      }), {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'public, max-age=60', // Cache 1 phút
        },
      });

    } catch (error) {
      return new Response(JSON.stringify({
        error: true,
        message: error.message || 'Failed to fetch Spotify data',
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};

