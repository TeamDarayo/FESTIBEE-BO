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