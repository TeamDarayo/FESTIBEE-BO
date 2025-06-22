// 아티스트 관련 타입 정의
export interface ArtistAlias {
  id: number;
  name: string;
}

export interface Artist {
  id: number;
  name: string;
  description: string;
  aliases: ArtistAlias[];
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
    id: 1,
    name: "IU",
    description: "이지은은 대한민국의 가수이자 배우이다. 2008년 9월 18일, 15세의 나이에 가수로 데뷔했다.",
    aliases: [
      { id: 1, name: "아이유" },
      { id: 2, name: "이지은" }
    ]
  },
  {
    id: 2,
    name: "BTS",
    description: "BTS는 대한민국의 7인조 보이 그룹이다. 2013년 6월 13일 데뷔했다.",
    aliases: [
      { id: 3, name: "방탄소년단" },
      { id: 4, name: "Bangtan Boys" }
    ]
  },
  {
    id: 3,
    name: "BLACKPINK",
    description: "BLACKPINK는 YG엔터테인먼트 소속의 4인조 걸 그룹이다. 2016년 8월 8일 데뷔했다.",
    aliases: [
      { id: 5, name: "블랙핑크" }
    ]
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
let festivals: any[] = [...mockFestivals];

// API Base URL - 환경에 따라 동적으로 설정
const getApiBaseUrl = () => {
  // 브라우저 환경에서 현재 호스트가 localhost인지 확인
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // localhost에서 실행 중이면 8080 포트로 요청
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `http://localhost:8080`;
    }
  }
  
  // 그렇지 않으면 원격 서버로 요청
  return 'https://festival-app-358499057731.asia-northeast3.run.app';
};

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
    ? 'http://localhost:8080' 
    : 'https://dals2bo.com';

  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      // 서버에서 에러 응답을 받았을 때
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      try {
        // 서버에서 JSON 형태로 에러 메시지를 보냈을 경우
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        // JSON 파싱이 실패하면 기본 에러 메시지 사용
      }
      
      throw new Error(errorMessage);
    }
    
    // 응답이 비어있을 수 있음 (DELETE 요청 등)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
}

// Mock API 구현 - 아티스트 (개발용)
export const fetchArtists = async (): Promise<Artist[]> => {
  // 실제 API 호출 시도
  try {
    return await apiCall<Artist[]>('/artists');
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

export const fetchArtistById = async (id: number): Promise<Artist> => {
  try {
    return await apiCall<Artist>(`/artists/${id}`);
  } catch (error) {
    console.warn('Using mock data for artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const artist = artists.find(a => a.id === id);
        if (!artist) {
          reject(new Error('Artist not found'));
          return;
        }
        resolve(artist);
      }, 500);
    });
  }
};

export const createArtist = async (artist: Omit<Artist, 'id'>, password: string): Promise<Artist> => {
  try {
    return await apiCall<Artist>('/artists', {
      method: 'POST',
      body: JSON.stringify({
        ...artist,
        password: password
      }),
    });
  } catch (error) {
    console.warn('Using mock data for create artist:', error);
    return new Promise((resolve) => {
      setTimeout(() => {
        const newArtist: Artist = {
          ...artist,
          id: artists.length + 1,
        };
        artists.push(newArtist);
        resolve(newArtist);
      }, 500);
    });
  }
};

export const updateArtist = async (id: number, artistUpdate: Partial<Artist>, password: string): Promise<Artist> => {
  try {
    return await apiCall<Artist>(`/artists/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...artistUpdate,
        password: password
      }),
    });
  } catch (error) {
    console.warn('Using mock data for update artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = artists.findIndex(a => a.id === id);
        if (index === -1) {
          reject(new Error('Artist not found'));
          return;
        }
        
        artists[index] = {
          ...artists[index],
          ...artistUpdate,
        };
        
        resolve(artists[index]);
      }, 500);
    });
  }
};

export const deleteArtist = async (id: number, password: string): Promise<void> => {
  try {
    await apiCall(`/artists/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ password: password }),
    });
  } catch (error) {
    console.warn('Using mock data for delete artist:', error);
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const index = artists.findIndex(a => a.id === id);
        if (index === -1) {
          reject(new Error('Artist not found'));
          return;
        }
        
        artists = artists.filter(a => a.id !== id);
        resolve();
      }, 500);
    });
  }
};

// Helper to transform the nested API response to our flat frontend Festival type
const transformFestivalResponse = (res: FestivalResponse): Festival => {
  const { performance, timeTables, reservationInfos, artists } = res;
  return {
    ...performance,
    timeTables: timeTables.map(tt => ({
      ...tt,
      id: tt.id,
      hallName: tt.performanceHall,
      artists: tt.artists.map(artist => ({
        ...artist
      })),
    })),
    reservationInfos: reservationInfos.map(ri => ({
      ...ri,
      id: ri.id,
    })),
    artists: artists.map(artist => ({
      ...artist
    })),
  };
};

export const fetchFestivals = async (): Promise<Festival[]> => {
  const responseData = await apiCall<FestivalResponse[]>('/api/admin/performance');
  return responseData.map(transformFestivalResponse);
};

export const fetchFestivalById = async (id: string): Promise<Festival> => {
  try {
    return await apiCall<Festival>(`/api/admin/performance/${id}`);
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

const DUMMY_ARTIST_ID = 0; // Replace with actual artist ID logic
const DUMMY_HALL_ID = 0; // Replace with actual hall ID logic
const DUMMY_PLACE_ID = 0; // Replace with actual place ID logic

// Helper function to convert form data to API request format
function convertToRequestFormat(festivalData: any, password: string) {
  const { 
    timeTables = [], 
    reservationInfos = [], 
    ...performanceInfo 
  } = festivalData;

  return {
    password,
    performance: {
      name: performanceInfo.name,
      placeId: performanceInfo.placeId,
      startDate: performanceInfo.startDate,
      endDate: performanceInfo.endDate,
      posterUrl: performanceInfo.posterUrl,
      banGoods: performanceInfo.banGoods,
      transportationInfo: performanceInfo.transportationInfo,
      remark: performanceInfo.remark,
    },
    timeTables: timeTables.map((tt: any) => ({
      performanceDate: tt.performanceDate,
      startTime: tt.startTime,
      endTime: tt.endTime,
      hallId: DUMMY_HALL_ID,
      artists: (tt.artists as TimeTableArtist[]).map(artist => ({
        artistId: artist.artistId,
        type: artist.type,
      }))
    })),
    reservationInfos: reservationInfos.map((ri: any) => ({
      openDateTime: ri.openDateTime,
      closeDateTime: ri.closeDateTime,
      type: ri.type,
      ticketURL: ri.ticketURL,
      remark: ri.remark,
    })),
  };
}

export const createFestival = async (festival: Omit<Festival, 'id'>, password: string): Promise<Festival> => {
  // Always try the real API call first
  const requestBody = convertToRequestFormat(festival, password);
  return await apiCall<Festival>('/api/admin/performance', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

export const updateFestival = async (id: number, festivalUpdate: Partial<Festival>, password: string): Promise<Festival> => {
  const requestBody = convertToRequestFormat(festivalUpdate, password);
  return await apiCall<Festival>(`/api/admin/performance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestBody),
  });
};

export const deleteFestival = async (id: number, password: string): Promise<void> => {
  return await apiCall(`/api/admin/performance/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ password: password }),
  });
};

import { Place, PlaceRequestBody } from '@/types/place';

export const fetchPlaces = async (): Promise<Place[]> => {
  return await apiCall<Place[]>('/api/admin/place');
};

export const createPlace = async (placeData: PlaceRequestBody, password: string): Promise<Place> => {
  return await apiCall<Place>('/api/admin/place', {
    method: 'POST',
    body: JSON.stringify({
      ...placeData,
      password, // Assuming password is required as per convention
    }),
  });
}; 