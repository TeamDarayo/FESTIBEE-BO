import { Festival, TimeTable, ReservationInfo, FestivalResponse, TimeTableResponse, ReservationInfoResponse, TimeTableArtist, FestivalCreateRequest, TimeTableRequest, ReservationInfoRequest, PerformanceRequest, TimeTableAddRequest } from '@/types/festival';
import { Place, PlaceRequestBody, Hall } from '@/types/place';

// 아티스트 관련 타입 정의
export interface ArtistAlias {
  id: number;
  name: string;
}

export interface Artist {
  id: number;
  name: string;
  description: string;
  imageUrl?: string | null;
  aliases: ArtistAlias[];
}

// API Base URL - 모드에 따라 동적으로 설정
const getApiBaseUrl = () => {
  // 브라우저 환경에서만 실행
  if (typeof window !== 'undefined') {
    // localStorage에서 API 모드 확인
    const apiMode = localStorage.getItem('api-mode');
    
    if (apiMode === 'dev') {
      return process.env.NEXT_PUBLIC_DEV_API_URL;
    } else if (apiMode === 'prod') {
      return process.env.NEXT_PUBLIC_PROD_API_URL;
    }
  }

  // 모드가 설정되지 않은 경우 기존 로직 사용 (fallback)
  // throw new Error('API mode is not set');
  //   const hostname = window.location.hostname;
  //   const port = window.location.port;
    
  //   // localhost에서 실행 중이면 8080 포트로 요청
  //   if (hostname === 'localhost' || hostname === '127.0.0.1') {
  //     return `http://localhost:8080`;
  //   }
  // }
  
  // // 그렇지 않으면 원격 서버로 요청 (현재는 개발 서버만 사용)
  // return 'https://darayo-festival.shop';
};

// 세션에서 저장된 관리자 비밀번호 가져오기
export const getStoredPassword = (): string | null => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('admin-password');
  }
  return null;
};

// 비밀번호 가져오기 (명시적 비밀번호 우선, 없으면 저장된 비밀번호)
export const getPassword = (explicitPassword?: string): string => {
  const password = explicitPassword || getStoredPassword();
  if (!password) {
    throw new Error('관리자 비밀번호가 필요합니다. 먼저 로그인해주세요.');
  }
  return password;
};

// Helper function for API calls
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    // 타임아웃 설정 (30초)
    signal: AbortSignal.timeout(30000),
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
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
    
    // 타임아웃 에러 처리
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.');
    }
    
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

export const createArtist = async (artist: Omit<Artist, 'id'>, password?: string): Promise<Artist> => {
  return await apiCall<Artist>('/api/admin/artist', {
    method: 'POST',
    body: JSON.stringify({
      password: getPassword(password),
      name: artist.name,
      description: artist.description,
      imageUrl: artist.imageUrl || null,
      aliasList: artist.aliases?.map(alias => alias.name) || []
    }),
  });
};

export const updateArtist = async (id: number, artistUpdate: Partial<Artist>, password?: string): Promise<Artist> => {
  return await apiCall<Artist>(`/api/admin/artist/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      password: getPassword(password),
      ...artistUpdate
    }),
  });
};

export const deleteArtist = async (id: number, password?: string): Promise<void> => {
  return await apiCall(`/api/admin/artist/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': getPassword(password),
    },
  });
};

export const updateArtistAlias = async (aliasId: number, alias: string): Promise<ArtistAlias> => {
  return await apiCall<ArtistAlias>(`/api/admin/artist/aliases/${aliasId}`, {
    method: 'PUT',
    body: JSON.stringify({ name: alias }),
  });
};

export const addArtistAliases = async (artistId: number, aliases: string[], password?: string): Promise<ArtistAlias[]> => {
  return await apiCall<ArtistAlias[]>('/api/admin/artist/aliases', {
    method: 'POST',
    body: JSON.stringify({
      password: getPassword(password),
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

// Apple Music 검색 결과 타입
export interface AppleMusicArtist {
  artworkUrl: string | null;
  genreNames: string[];
  name: string;
}

// Apple Music 검색 API
export const searchAppleMusicArtists = async (term: string): Promise<AppleMusicArtist[]> => {
  return await apiCall<AppleMusicArtist[]>(`/api/admin/applemusic/search?term=${encodeURIComponent(term)}&types=artists`);
};

// 아티스트 중복 체크 (이름과 별명 모두 확인)
export const checkArtistDuplicate = async (name: string, excludeId?: number): Promise<{ isDuplicate: boolean; duplicateType: 'name' | 'alias' | null; duplicateName: string | null }> => {
  try {
    const artists = await fetchArtists();
    
    // 이름 중복 체크
    const nameDuplicate = artists.find(artist => 
      artist.name.toLowerCase() === name.toLowerCase() && 
      (!excludeId || artist.id !== excludeId)
    );
    
    if (nameDuplicate) {
      return {
        isDuplicate: true,
        duplicateType: 'name',
        duplicateName: nameDuplicate.name
      };
    }
    
    // 별명 중복 체크
    const aliasDuplicate = artists.find(artist => 
      artist.aliases.some(alias => 
        alias.name.toLowerCase() === name.toLowerCase()
      ) && 
      (!excludeId || artist.id !== excludeId)
    );
    
    if (aliasDuplicate) {
      const duplicateAlias = aliasDuplicate.aliases.find(alias => 
        alias.name.toLowerCase() === name.toLowerCase()
      );
      return {
        isDuplicate: true,
        duplicateType: 'alias',
        duplicateName: duplicateAlias?.name || null
      };
    }
    
    return {
      isDuplicate: false,
      duplicateType: null,
      duplicateName: null
    };
  } catch (error) {
    console.error('Error checking artist duplicate:', error);
    return {
      isDuplicate: false,
      duplicateType: null,
      duplicateName: null
    };
  }
};

// Helper to transform the nested API response to our flat frontend Festival type
const transformFestivalResponse = (res: FestivalResponse, places?: Place[]): Festival => {
  // 응답 구조 검증
  if (!res || !res.performance) {
    console.error('Invalid response structure:', res);
    throw new Error('서버 응답이 올바르지 않습니다.');
  }
  
  const { performance, timeTables = [], reservationInfos = [], artists = [], urlInfos = [] } = res;
  
  // placeName과 placeAddress를 기반으로 placeId 찾기 (더 정확한 매칭)
  let placeId: number | undefined;
  if (places && performance.placeName) {
    let matchingPlace;
    
    // 1. 이름과 주소가 모두 일치하는 경우 (가장 정확)
    if (performance.placeAddress) {
      matchingPlace = places.find(place => 
        place.placeName === performance.placeName && 
        place.address === performance.placeAddress
      );
    }
    
    // 2. 이름만 일치하는 경우 (fallback)
    if (!matchingPlace) {
      matchingPlace = places.find(place => place.placeName === performance.placeName);
    }
    
    placeId = matchingPlace?.id;
    
    // 디버깅 로그
    if (performance.placeName && !placeId) {
      console.warn(`Place not found: ${performance.placeName} (${performance.placeAddress})`);
      console.log('Available places:', places.map(p => ({ id: p.id, name: p.placeName, address: p.address })));
    }
  }
  
  return {
    id: performance.id,
    name: performance.name,
    placeId: placeId,
    placeName: performance.placeName,
    placeAddress: performance.placeAddress,
    startDate: performance.startDate,
    endDate: performance.endDate,
    posterUrl: performance.posterUrl,
    banGoods: performance.banGoods,
    transportationInfo: performance.transportationInfo,
    remark: performance.remark,
    urlInfos: urlInfos || [],
    timeTables: timeTables.map(tt => {
      // performanceHall을 기반으로 hallId 찾기 (매칭된 장소에서만 검색)
      let hallId: number | undefined;
      if (places && tt.performanceHall && placeId) {
        // 매칭된 장소에서 홀 찾기
        const matchingPlace = places.find(place => place.id === placeId);
        if (matchingPlace) {
          const matchingHall = matchingPlace.halls.find(hall => hall.name === tt.performanceHall);
          hallId = matchingHall?.id;
          
          // 디버깅 로그
          if (tt.performanceHall && !hallId) {
            console.warn(`Hall not found in place ${matchingPlace.placeName}: ${tt.performanceHall}`);
            console.log('Available halls:', matchingPlace.halls.map(h => ({ id: h.id, name: h.name })));
          }
        }
      } else if (places && tt.performanceHall) {
        // placeId가 없는 경우 fallback: 모든 장소에서 검색
        const matchingPlace = places.find(place => 
          place.halls.some(hall => hall.name === tt.performanceHall)
        );
        if (matchingPlace) {
          const matchingHall = matchingPlace.halls.find(hall => hall.name === tt.performanceHall);
          hallId = matchingHall?.id;
        }
      }
      
      return {
        id: tt.id,
        performanceDate: tt.performanceDate,
        startTime: tt.startTime,
        endTime: tt.endTime,
        hallId: hallId,
        hallName: tt.performanceHall,
        artists: tt.artists.map(artist => ({
          timetableArtistId: artist.timetableArtistId,
          artistId: artist.artistId,
          artistName: artist.artistName,
          type: artist.type,
        })),
      };
    }),
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
  const [response, places] = await Promise.all([
    apiCall<FestivalResponse[]>('/api/admin/performance'),
    apiCall<Place[]>('/api/admin/place')
  ]);
  return response.map(res => transformFestivalResponse(res, places));
};

export const fetchFestivalById = async (id: number): Promise<Festival> => {
  const [response, places] = await Promise.all([
    apiCall<FestivalResponse>(`/api/admin/performance/${id}`),
    apiCall<Place[]>('/api/admin/place')
  ]);
  return transformFestivalResponse(response, places);
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
    reservationInfos: isNewFestival ? [] : reservationInfos.map((ri: any): ReservationInfoRequest => {
      // 시간 형식 처리: 이미 초가 있으면 그대로, 없으면 :00:00 추가
      const formatDateTime = (dateTime: string) => {
        if (dateTime.includes('Z')) {
          return dateTime.replace('Z', '');
        }
        // HH:MM 형식인지 확인 (초가 없는 경우)
        const timePart = dateTime.split('T')[1];
        if (timePart && timePart.split(':').length === 2) {
          return `${dateTime}:00:00`;
        }
        return dateTime;
      };

      return {
        openDateTime: formatDateTime(ri.openDateTime),
        closeDateTime: formatDateTime(ri.closeDateTime),
        type: ri.type,
        ticketURL: ri.ticketURL,
        remark: ri.remark,
      };
    }),
    urlInfos: urlInfos || [], // null 방지
  };

  console.log('convertToRequestFormat - result urlInfos:', result.urlInfos);
  return result;
}

export const createFestival = async (festival: Omit<Festival, 'id'>, password?: string): Promise<void> => {
  const requestData = convertToRequestFormat(festival, getPassword(password));
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

// 타임테이블 아티스트 추가
export const addTimeTableArtist = async (timetableId: number, artistData: { artistId: number; participationType: string }): Promise<any> => {
  return await apiCall(`/api/admin/timetable/${timetableId}/artist`, {
    method: 'PUT',
    body: JSON.stringify(artistData),
  });
};

// 타임테이블 아티스트 삭제
export const deleteTimeTableArtist = async (timetableId: number, artistId: number): Promise<void> => {
  return await apiCall(`/api/admin/timetable/${timetableId}/artist/${artistId}`, {
    method: 'DELETE',
  });
};

export const updateTimeTable = async (
  performanceId: number,
  timetableId: number, 
  updateData: { 
    performanceDate: string; 
    startTime: string; 
    endTime: string; 
    hallId: number | null;
  },
  password?: string
): Promise<TimeTableResponse> => {
  return await apiCall<TimeTableResponse>(`/api/admin/performance/${performanceId}/timetable/${timetableId}`, {
    method: 'PUT',
    headers: {
      'X-Admin-Password': getPassword(password),
    },
    body: JSON.stringify(updateData),
  });
};

export const deleteTimeTable = async (performanceId: number, timeTableId: number, password?: string): Promise<void> => {
  return await apiCall(`/api/admin/timetable/${timeTableId}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': getPassword(password),
    },
  });
};

export const updateFestival = async (id: number, festivalUpdate: Partial<Festival>, password?: string): Promise<void> => {
  // performance 정보만 추출하여 전송
  const performanceData = {
    id,
    name: festivalUpdate.name,
    placeId: festivalUpdate.placeId,
    startDate: festivalUpdate.startDate,
    endDate: festivalUpdate.endDate,
    posterUrl: festivalUpdate.posterUrl,
    banGoods: festivalUpdate.banGoods,
    transportationInfo: festivalUpdate.transportationInfo,
    remark: festivalUpdate.remark,
  };

  try {
    const response = await apiCall<FestivalResponse>(`/api/admin/performance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(performanceData),
    });
    
    // 디버깅을 위한 로깅
    console.log('updateFestival response:', response);
    console.log('response type:', typeof response);
    console.log('response.performance:', response?.performance);
    
    // 응답이 올바른 구조인지 확인
    if (response && response.performance) {
      // 응답이 있으면 로그만 출력하고 void 반환
      console.log('Update successful with response:', response);
    } else {
      // 서버가 빈 응답을 보내거나 예상과 다른 응답을 보낸 경우
      // 성공적으로 업데이트되었다고 가정
      console.warn('Server returned empty or unexpected response, assuming update was successful');
    }
    // void 함수이므로 아무것도 반환하지 않음
  } catch (error) {
    console.error('Error in updateFestival:', error);
    throw error;
  }
};

export const deleteFestival = async (id: number): Promise<void> => {
  return await apiCall(`/api/admin/performance/${id}`, {
    method: 'DELETE',
  });
};

export const updateReservationInfos = async (performanceId: number, reservationInfos: ReservationInfo[], password?: string): Promise<void> => {
  // 서버의 List<EditReservationInfoReq> 구조에 맞게 변환
  // reservationInfos에는 수정된 항목과 수정되지 않은 기존 항목들이 모두 포함됨
  const reservationInfosForServer = reservationInfos.map(ri => {
    // 시간 형식 처리: 이미 초가 있으면 그대로, 없으면 :00:00 추가
    const formatDateTime = (dateTime: string) => {
      if (dateTime.includes('Z')) {
        return dateTime.replace('Z', '');
      }
      // HH:MM 형식인지 확인 (초가 없는 경우)
      const timePart = dateTime.split('T')[1];
      if (timePart && timePart.split(':').length === 2) {
        return `${dateTime}:00:00`;
      }
      return dateTime;
    };

    return {
      id: ri.id !== undefined ? ri.id : null, // id가 undefined일 때만 null로 전송
      openDateTime: formatDateTime(ri.openDateTime),
      closeDateTime: formatDateTime(ri.closeDateTime),
      type: ri.type,
      ticketURL: ri.ticketURL,
      remark: ri.remark || null,
    };
  });

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

export const updatePlace = async (id: number, placeData: PlaceRequestBody, password?: string): Promise<Place> => {
  return await apiCall<Place>(`/api/admin/place/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      password: getPassword(password),
      ...placeData
    }),
  });
};

export const updateHall = async (hallId: number, hallData: { name: string }, password?: string): Promise<Hall> => {
  return await apiCall<Hall>(`/api/admin/place/hall/${hallId}`, {
    method: 'PUT',
    body: JSON.stringify({
      password: getPassword(password),
      ...hallData
    }),
  });
};

export const addHalls = async (placeId: number, hallNames: string[], password?: string): Promise<Hall[]> => {
  const actualPassword = getPassword(password);
  const results: Hall[] = [];
  for (const name of hallNames) {
    const hall = await apiCall<Hall>(`/api/admin/place/${placeId}/hall`, {
      method: 'POST',
      body: JSON.stringify({
        password: actualPassword,
        name: name
      }),
    });
    results.push(hall);
  }
  return results;
};

export const deletePlace = async (id: number, password?: string): Promise<void> => {
  return await apiCall(`/api/admin/place/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Admin-Password': getPassword(password),
    },
  });
};

// 장소별 홀 목록 가져오기
export const fetchHallsByPlaceId = async (placeId: number): Promise<Hall[]> => {
  const place = await apiCall<Place>(`/api/admin/place/${placeId}`);
  return place.halls || [];
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

// 알람 테스트 API 함수들
export interface AlarmTestRequest {
  type: 'updateReservation' | 'reservation' | 'timetable' | 'guide';
  date: string;
  dayLeft?: number;
}

export const sendAlarmTest = async (request: AlarmTestRequest): Promise<any> => {
  const params = new URLSearchParams({
    type: request.type,
    date: request.date,
    ...(request.dayLeft !== undefined && { dayLeft: request.dayLeft.toString() })
  });
  
  return await apiCall(`/v1/alarm/test?${params.toString()}`);
};

// 크롤링 관리 API 함수들
import { 
  CrawlingJob, 
  SeedPerformance, 
  CrawledPerformance, 
  CrawledPerformanceWithLinks,
  CreatePlaceLinkRequest,
  CreateNewPlaceLinkRequest,
  CreatePerformanceLinkRequest,
  CreateNewPerformanceLinkRequest,
  CreateHallLinkRequest,
  CreateNewHallLinkRequest,
  CreateArtistLinkRequest,
  CreateNewArtistLinkRequest,
  PlaceLink,
  PerformanceLink,
  HallLink,
  ArtistLink,
  ArtistLinkStatus,
  CrawlingSite
} from '@/types/crawling';

// 크롤링 작업 목록 조회
export const fetchCrawlingJobs = async (page: number = 0, size: number = 10): Promise<CrawlingJob[]> => {
  return await apiCall<CrawlingJob[]>(`/admin/crawling/jobs?page=${page}&size=${size}&sort=updatedAt,desc`);
};

// 시드 공연 목록 조회
export const fetchSeedPerformances = async (site: CrawlingSite, page: number = 0, size: number = 3): Promise<SeedPerformance[]> => {
  return await apiCall<SeedPerformance[]>(`/admin/crawling/seed-performances?site=${site}&page=${page}&size=${size}&sort=updatedAt,desc`);
};

// 크롤링된 공연 목록 조회 (연동 정보 포함)
export const fetchCrawledPerformances = async (site: CrawlingSite, page: number = 0, size: number = 10): Promise<CrawledPerformanceWithLinks[]> => {
  return await apiCall<CrawledPerformanceWithLinks[]>(`/admin/crawling/crawled-performances?site=${site}&page=${page}&size=${size}&sort=updatedAt,desc`);
};

// 크롤링된 공연 상세 조회 (연동 정보 포함)
// 개별 조회 API가 없으므로 목록에서 필터링
export const fetchCrawledPerformanceById = async (id: number): Promise<CrawledPerformanceWithLinks | null> => {
  // 모든 사이트에서 검색
  const sites: CrawlingSite[] = ['INTERPARK', 'YES24', 'MELON'];
  
  for (const site of sites) {
    try {
      // 페이지 크기를 크게 해서 한 번에 많이 가져옴
      const data = await apiCall<CrawledPerformanceWithLinks[]>(
        `/admin/crawling/crawled-performances?site=${site}&page=0&size=100`
      );
      const found = data.find(item => item.performance.id === id);
      if (found) return found;
    } catch (err) {
      console.error(`Failed to fetch from ${site}:`, err);
    }
  }
  
  return null;
};

// ========== 장소 연동 API ==========
// 기존 장소에 연동
export const createPlaceLink = async (crawledPerformanceId: number, request: CreatePlaceLinkRequest): Promise<PlaceLink> => {
  return await apiCall<PlaceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/places`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 새 장소 생성 후 연동
export const createNewPlaceLink = async (crawledPerformanceId: number, request: CreateNewPlaceLinkRequest): Promise<PlaceLink> => {
  return await apiCall<PlaceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/places/new`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 장소 자동 연동
export const autoLinkPlace = async (crawledPerformanceId: number): Promise<PlaceLink> => {
  return await apiCall<PlaceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/places/auto`, {
    method: 'POST',
  });
};

// 장소 연동 수정
export const updatePlaceLink = async (crawledPerformanceId: number, performancePlaceId: number, request: { targetPerformancePlaceId?: number; venderPlaceId?: string; site: CrawlingSite }): Promise<PlaceLink> => {
  return await apiCall<PlaceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/places/${performancePlaceId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

// 장소 연동 삭제
export const deletePlaceLink = async (crawledPerformanceId: number, performancePlaceId: number): Promise<void> => {
  return await apiCall(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/places/${performancePlaceId}`, {
    method: 'DELETE',
  });
};

// ========== 공연 연동 API ==========
// 기존 공연에 연동
export const createPerformanceLink = async (crawledPerformanceId: number, request: CreatePerformanceLinkRequest): Promise<PerformanceLink> => {
  return await apiCall<PerformanceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/performances`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 새 공연 생성 후 연동
export const createNewPerformanceLink = async (crawledPerformanceId: number, request: CreateNewPerformanceLinkRequest): Promise<PerformanceLink> => {
  return await apiCall<PerformanceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/performances/new`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 공연 연동 수정
export const updatePerformanceLink = async (crawledPerformanceId: number, performanceId: number, request: CreatePerformanceLinkRequest): Promise<PerformanceLink> => {
  return await apiCall<PerformanceLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/performances/${performanceId}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

// 공연 연동 삭제
export const deletePerformanceLink = async (crawledPerformanceId: number, performanceId: number): Promise<void> => {
  return await apiCall(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/performances/${performanceId}`, {
    method: 'DELETE',
  });
};

// ========== 홀 연동 API ==========
// 기존 홀에 연동
export const createHallLink = async (crawledPerformanceId: number, venderHallName: string, request: CreateHallLinkRequest): Promise<HallLink> => {
  return await apiCall<HallLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/halls/${encodeURIComponent(venderHallName)}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 새 홀 생성 후 연동
export const createNewHallLink = async (crawledPerformanceId: number, venderHallName: string, request: CreateNewHallLinkRequest): Promise<HallLink> => {
  return await apiCall<HallLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/halls/${encodeURIComponent(venderHallName)}/new`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 홀 연동 수정
export const updateHallLink = async (crawledPerformanceId: number, venderHallName: string, request: CreateHallLinkRequest): Promise<HallLink> => {
  return await apiCall<HallLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/halls/${encodeURIComponent(venderHallName)}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

// 홀 연동 삭제
export const deleteHallLink = async (crawledPerformanceId: number, venderHallName: string): Promise<void> => {
  return await apiCall(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/halls/${encodeURIComponent(venderHallName)}`, {
    method: 'DELETE',
  });
};

// ========== 아티스트 연동 API ==========
// 기존 아티스트에 연동
export const createArtistLink = async (crawledPerformanceId: number, venderArtistName: string, request: CreateArtistLinkRequest): Promise<ArtistLink> => {
  return await apiCall<ArtistLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/artists/${encodeURIComponent(venderArtistName)}`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 새 아티스트 생성 후 연동
export const createNewArtistLink = async (crawledPerformanceId: number, venderArtistName: string, request: CreateNewArtistLinkRequest): Promise<ArtistLink> => {
  return await apiCall<ArtistLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/artists/${encodeURIComponent(venderArtistName)}/new`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
};

// 아티스트 자동 연동
export const autoLinkArtists = async (crawledPerformanceId: number): Promise<ArtistLink[]> => {
  return await apiCall<ArtistLink[]>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/artist-links/auto`, {
    method: 'POST',
  });
};

// 아티스트 연동 수정
export const updateArtistLink = async (
  crawledPerformanceId: number,
  venderArtistName: string,
  request: { artistId: number; venderArtistId?: string; site: CrawlingSite; status?: ArtistLinkStatus }
): Promise<ArtistLink> => {
  return await apiCall<ArtistLink>(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/artists/${encodeURIComponent(venderArtistName)}`, {
    method: 'PUT',
    body: JSON.stringify(request),
  });
};

// 아티스트 연동 삭제
export const deleteArtistLink = async (crawledPerformanceId: number, venderArtistName: string): Promise<void> => {
  return await apiCall(`/api/admin/crawling/crawled-performances/${crawledPerformanceId}/links/artists/${encodeURIComponent(venderArtistName)}`, {
    method: 'DELETE',
  });
};

// ========== 검색 API ==========
// 아티스트 검색 (기존 fetchArtists 사용)
// 장소 검색 (기존 fetchPlaces 사용)
// 공연 검색 (기존 fetchFestivals 사용) 
