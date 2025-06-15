import axios from 'axios';

// 아티스트 관련 타입 정의
export interface Artist {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

// 공연(Festival) 관련 타입 정의
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

// Mock 데이터 - 아티스트
const mockArtists: Artist[] = [
  {
    id: 1,
    name: "IU",
    description: "이지은은 대한민국의 가수이자 배우이다. 2008년 9월 18일, 15세의 나이에 가수로 데뷔했다.",
    imageUrl: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "BTS",
    description: "BTS는 대한민국의 7인조 보이 그룹이다. 2013년 6월 13일 데뷔했다.",
    imageUrl: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    name: "BLACKPINK",
    description: "BLACKPINK는 YG엔터테인먼트 소속의 4인조 걸 그룹이다. 2016년 8월 8일 데뷔했다.",
    imageUrl: "https://cdnticket.melon.co.kr/resource/image/upload/marketing/2025/05/20250529182542a5e38752-c31b-4810-a651-aacdfd973d8f.jpg",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock 데이터 - 공연
const mockFestivals: Festival[] = [
  {
    festivalId: "1",
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
        timeTableId: "tt1",
        performanceDate: "2024-07-15",
        startTime: "18:00",
        endTime: "20:00",
        performanceHall: "88잔디마당",
        artists: [
          { artistId: "a1", type: "MAIN" },
          { artistId: "a2", type: "SUB" }
        ]
      }
    ],
    reservationInfos: [
      {
        reservationInfoId: "r1",
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
let festivals = [...mockFestivals];

// Mock API 구현 - 아티스트
export const fetchArtists = async (): Promise<Artist[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(artists);
    }, 500);
  });
};

export const fetchArtistById = async (id: number): Promise<Artist> => {
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
};

export const createArtist = async (artist: Omit<Artist, 'id' | 'createdAt' | 'updatedAt'>): Promise<Artist> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newArtist: Artist = {
        ...artist,
        id: artists.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      artists.push(newArtist);
      resolve(newArtist);
    }, 500);
  });
};

export const updateArtist = async (id: number, artistUpdate: Partial<Artist>): Promise<Artist> => {
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
        updatedAt: new Date().toISOString(),
      };
      
      resolve(artists[index]);
    }, 500);
  });
};

export const deleteArtist = async (id: number): Promise<void> => {
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
};

// Mock API 구현 - 공연
export const fetchFestivals = async (): Promise<Festival[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(festivals);
    }, 500);
  });
};

export const fetchFestivalById = async (id: string): Promise<Festival> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const festival = festivals.find(f => f.festivalId === id);
      if (!festival) {
        reject(new Error('Festival not found'));
        return;
      }
      resolve(festival);
    }, 500);
  });
};

export const createFestival = async (festival: Omit<Festival, 'festivalId'>): Promise<Festival> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newFestival: Festival = {
        ...festival,
        festivalId: (festivals.length + 1).toString(),
      };
      festivals.push(newFestival);
      resolve(newFestival);
    }, 500);
  });
};

export const updateFestival = async (id: string, festivalUpdate: Partial<Festival>): Promise<Festival> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = festivals.findIndex(f => f.festivalId === id);
      if (index === -1) {
        reject(new Error('Festival not found'));
        return;
      }
      festivals[index] = {
        ...festivals[index],
        ...festivalUpdate,
      };
      resolve(festivals[index]);
    }, 500);
  });
};

export const deleteFestival = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = festivals.findIndex(f => f.festivalId === id);
      if (index === -1) {
        reject(new Error('Festival not found'));
        return;
      }
      festivals = festivals.filter(f => f.festivalId !== id);
      resolve();
    }, 500);
  });
}; 