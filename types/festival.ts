// --- Frontend-facing types ---

export interface TimeTableArtist {
  timetableArtistId?: number; // From GET response
  artistId: number;
  artistName?: string; // From GET response
  type: string;
}

export interface TimeTable {
  id?: number;
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId?: number; // For POST request
  hallName?: string; // From GET response
  artists: TimeTableArtist[];
}

export interface ReservationInfo {
  id?: number;
  openDateTime: string;
  closeDateTime: string;
  type: string;
  ticketURL: string;
  remark: string;
}

export interface ArtistSummary {
  id: number;
  displayName: string;
}

export interface Festival {
  id: number;
  name: string;
  placeId?: number; // For POST request
  placeName?: string; // From GET response
  placeAddress?: string; // From GET response
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
  timeTables: TimeTable[];
  reservationInfos: ReservationInfo[];
  artists?: ArtistSummary[]; // From GET response
}


// --- API Response types (for GET /api/admin/performance) ---

export interface PerformanceResponse {
  id: number;
  name: string;
  placeName: string;
  placeAddress: string;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
}

export interface TimeTableArtistResponse {
  timetableArtistId: number;
  artistId: number;
  artistName: string;
  type: string;
}

export interface TimeTableResponse {
  id: number;
  performanceDate: string;
  startTime: string;
  endTime: string;
  performanceHall: string;
  artists: TimeTableArtistResponse[];
}

export interface ReservationInfoResponse {
  id: number;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: string;
  remark: string;
}

export interface ArtistSummaryResponse {
  id: number;
  displayName: string;
}

export interface FestivalResponse {
  performance: PerformanceResponse;
  timeTables: TimeTableResponse[];
  reservationInfos: ReservationInfoResponse[];
  artists: ArtistSummaryResponse[];
}

// --- API Request types (for POST /api/admin/performance) ---

export interface PerformanceRequest {
  name: string;
  placeId: number;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
}

export interface TimeTableArtistRequest {
  artistId: number;
  type: string;
}

export interface TimeTableRequest {
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId: number;
  artists: TimeTableArtistRequest[];
}

export interface ReservationInfoRequest {
  openDateTime: string;
  closeDateTime: string;
  type: string;
  ticketURL: string;
  remark: string;
}

export interface FestivalCreateRequest {
  password: string;
  performance: PerformanceRequest;
  timeTables: TimeTableRequest[];
  reservationInfos: ReservationInfoRequest[];
}

export interface TimeTableAddRequest {
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId: number;
  password: string;
} 