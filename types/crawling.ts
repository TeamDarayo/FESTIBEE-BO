// 크롤링 관련 타입 정의

// 크롤링 작업 상태
export type CrawlingStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

// 크롤링 사이트
export type CrawlingSite = 'INTERPARK' | 'YES24' | 'MELON';

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

// 크롤링된 공연 데이터
export interface CrawledPerformanceData {
  venderPerformanceId: string | null;
  title: string;
  posterUrl: string;
  dates: string[] | null;
  reservations: any | null;
  place: any | null;
  participants: any | null;
  participantDates: any | null;
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

