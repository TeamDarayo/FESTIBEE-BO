export interface Festival {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  imageUrl?: string;
  price: number;
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
  updatedAt: string;
} 