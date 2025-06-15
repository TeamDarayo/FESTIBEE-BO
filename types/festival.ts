export interface ArtistInTimeTable {
  artistId: string;
  type: string; // Enum (MAIN, SUB)
}

export interface TimeTable {
  timeTableId: string;
  performanceDate: string; // Date
  startTime: string;
  endTime: string;
  performanceHall: string;
  artists: ArtistInTimeTable[];
}

export interface ReservationInfo {
  reservationInfoId: string;
  openDateTime: string;
  closeDateTime: string;
  ticketURL: string;
  type: string;
  remark: string;
}

export interface Festival {
  festivalId: string;
  name: string;
  placeName: string;
  placeAddress: string;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
  timeTables: TimeTable[];
  reservationInfos: ReservationInfo[];
} 