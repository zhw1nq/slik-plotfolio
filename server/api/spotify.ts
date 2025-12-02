import type {
  SpotifyUser,
  SpotifyTopTracksResponse,
  SpotifyTopArtistsResponse,
  SpotifyRecentlyPlayedResponse,
} from "~/types/Response/spotify"

// Environment variables
const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const SPOTIFY_REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN

/**
 * Lấy Access Token từ Spotify bằng Refresh Token
 */
async function getAccessToken(): Promise<string> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    throw new Error(
      "Spotify credentials not configured. Please set SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, and SPOTIFY_REFRESH_TOKEN in environment variables.",
    )
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`,
        ).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: SPOTIFY_REFRESH_TOKEN,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error_description || errorData.error || "Unknown error"
      
      // Nếu refresh token invalid, trả về thông báo rõ ràng hơn
      if (response.status === 400) {
        if (errorMsg.includes("refresh_token") || errorMsg.includes("Invalid refresh token")) {
          throw new Error(
            `Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng lấy refresh token mới bằng cách chạy: node scripts/get-spotify-refresh-token-server.js`,
          )
        }
        if (errorMsg.includes("invalid_grant")) {
          throw new Error(
            `Refresh token đã hết hạn hoặc bị revoke. Vui lòng authorize lại và lấy refresh token mới.`,
          )
        }
      }
      
      throw new Error(
        `Failed to get access token: ${response.status} ${response.statusText}. ${errorMsg}`,
      )
    }

    const data = await response.json()
    
    // Lưu ý: Spotify có thể trả về refresh_token mới trong response
    // Nếu có refresh_token mới, nên cập nhật vào env (nhưng trong server code không thể tự động update env)
    // Refresh token mới chỉ được trả về trong một số trường hợp nhất định
    if (data.refresh_token) {
      console.log("⚠️  Spotify trả về refresh_token mới. Nên cập nhật SPOTIFY_REFRESH_TOKEN trong env nếu cần.")
      // Trong production, có thể log để admin biết cần update
    }
    
    return data.access_token
  } catch (error: any) {
    throw new Error(`Error getting access token: ${error.message}`)
  }
}

/**
 * Helper function để gọi Spotify Web API
 */
async function spotifyApi<T>(
  endpoint: string,
  accessToken: string,
): Promise<T> {
  const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    // Handle 401 (unauthorized) - token expired
    if (response.status === 401) {
      throw new Error("Access token expired or invalid")
    }
    // Handle 403 (forbidden) - missing scopes
    if (response.status === 403) {
      throw new Error(
        "Missing required scopes. Please re-authorize with all required scopes.",
      )
    }
    // Handle 429 (rate limit)
    if (response.status === 429) {
      const retryAfter = response.headers.get("Retry-After")
      throw new Error(
        `Rate limit exceeded. Retry after ${retryAfter || "unknown"} seconds.`,
      )
    }

    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      `Spotify API error (${response.status}): ${errorData.error?.message || response.statusText}`,
    )
  }

  return response.json()
}

/**
 * Chuyển đổi Spotify Track sang format chung
 */
const mapTrack = (track: any, playedAt?: string, progress?: number) => {
  if (!track) return null

  return {
    name: track.name || "Unknown Track",
    artist:
      track.artists?.map((a: any) => a.name).join(", ") || "Unknown Artist",
    image:
      track.album?.images?.find((img: any) => img.height === 300)?.url ||
      track.album?.images?.find((img: any) => img.height === 640)?.url ||
      track.album?.images?.[0]?.url ||
      "",
    url: track.external_urls?.spotify || "",
    date: playedAt ? new Date(playedAt).getTime() : Date.now(),
    nowPlaying: false,
    duration: track.duration_ms || 0, // Thời lượng bài hát (ms)
    progress: progress || 0, // Tiến độ đang phát (ms) - chỉ cho currently playing
  }
}

/**
 * Chuyển đổi Spotify Artist sang format chung
 */
const mapArtist = (artist: any) => {
  if (!artist) return null

  return {
    name: artist.name || "Unknown Artist",
    image:
      artist.images?.find((img: any) => img.height === 300)?.url ||
      artist.images?.find((img: any) => img.height === 640)?.url ||
      artist.images?.[0]?.url ||
      "",
    url: artist.external_urls?.spotify || "",
    plays: 0, // Spotify API không cung cấp play count cho top artists
  }
}

/**
 * Nuxt Server API Route Handler
 */
export default defineEventHandler(async (event) => {
  // Kiểm tra credentials - nếu không có thì trả về thông báo không có data (không phải lỗi)
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return {
      error: false,
      notConfigured: true,
      message: "Spotify chưa được cấu hình. Vui lòng thêm credentials vào environment variables.",
      user: null,
      topTracks: [],
      topArtists: [],
      recentTracks: [],
    }
  }

  try {
    // Lấy access token
    const accessToken = await getAccessToken()

    // Lấy dữ liệu từ Spotify API (song song để tăng tốc độ)
    const [user, topTracks, topArtists, recentlyPlayed] = await Promise.all([
      spotifyApi<SpotifyUser>(`/me`, accessToken),
      spotifyApi<SpotifyTopTracksResponse>(
        `/me/top/tracks?limit=6&time_range=short_term`,
        accessToken,
      ),
      spotifyApi<SpotifyTopArtistsResponse>(
        `/me/top/artists?limit=4&time_range=short_term`,
        accessToken,
      ),
      spotifyApi<SpotifyRecentlyPlayedResponse>(
        `/me/player/recently-played?limit=14`,
        accessToken,
      ),
    ])

    // Format user info
    const formattedUserInfo = {
      name: user.display_name || user.id || "Unknown User",
      image: user.images?.[0]?.url || "",
      url: user.external_urls?.spotify || "",
      totalPlays: 0, // Spotify API không cung cấp total play count
      registered: 0, // Spotify API không cung cấp registration date
      followers: user.followers?.total || 0, // Số lượng followers
      id: user.id, // Spotify user ID
    }

    // Format tracks và artists
    const formattedTopTracks = (topTracks.items || [])
      .map((track) => mapTrack(track, undefined, undefined))
      .filter((track) => track !== null)

    const formattedTopArtists = (topArtists.items || [])
      .map((artist) => mapArtist(artist))
      .filter((artist) => artist !== null)

    const formattedRecentTracks = (recentlyPlayed.items || [])
      .map((item) => mapTrack(item.track, item.played_at, undefined))
      .filter((track) => track !== null)

    // Kiểm tra bài hát đang phát và player state
    let currentlyPlayingTrack = null
    let totalListeningTime = 0

    try {
      const currentlyPlaying = await spotifyApi<any>(
        `/me/player/currently-playing`,
        accessToken,
      )

      if (currentlyPlaying?.is_playing && currentlyPlaying?.item) {
        const progress = currentlyPlaying.progress_ms || 0
        currentlyPlayingTrack = mapTrack(
          currentlyPlaying.item,
          undefined,
          progress,
        )
        if (currentlyPlayingTrack) {
          currentlyPlayingTrack.nowPlaying = true

          // Thêm vào đầu danh sách recent tracks nếu chưa có
          const exists = formattedRecentTracks.some(
            (t) =>
              t &&
              t.name === currentlyPlayingTrack.name &&
              t.artist === currentlyPlayingTrack.artist,
          )

          if (!exists) {
            formattedRecentTracks.unshift(currentlyPlayingTrack)
          }
        }
      }
    } catch (error: any) {
      // Nếu không có bài hát nào đang phát, bỏ qua lỗi
      console.log("No track currently playing or error:", error.message)
    }

    // Tính tổng thời gian nghe từ top tracks và recent tracks
    const allTracks = [...formattedTopTracks, ...formattedRecentTracks]
    totalListeningTime = allTracks.reduce((total, track) => {
      return total + (track?.duration || 0)
    }, 0)

    // Trả về response
    return {
      user: formattedUserInfo,
      topTracks: formattedTopTracks,
      topArtists: formattedTopArtists,
      recentTracks: formattedRecentTracks,
      currentlyPlaying: currentlyPlayingTrack,
      totalListeningTime, // Tổng thời gian (ms)
    }
  } catch (error: any) {
    console.error("Spotify API error:", error)

    // Nếu lỗi liên quan đến refresh token, trả về notConfigured để hiển thị thông báo thân thiện
    if (error.message?.includes("refresh token") || error.message?.includes("Refresh token")) {
      return {
        error: false,
        notConfigured: true,
        message: error.message || "Refresh token không hợp lệ. Vui lòng lấy refresh token mới.",
        user: null,
        topTracks: [],
        topArtists: [],
        recentTracks: [],
      }
    }

    return {
      error: true,
      message: error.message || "Failed to fetch Spotify data",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    }
  }
})

