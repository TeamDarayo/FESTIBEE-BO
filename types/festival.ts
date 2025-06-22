export interface TimeTableArtist {
  artistId: number;
  type: string;
}

export interface TimeTable {
  id?: string;
  performanceDate: string;
  startTime: string;
  endTime: string;
  hallId: number;
  hallName?: string; // Display Name
  artists: TimeTableArtist[];
  artistNames?: string[]; // For display in UI
}

export interface ReservationInfo {
  id?: string;
  openDateTime: string;
  closeDateTime: string;
  type: string;
  ticketURL: string;
  remark: string;
}

export interface Festival {
  id: string;
  name: string;
  placeId: number;
  placeName?: string;
  placeAddress?: string;
  startDate: string;
  endDate: string;
  posterUrl: string;
  banGoods: string;
  transportationInfo: string;
  remark: string;
  timeTables: TimeTable[];
  reservationInfos: ReservationInfo[];
} 