export interface SpotifyImage {
  url: string
  height: number
  width: number
}

export interface SpotifyArtist {
  id: string
  name: string
  external_urls: {
    spotify: string
  }
  images?: SpotifyImage[]
}

export interface SpotifyTrack {
  id: string
  name: string
  artists: SpotifyArtist[]
  album: {
    id: string
    name: string
    images: SpotifyImage[]
    external_urls: {
      spotify: string
    }
  }
  external_urls: {
    spotify: string
  }
  duration_ms: number
  played_at?: string
}

export interface SpotifyUser {
  id: string
  display_name: string
  external_urls: {
    spotify: string
  }
  images: SpotifyImage[]
  followers: {
    total: number
  }
}

export interface SpotifyTopTracksResponse {
  items: SpotifyTrack[]
  total: number
}

export interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[]
  total: number
}

export interface SpotifyRecentlyPlayedResponse {
  items: Array<{
    track: SpotifyTrack
    played_at: string
  }>
}

