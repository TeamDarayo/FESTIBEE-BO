import axios from 'axios';
import { Festival } from '@/types/festival';

// Mock data for testing
const mockFestivals: Festival[] = [
  {
    id: 1,
    title: "Summer Music Festival 2024",
    description: "A wonderful summer music festival featuring various artists",
    startDate: "2024-07-01",
    endDate: "2024-07-03",
    location: "Seoul Olympic Park",
    price: 50000,
    status: "upcoming",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    title: "K-Pop Concert",
    description: "Amazing K-Pop concert with top artists",
    startDate: "2024-05-15",
    endDate: "2024-05-15",
    location: "Jamsil Stadium",
    price: 80000,
    status: "upcoming",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

let festivals = [...mockFestivals];

// Mock API implementation
export const fetchFestivals = async (): Promise<Festival[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(festivals);
    }, 500); // Add artificial delay to simulate network request
  });
};

export const createFestival = async (festival: Omit<Festival, 'id' | 'createdAt' | 'updatedAt'>): Promise<Festival> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newFestival: Festival = {
        ...festival,
        id: festivals.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      festivals.push(newFestival);
      resolve(newFestival);
    }, 500);
  });
};

export const updateFestival = async (id: number, festivalUpdate: Partial<Festival>): Promise<Festival> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = festivals.findIndex(f => f.id === id);
      if (index === -1) {
        reject(new Error('Festival not found'));
        return;
      }
      
      festivals[index] = {
        ...festivals[index],
        ...festivalUpdate,
        updatedAt: new Date().toISOString(),
      };
      
      resolve(festivals[index]);
    }, 500);
  });
};

export const deleteFestival = async (id: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = festivals.findIndex(f => f.id === id);
      if (index === -1) {
        reject(new Error('Festival not found'));
        return;
      }
      
      festivals = festivals.filter(f => f.id !== id);
      resolve();
    }, 500);
  });
}; 