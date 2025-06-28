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
  const { performance, timeTables, reservationInfos, artists, urlInfos } = res;
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
    urlInfos: urlInfos || [],
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

// API 구현 - 페스티벌
export const fetchFestivals = async (): Promise<Festival[]> => {
  const response = await apiCall<FestivalResponse[]>('/api/admin/performance');
  return response.map(transformFestivalResponse);
};

export const fetchFestivalById = async (id: number): Promise<Festival> => {
  const response = await apiCall<FestivalResponse>(`/api/admin/performance/${id}`);
  return transformFestivalResponse(response);
};

// Helper function to convert form data to API request format
function convertToRequestFormat(festivalData: any, password: string): FestivalCreateRequest {
  const { 
    id, // performanceId
    timeTables = [], 
    reservationInfos = [], 
    urlInfos = [],
    ...performanceInfo 
  } = festivalData;

  // 새 페스티벌 생성 시에는 타임테이블과 예매정보를 제외
  const isNewFestival = !id;

  // 디버깅 로그
  console.log('convertToRequestFormat - input urlInfos:', urlInfos);
  console.log('convertToRequestFormat - festivalData:', festivalData);

  const result = {
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
    urlInfos: urlInfos || [], // null 방지
  };

  console.log('convertToRequestFormat - result urlInfos:', result.urlInfos);
  return result;
}

export const createFestival = async (festival: Omit<Festival, 'id'>, password: string): Promise<void> => {
  const requestData = convertToRequestFormat(festival, password);
  await apiCall('/api/admin/performance', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
};

export const addTimeTable = async (performanceId: number, timeTableData: TimeTableAddRequest): Promise<TimeTableResponse> => {
  return await apiCall<TimeTableResponse>(`/api/admin/performance/${performanceId}/timetable`, {
    method: 'POST',
    body: JSON.stringify(timeTableData),
  });
};

export const deleteTimeTable = async (performanceId: number, timeTableId: number, password: string): Promise<void> => {
  return await apiCall(`/api/admin/performance/${performanceId}/timetable/${timeTableId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': password,
    },
  });
};

export const updateFestival = async (id: number, festivalUpdate: Partial<Festival>, password: string): Promise<Festival> => {
  // urlInfos가 없으면 빈 배열로 설정
  const festivalDataWithDefaults = {
    ...festivalUpdate,
    urlInfos: festivalUpdate.urlInfos || [],
    id
  };
  
  const requestData = convertToRequestFormat(festivalDataWithDefaults, password);
  const response = await apiCall<FestivalResponse>(`/api/admin/performance/${id}`, {
    method: 'PUT',
    body: JSON.stringify(requestData),
  });
  return transformFestivalResponse(response);
};

export const deleteFestival = async (id: number): Promise<void> => {
  return await apiCall(`/api/admin/performance/${id}`, {
    method: 'DELETE',
  });
};

export const updateReservationInfos = async (performanceId: number, reservationInfos: ReservationInfo[], password: string): Promise<void> => {
  // 서버의 List<EditReservationInfoReq> 구조에 맞게 변환
  const reservationInfosForServer = reservationInfos.map(ri => ({
    id: ri.id || null, // id가 없으면 null로 전송
    openDateTime: ri.openDateTime,
    closeDateTime: ri.closeDateTime,
    type: ri.type,
    ticketURL: ri.ticketURL,
    remark: ri.remark || null,
  }));

  return await apiCall(`/api/admin/performance/${performanceId}/reservation`, {
    method: 'PUT',
    body: JSON.stringify(reservationInfosForServer), // password 없이 배열만 전송
  });
};

// API 구현 - 장소
export const fetchPlaces = async (): Promise<Place[]> => {
  return await apiCall<Place[]>('/api/admin/place');
};

export const createPlace = async (placeData: PlaceRequestBody): Promise<Place> => {
  return await apiCall<Place>('/api/admin/place', {
    method: 'POST',
    body: JSON.stringify(placeData),
  });
};

// Helper function to get initial form data for a new festival
export function getInitialFormData(): Festival {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  return {
    id: 0,
    name: '',
    placeId: 0,
    placeName: '',
    placeAddress: '',
    startDate: todayStr,
    endDate: todayStr,
    posterUrl: '',
    banGoods: '',
    transportationInfo: '',
    remark: '',
    timeTables: [],
    reservationInfos: [],
    urlInfos: [],
    artists: [],
  };
} 