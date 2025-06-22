export interface Hall {
  id: number;
  name: string;
}

export interface Place {
  id: number;
  placeName: string;
  address: string;
  halls: Hall[];
}

export interface PlaceRequestBody {
  placeName: string;
  address: string;
  placeHalls: string[];
} 