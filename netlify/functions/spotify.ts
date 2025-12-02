import type { Config } from "@netlify/functions"
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
 * 
 * SPOTIFY_REFRESH_TOKEN là gì?
 * - Khi bạn authorize Spotify app lần đầu, bạn nhận được:
 *   1. Access Token (hết hạn sau 1 giờ)
 *   2. Refresh Token (không bao giờ hết hạn, dùng để lấy Access Token mới)
 * 
 * Cách lấy Refresh Token:
 * 1. Tạo app tại https://developer.spotify.com/dashboard
 * 2. Lấy Client ID và Client Secret
 * 3. Authorize app và lấy refresh token (xem hướng dẫn trong README hoặc scripts/)
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
      throw new Error(
        `Failed to get access token: ${response.status} ${response.statusText}. ${errorData.error_description || ""}`,
      )
    }

    const data = await response.json()
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
const mapTrack = (track: any, playedAt?: string) => {
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
 * Main handler function
 */
export default async () => {
  // Kiểm tra credentials - nếu không có thì trả về thông báo không có data (không phải lỗi)
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
    return new Response(
      JSON.stringify({
        error: false,
        notConfigured: true,
        message: "Spotify chưa được cấu hình. Vui lòng thêm credentials vào environment variables.",
        user: null,
        topTracks: [],
        topArtists: [],
        recentTracks: [],
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
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
    }

    // Format tracks và artists
    const formattedTopTracks = (topTracks.items || [])
      .map((track) => mapTrack(track))
      .filter((track) => track !== null)

    const formattedTopArtists = (topArtists.items || [])
      .map((artist) => mapArtist(artist))
      .filter((artist) => artist !== null)

    const formattedRecentTracks = (recentlyPlayed.items || [])
      .map((item) => mapTrack(item.track, item.played_at))
      .filter((track) => track !== null)

    // Kiểm tra bài hát đang phát
    try {
      const currentlyPlaying = await spotifyApi<any>(
        `/me/player/currently-playing`,
        accessToken,
      )

      if (currentlyPlaying?.is_playing && currentlyPlaying?.item) {
        const currentTrack = mapTrack(currentlyPlaying.item)
        if (currentTrack) {
          currentTrack.nowPlaying = true

          // Thêm vào đầu danh sách recent tracks nếu chưa có
          const exists = formattedRecentTracks.some(
            (t) =>
              t &&
              t.name === currentTrack.name &&
              t.artist === currentTrack.artist,
          )

          if (!exists) {
            formattedRecentTracks.unshift(currentTrack)
          }
        }
      }
    } catch (error: any) {
      // Nếu không có bài hát nào đang phát, bỏ qua lỗi
      console.log("No track currently playing or error:", error.message)
    }

    // Trả về response
    return new Response(
      JSON.stringify({
        user: formattedUserInfo,
        topTracks: formattedTopTracks,
        topArtists: formattedTopArtists,
        recentTracks: formattedRecentTracks,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300", // Cache 5 phút
        },
      },
    )
  } catch (error: any) {
    console.error("Spotify API error:", error)

    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Failed to fetch Spotify data",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: error.statusCode || 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

export const config: Config = {
  path: "/api/spotify",
}
