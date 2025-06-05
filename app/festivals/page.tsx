'use client';

import { useEffect, useState } from 'react';
import { Festival } from '@/types/festival';
import { fetchFestivals, createFestival, updateFestival } from '@/lib/api';
import { format } from 'date-fns';
import FestivalForm from './components/FestivalForm';

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);

  useEffect(() => {
    loadFestivals();
  }, []);

  const loadFestivals = async () => {
    try {
      const data = await fetchFestivals();
      setFestivals(data);
      setError(null);
    } catch (err) {
      setError('Failed to load festivals');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFestival = async (festivalData: Omit<Festival, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createFestival(festivalData);
      await loadFestivals();
    } catch (error) {
      console.error('Error creating festival:', error);
      throw error;
    }
  };

  const handleUpdateFestival = async (festivalData: Omit<Festival, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!editingFestival) return;
    try {
      await updateFestival(editingFestival.id, festivalData);
      await loadFestivals();
      setEditingFestival(null);
    } catch (error) {
      console.error('Error updating festival:', error);
      throw error;
    }
  };

  const handleEdit = (festival: Festival) => {
    setEditingFestival(festival);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFestival(null);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Festivals</h1>
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => setIsFormOpen(true)}
        >
          Add New Festival
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 border-b text-left">Title</th>
              <th className="px-6 py-3 border-b text-left">Location</th>
              <th className="px-6 py-3 border-b text-left">Dates</th>
              <th className="px-6 py-3 border-b text-left">Status</th>
              <th className="px-6 py-3 border-b text-left">Price</th>
              <th className="px-6 py-3 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {festivals.map((festival) => (
              <tr key={festival.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{festival.title}</td>
                <td className="px-6 py-4 border-b">{festival.location}</td>
                <td className="px-6 py-4 border-b">
                  {format(new Date(festival.startDate), 'MMM d, yyyy')} - 
                  {format(new Date(festival.endDate), 'MMM d, yyyy')}
                </td>
                <td className="px-6 py-4 border-b">
                  <span className={`px-2 py-1 rounded text-sm ${
                    festival.status === 'upcoming' ? 'bg-yellow-100 text-yellow-800' :
                    festival.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {festival.status}
                  </span>
                </td>
                <td className="px-6 py-4 border-b">
                  ${festival.price.toLocaleString()}
                </td>
                <td className="px-6 py-4 border-b">
                  <button
                    className="text-blue-500 hover:text-blue-700 mr-4"
                    onClick={() => handleEdit(festival)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => {/* TODO: Implement delete */}}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FestivalForm
        isOpen={isFormOpen}
        onSubmit={editingFestival ? handleUpdateFestival : handleCreateFestival}
        onCancel={handleCloseForm}
        initialData={editingFestival || undefined}
      />
    </div>
  );
} 