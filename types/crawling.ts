// 크롤링 관련 타입 정의

// 크롤링 작업 상태
export type CrawlingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// 크롤링 사이트
export type CrawlingSite = 'INTERPARK' | 'YES24' | 'MELON';

// 아티스트 연동 상태
export type ArtistLinkStatus = 'PENDING' | 'TEMP' | 'TEMP_WITH_NEW_ARTIST' | 'CONFIRMED';

// 공연 연동 항목
export type CrawlingLinkItem = 'BASIC' | 'PERFORMANCE_DATE' | 'RESERVATION_INFO' | 'TIMETABLE';

// 크롤링 작업
export interface CrawlingJob {
  id: number;
  status: CrawlingStatus;
  url: string;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// 시드 공연 데이터
export interface SeedPerformanceData {
  venderId: string;
  isOpen: boolean;
  title: string;
  detailUrl: string;
  posterUrl: string;
}

// 시드 공연
export interface SeedPerformance {
  id: number;
  venderPerformanceId: string;
  site: CrawlingSite;
  isOpen: boolean;
  data: SeedPerformanceData;
  createdAt: string;
  updatedAt: string;
}

// 크롤링된 예매 정보
export interface CrawledReservation {
  startDate: string;
  endDate: string;
  url: string;
}

// 크롤링된 장소 정보
export interface CrawledPlace {
  name: string;
  address: string;
  venderPlaceId: string;
  venderHallId?: string;
}

// 크롤링된 타임테이블 정보
export interface CrawledTimetable {
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  venderArtistName: string;
  venderArtistId: string;
  hallName: string | null;
}

// 크롤링된 공연 데이터
export interface CrawledPerformanceData {
  venderPerformanceId: string | null;
  title: string;
  posterUrl: string;
  dates: string[] | null;
  reservations: CrawledReservation[] | null;
  place: CrawledPlace | null;
  site: string | null;
  timetables: CrawledTimetable[] | null;
  participants?: any | null;
  participantDates?: any | null;
}

// 공연 연동 정보
export interface PerformanceLink {
  crawledPerformanceId: number;
  performanceId: number;
  venderPerformanceId: string | null;
  site: CrawlingSite;
  linkItems?: CrawlingLinkItem[];
}

// 장소 연동 정보
export interface PlaceLink {
  crawledPerformanceId: number;
  performancePlaceId: number;
  venderPlaceId: string | null;
  site: CrawlingSite;
}

// 홀 연동 정보
export interface HallLink {
  crawledPerformanceId: number;
  hallId: number;
  venderHallName: string;
  site: CrawlingSite;
}

// 타임테이블 연동 정보
export interface TimetableLink {
  crawledPerformanceId: number;
  timetableId: number;
  venderArtistId: string;
  site: CrawlingSite;
}

// Apple Music 검색 정보
export interface AppleMusicSearchResult {
  id: string;
  attributes: {
    name: string;
    artwork: {
      url: string;
    } | null;
    genreNames: string[];
  };
}

// 자동 검색 정보
export interface AutoSearchInfo {
  results: {
    artists: {
      data: AppleMusicSearchResult[];
    };
  };
}

// 아티스트 연동 정보
export interface ArtistLink {
  crawledPerformanceId: number;
  venderArtistName: string;
  venderArtistId: string | null;
  site: CrawlingSite;
  status: ArtistLinkStatus;
  autoSearchInfo: AutoSearchInfo | null;
  artistId: number | null;
}

// 크롤링된 공연
export interface CrawledPerformance {
  id: number;
  venderPerformanceId: string;
  site: CrawlingSite;
  isOpen: boolean;
  data: CrawledPerformanceData;
  createdAt: string;
  updatedAt: string;
}

// 크롤링된 공연 + 연동 정보 (확장된 응답)
export interface CrawledPerformanceWithLinks {
  performance: CrawledPerformance;
  performanceLinks: PerformanceLink[];
  placeLinks: PlaceLink[];
  hallLinks: HallLink[];
  timetableLinks: TimetableLink[];
  artistLinks: ArtistLink[];
}

// 연동 생성 요청 타입들
export interface CreatePlaceLinkRequest {
  performancePlaceId: number;
  venderPlaceId?: string;
  site: CrawlingSite;
  venderHallId?: string;
}

export interface CreateNewPlaceLinkRequest {
  placeName: string;
  address?: string;
  venderPlaceId?: string;
  site: CrawlingSite; // 필수
}

export interface CreatePerformanceLinkRequest {
  performanceId?: number;
  linkItems: CrawlingLinkItem[];
}

export interface CreateNewPerformanceLinkRequest {
  name: string;
  placeId: number;
  startDate: string;
  endDate: string;
  posterUrl?: string;
  transportationInfo?: string;
  banGoods?: string;
  remark?: string;
  linkItems: CrawlingLinkItem[]; // 필수: 최소 1개 이상
}

export interface CreateHallLinkRequest {
  hallId: number;
}

export interface CreateNewHallLinkRequest {
  hallName: string; // 필수
  placeId: number;
  venderHallId?: string;
  site: CrawlingSite; // 필수
}

export interface CreateArtistLinkRequest {
  artistId: number;
  venderArtistId?: string;
  site?: CrawlingSite;
  status?: ArtistLinkStatus;
}

export interface CreateNewArtistLinkRequest {
  venderArtistId?: string;
  site: CrawlingSite; // 필수
  // 아티스트 정보는 별도 API로 생성 후 연동
}

// 장소 연동 수정 요청
export interface UpdatePlaceLinkRequest {
  targetPerformancePlaceId?: number;
  venderPlaceId?: string;
  site: CrawlingSite;
}

// 아티스트 연동 수정 요청
export interface UpdateArtistLinkRequest {
  artistId: number;
  venderArtistId?: string;
  site: CrawlingSite;
}
