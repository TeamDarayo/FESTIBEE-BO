// 아티스트 관련 타입 정의
export interface Artist {
  artistId: string;
  name: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

// 공연(Festival) 관련 타입 정의
export interface ArtistInTimeTable {
  artistId: string;
  type: string; // Enum (MAIN, SUB)
}

export interface TimeTable {
  id: string;
  date: string; // Date
  start: string;
  end: string;
  hall: string;
  artists: ArtistInTimeTable[];
}

export interface ReservationInfo {
  id: string;
  openDate: string;
  closeDate: string;
  ticketUrl: string;
  type: string;
  remark: string;
}

export interface Festival {
  id: string;
  name: string;
  placeName: string;
  placeAddress: string;
  startDate: string;
  endDate: string;
  poster: string;
  bannedItems: string;
  transportation: string;
  remark: string;
  timeTables: TimeTable[];
  reservationInfos: ReservationInfo[];
}

// Mock 데이터 - 아티스트
const mockArtists: Artist[] = [
  {
    artistId: "a1",
    name: "IU",
    image: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    artistId: "a2",
    name: "BTS",
    image: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    artistId: "a3",
    name: "BLACKPINK",
    image: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock 데이터 - 공연
const mockFestivals: Festival[] = [
  {
    id: "1",
    name: "서울 재즈 페스티벌",
    placeName: "올림픽공원",
    placeAddress: "서울 송파구 올림픽로 424",
    startDate: "2024-07-15",
    endDate: "2024-07-17",
    poster: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    bannedItems: "음식물, 유리병",
    transportation: "지하철 5호선 올림픽공원역 3번 출구",
    remark: "야외 행사, 우천시 우비 지참",
    timeTables: [
      {
        id: "tt1",
        date: "2024-07-15",
        start: "18:00",
        end: "20:00",
        hall: "88잔디마당",
        artists: [
          { artistId: "a1", type: "MAIN" },
          { artistId: "a2", type: "SUB" }
        ]
      }
    ],
    reservationInfos: [
      {
        id: "r1",
        openDate: "2024-06-01T10:00:00",
        closeDate: "2024-07-14T23:59:59",
        ticketUrl: "https://ticket.example.com/1",
        type: "얼리버드",
        remark: "선착순"
      }
    ]
  }
];

let artists = [...mockArtists];
let festivals = [...mockFestivals];

// API Base URL
const API_BASE_URL = 'https://festival-app-358499057731.asia-northeast3.run.app';

// Helper function for API calls
async function apiCall<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Mock API 구현 - 아티스트 (개발용)
export const fetchArtists = async (): Promise<Artist[]> => {
  // 실제 API 호출 시도
  try {
    return await apiCall<Artist[]>('/api/artists');
  } catch (error) {
    console.warn('Using mock data for artists:', error);
    // API 호출 실패 시 mock 데이터 반환
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(artists);
      }, 500);
    });
  }
};

export const fetchArtistById = async (artistId: string): Promise<Artist> => {
  try {
    return await apiCall<Artist>(`/api/artists/${artistId}`);
  } catch (error) {
    console.warn('Using mock data for artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const artist = artists.find(a => a.artistId === artistId);
        if (!artist) {
          reject(new Error('Artist not found'));
          return;
        }
        resolve(artist);
      }, 500);
    });
  }
};

export const createArtist = async (artist: Omit<Artist, 'artistId' | 'createdAt' | 'updatedAt'>): Promise<Artist> => {
  try {
    return await apiCall<Artist>('/api/artists', {
      method: 'POST',
      body: JSON.stringify(artist),
    });
  } catch (error) {
    console.warn('Using mock data for create artist:', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newArtist: Artist = {
          ...artist,
          artistId: (artists.length + 1).toString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        artists.push(newArtist);
        resolve(newArtist);
      }, 500);
    });
  }
};

export const updateArtist = async (artistId: string, artistUpdate: Partial<Artist>): Promise<Artist> => {
  try {
    return await apiCall<Artist>(`/api/artists/${artistId}`, {
      method: 'PUT',
      body: JSON.stringify(artistUpdate),
    });
  } catch (error) {
    console.warn('Using mock data for update artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = artists.findIndex(a => a.artistId === artistId);
        if (index === -1) {
          reject(new Error('Artist not found'));
          return;
        }
        
        artists[index] = {
          ...artists[index],
          ...artistUpdate,
          updatedAt: new Date().toISOString(),
        };
        
        resolve(artists[index]);
      }, 500);
    });
  }
};

export const deleteArtist = async (artistId: string): Promise<void> => {
  try {
    await apiCall(`/api/artists/${artistId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Using mock data for delete artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = artists.findIndex(a => a.artistId === artistId);
        if (index === -1) {
          reject(new Error('Artist not found'));
          return;
        }
        
        artists = artists.filter(a => a.artistId !== artistId);
        resolve();
      }, 500);
    });
  }
};

// Mock API 구현 - 공연
export const fetchFestivals = async (): Promise<Festival[]> => {
  try {
    return await apiCall<Festival[]>('/api/festivals');
  } catch (error) {
    console.warn('Using mock data for festivals:', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(festivals);
      }, 500);
    });
  }
};

export const fetchFestivalById = async (id: string): Promise<Festival> => {
  try {
    return await apiCall<Festival>(`/api/festivals/${id}`);
  } catch (error) {
    console.warn('Using mock data for festival:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const festival = festivals.find(f => f.id === id);
        if (!festival) {
          reject(new Error('Festival not found'));
          return;
        }
        resolve(festival);
      }, 500);
    });
  }
};

export const createFestival = async (festival: Omit<Festival, 'id'>): Promise<Festival> => {
  try {
    return await apiCall<Festival>('/api/festivals', {
      method: 'POST',
      body: JSON.stringify(festival),
    });
  } catch (error) {
    console.warn('Using mock data for create festival:', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newFestival: Festival = {
          ...festival,
          id: (festivals.length + 1).toString(),
        };
        festivals.push(newFestival);
        resolve(newFestival);
      }, 500);
    });
  }
};

export const updateFestival = async (id: string, festivalUpdate: Partial<Festival>): Promise<Festival> => {
  try {
    return await apiCall<Festival>(`/api/festivals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(festivalUpdate),
    });
  } catch (error) {
    console.warn('Using mock data for update festival:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = festivals.findIndex(f => f.id === id);
        if (index === -1) {
          reject(new Error('Festival not found'));
          return;
        }
        
        festivals[index] = {
          ...festivals[index],
          ...festivalUpdate,
        };
        
        resolve(festivals[index]);
      }, 500);
    });
  }
};

export const deleteFestival = async (id: string): Promise<void> => {
  try {
    await apiCall(`/api/festivals/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('Using mock data for delete festival:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = festivals.findIndex(f => f.id === id);
        if (index === -1) {
          reject(new Error('Festival not found'));
          return;
        }
        festivals = festivals.filter(f => f.id !== id);
        resolve();
      }, 500);
    });
  }
}; 