import { Festival, TimeTable, ReservationInfo, FestivalResponse, TimeTableResponse, ReservationInfoResponse, TimeTableArtist, FestivalCreateRequest, TimeTableRequest, ReservationInfoRequest, PerformanceRequest, TimeTableAddRequest } from '@/types/festival';
import { Place, PlaceRequestBody } from '@/types/place';

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

// 공연(Festival) 관련 타입 정의 - types/festival.ts에서 import하므로 제거
// export interface ArtistInTimeTable {
//   artistId: string;
//   type: string; // Enum (MAIN, SUB)
// }

// export interface TimeTable {
//   id: string;
//   date: string; // Date
//   start: string;
//   end: string;
//   hall: string;
//   artists: ArtistInTimeTable[];
// }

// export interface ReservationInfo {
//   id: string;
//   openDate: string;
//   closeDate: string;
//   ticketUrl: string;
//   type: string;
//   remark: string;
// }

// export interface Festival {
//   id: string;
//   name: string;
//   placeName: string;
//   placeAddress: string;
//   startDate: string;
//   endDate: string;
//   poster: string;
//   bannedItems: string;
//   transportation: string;
//   remark: string;
//   timeTables: TimeTable[];
//   reservationInfos: ReservationInfo[];
// }

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
    id: 1,
    name: "서울 재즈 페스티벌",
    placeName: "올림픽공원",
    placeAddress: "서울 송파구 올림픽로 424",
    startDate: "2024-07-15",
    endDate: "2024-07-17",
    posterUrl: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    banGoods: "음식물, 유리병",
    transportationInfo: "지하철 5호선 올림픽공원역 3번 출구",
    remark: "야외 행사, 우천시 우비 지참",
    timeTables: [
      {
        id: 1,
        performanceDate: "2024-07-15",
        startTime: "18:00",
        endTime: "20:00",
        hallName: "88잔디마당",
        artists: [
          { artistId: 1, type: "MAIN" },
          { artistId: 2, type: "SUB" }
        ]
      }
    ],
    reservationInfos: [
      {
        id: 1,
        openDateTime: "2024-06-01T10:00:00",
        closeDateTime: "2024-07-14T23:59:59",
        ticketURL: "https://ticket.example.com/1",
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
        console.error('Server error details:', errorData);
      } catch {
        // JSON 파싱이 실패하면 기본 에러 메시지 사용
        console.error('Failed to parse error response as JSON');
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

// API 구현 - 아티스트
export const fetchArtists = async (): Promise<Artist[]> => {
  return await apiCall<Artist[]>('/api/admin/artist');
};

export const fetchArtistById = async (id: number): Promise<Artist> => {
  return await apiCall<Artist>(`/api/admin/artist/${id}`);
};

export const createArtist = async (artist: Omit<Artist, 'id'>, password: string): Promise<Artist> => {
  return await apiCall<Artist>('/api/admin/artist', {
    method: 'POST',
    body: JSON.stringify({
      password: password,
      name: artist.name,
      description: artist.description
    }),
  });
};

export const updateArtist = async (id: number, artistUpdate: Partial<Artist>, password: string): Promise<Artist> => {
  return await apiCall<Artist>(`/api/admin/artist/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      password: password,
      ...artistUpdate
    }),
  });
};

export const deleteArtist = async (id: number, password: string): Promise<void> => {
  return await apiCall(`/api/admin/artist/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': password,
    },
  });
};

export const updateArtistAlias = async (aliasId: number, alias: string): Promise<ArtistAlias> => {
  return await apiCall<ArtistAlias>(`/api/admin/artist/aliases/${aliasId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: alias }),
  });
};

export const addArtistAliases = async (artistId: number, aliases: string[], password: string): Promise<ArtistAlias[]> => {
  return await apiCall<ArtistAlias[]>('/api/admin/artist/aliases', {
    method: 'POST',
    body: JSON.stringify({
      password: password,
      artistId: artistId,
      aliases: aliases
    }),
  });
};

export const deleteArtistAlias = async (aliasId: number): Promise<void> => {
  return await apiCall(`/api/admin/artist/aliases/${aliasId}`, {
    method: 'DELETE',
  });
};

// Helper to transform the nested API response to our flat frontend Festival type
const transformFestivalResponse = (res: FestivalResponse): Festival => {
  const { performance, timeTables, reservationInfos, artists } = res;
  return {
    id: performance.id,
    name: performance.name,
    placeName: performance.placeName,
    placeAddress: performance.placeAddress,
    startDate: performance.startDate,
    endDate: performance.endDate,
    posterUrl: performance.posterUrl,
    banGoods: performance.banGoods,
    transportationInfo: performance.transportationInfo,
    remark: performance.remark,
    timeTables: timeTables.map(tt => ({
      id: tt.id,
      performanceDate: tt.performanceDate,
      startTime: tt.startTime,
      endTime: tt.endTime,
      hallName: tt.performanceHall,
      artists: tt.artists.map(artist => ({
        timetableArtistId: artist.timetableArtistId,
        artistId: artist.artistId,
        artistName: artist.artistName,
        type: artist.type,
      })),
    })),
    reservationInfos: reservationInfos.map(ri => ({
      id: ri.id,
      openDateTime: ri.openDateTime,
      closeDateTime: ri.closeDateTime,
      type: ri.type,
      ticketURL: ri.ticketURL,
      remark: ri.remark,
    })),
    artists: artists.map(artist => ({
      id: artist.id,
      displayName: artist.displayName,
    })),
  };
};

export const fetchFestivals = async (): Promise<Festival[]> => {
  const responseData = await apiCall<FestivalResponse[]>('/api/admin/performance');
  return responseData.map(transformFestivalResponse);
};

export const fetchFestivalById = async (id: number): Promise<Festival> => {
  const responseData = await apiCall<FestivalResponse>(`/api/admin/performance/${id}`);
  return transformFestivalResponse(responseData);
};

// Helper function to convert form data to API request format
function convertToRequestFormat(festivalData: any, password: string): FestivalCreateRequest {
  const { 
    id, // performanceId
    timeTables = [], 
    reservationInfos = [], 
    ...performanceInfo 
  } = festivalData;

  // 새 페스티벌 생성 시에는 타임테이블과 예매정보를 제외
  const isNewFestival = !id;

  return {
    password,
    performance: {
      ...(id ? { id } : {}), // id가 있으면 포함
      name: performanceInfo.name,
      placeId: performanceInfo.placeId,
      startDate: performanceInfo.startDate,
      endDate: performanceInfo.endDate,
      posterUrl: performanceInfo.posterUrl,
      banGoods: performanceInfo.banGoods,
      transportationInfo: performanceInfo.transportationInfo,
      remark: performanceInfo.remark,
    },
    timeTables: isNewFestival ? [] : timeTables.map((tt: any): TimeTableRequest => ({
      performanceDate: tt.performanceDate,
      startTime: tt.startTime.length === 4 ? `${tt.startTime.slice(0, 2)}:${tt.startTime.slice(2)}` : tt.startTime,
      endTime: tt.endTime.length === 4 ? `${tt.endTime.slice(0, 2)}:${tt.endTime.slice(2)}` : tt.endTime,
      hallId: tt.hallId || 0, // 실제 hallId 사용, 없으면 0
      artists: (tt.artists as TimeTableArtist[]).map(artist => ({
        artistId: artist.artistId,
        type: artist.type,
      }))
    })),
    reservationInfos: isNewFestival ? [] : reservationInfos.map((ri: any): ReservationInfoRequest => ({
      openDateTime: ri.openDateTime.includes('T') && !ri.openDateTime.includes('Z') ? `${ri.openDateTime}:00Z` : ri.openDateTime,
      closeDateTime: ri.closeDateTime.includes('T') && !ri.closeDateTime.includes('Z') ? `${ri.closeDateTime}:00Z` : ri.closeDateTime,
      type: ri.type,
      ticketURL: ri.ticketURL,
      remark: ri.remark,
    })),
  };
}

export const createFestival = async (festival: Omit<Festival, 'id'>, password: string): Promise<Festival> => {
  const requestBody = convertToRequestFormat(festival, password);
  
  // 디버깅을 위한 로깅
  console.log('API Request Body:', JSON.stringify(requestBody, null, 2));
  
  return await apiCall<Festival>('/api/admin/performance', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

export const addTimeTable = async (performanceId: number, timeTableData: TimeTableAddRequest): Promise<TimeTableResponse> => {
  console.log('addTimeTable called with:', { performanceId, timeTableData });
  
  const requestBody = JSON.stringify(timeTableData);
  console.log('Request body (JSON):', requestBody);
  console.log('Request body (parsed):', JSON.parse(requestBody));
  
  return await apiCall<TimeTableResponse>(`/api/admin/performance/${performanceId}/timetable`, {
    method: 'POST',
    body: requestBody,
  });
};

export const deleteTimeTable = async (performanceId: number, timeTableId: number, password: string): Promise<void> => {
  console.log('deleteTimeTable called with:', { performanceId, timeTableId });
  
  return await apiCall(`/api/admin/performance/${performanceId}/timetable/${timeTableId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': password,
    },
  });
};

export const updateFestival = async (id: number, festivalUpdate: Partial<Festival>, password: string): Promise<Festival> => {
  const requestBody = convertToRequestFormat(festivalUpdate, password);
  return await apiCall<Festival>('/api/admin/performance', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
};

export const deleteFestival = async (id: number): Promise<void> => {
  return await apiCall(`/api/admin/performance/${id}`, {
    method: 'DELETE',
  });
};

export const fetchPlaces = async (): Promise<Place[]> => {
  return await apiCall<Place[]>('/api/admin/place');
};

export const createPlace = async (placeData: PlaceRequestBody): Promise<Place> => {
  return await apiCall<Place>('/api/admin/place', {
    method: 'POST',
    body: JSON.stringify(placeData),
  });
}; 