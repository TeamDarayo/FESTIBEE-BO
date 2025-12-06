'use client';

import { useEffect, useState } from 'react';
import { fetchPlaces, createPlace, updatePlace, deletePlace, updateHall, addHalls } from '@/lib/api';
import { Place, PlaceRequestBody } from '@/types/place';
import PlaceForm from './components/PlaceForm';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

export default function PlacesPage() {
  const { isAuthenticated } = useAuth();
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  useEffect(() => {
    loadPlaces();
  }, []);

  const loadPlaces = async () => {
    try {
      const data = await fetchPlaces();
      setPlaces(data);
      setError(null);
    } catch (err) {
      setError('Failed to load places');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlace = async (placeData: PlaceRequestBody) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await createPlace(placeData);
      alert('장소가 성공적으로 추가되었습니다.');
      await loadPlaces();
      setIsFormOpen(false);
    } catch (err: any) {
      console.error('Error creating place:', err);
      alert(err.message || '장소 추가에 실패했습니다.');
    }
  };

  const handleUpdatePlace = async (placeData: PlaceRequestBody, hallChanges?: { edits: Array<{id: number, name: string}>, adds: string[] }) => {
    if (!editingPlace) return;
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await updatePlace(editingPlace.id, placeData);
      
      // 홀 변경사항 처리
      if (hallChanges) {
        const { edits, adds } = hallChanges;
        
        // 홀 수정
        for (const edit of edits) {
          await updateHall(edit.id, { name: edit.name });
        }
        
        // 홀 추가
        if (adds.length > 0) {
          await addHalls(editingPlace.id, adds);
        }
      }
      
      alert('장소가 성공적으로 수정되었습니다.');
      await loadPlaces();
      setIsFormOpen(false);
      setEditingPlace(null);
    } catch (err: any) {
      console.error('Error updating place:', err);
      alert(err.message || '장소 수정에 실패했습니다.');
    }
  };

  const handleDeletePlace = async (id: number) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    if (!confirm('정말로 이 장소를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deletePlace(id);
      alert('장소가 성공적으로 삭제되었습니다.');
      await loadPlaces();
    } catch (err: any) {
      console.error('Error deleting place:', err);
      alert(err.message || '장소 삭제에 실패했습니다.');
    }
  };

  const handleEditHall = async (hallId: number, newName: string) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await updateHall(hallId, { name: newName });
      alert('홀이 성공적으로 수정되었습니다.');
      await loadPlaces();
    } catch (err: any) {
      console.error('Error updating hall:', err);
      alert(err.message || '홀 수정에 실패했습니다.');
    }
  };

  const handleAddHalls = async (placeId: number, hallNames: string[]) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await addHalls(placeId, hallNames);
      alert('홀이 성공적으로 추가되었습니다.');
      await loadPlaces();
    } catch (err: any) {
      console.error('Error adding halls:', err);
      alert(err.message || '홀 추가에 실패했습니다.');
    }
  };

  const handleEdit = (place: Place) => {
    setEditingPlace(place);
    setIsFormOpen(true);
  };

  const handleView = (place: Place) => {
    setSelectedPlace(place);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPlace(null);
  };

  const handleCloseModal = () => {
    setSelectedPlace(null);
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">장소 관리</h1>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">장소 목록</h2>
            <Button onClick={() => setIsFormOpen(true)}>
              <FiPlus className="mr-2" />
              장소 추가
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>장소명</TableHead>
                  <TableHead>주소</TableHead>
                  <TableHead>홀 수</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {places.map(place => (
                  <TableRow key={place.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-600">
                      {place.id}
                    </TableCell>
                    <TableCell className="font-medium text-lg">{place.placeName}</TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {place.address}
                    </TableCell>
                    <TableCell>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {place.halls.length}개
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleView(place)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEye className="mr-1" />
                        보기
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(place)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <FiEdit2 className="mr-1" />
                        수정
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDeletePlace(place.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="mr-1" />
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 장소 상세 모달 */}
      {selectedPlace && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">장소 상세 정보</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedPlace.placeName}</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">장소 ID:</span>
                      <p className="text-gray-900">{selectedPlace.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">주소:</span>
                      <p className="text-gray-900">{selectedPlace.address}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">홀 목록:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedPlace.halls.map(hall => (
                          <span 
                            key={hall.id} 
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {hall.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal}>
                닫기
              </Button>
              <Button onClick={() => {
                handleCloseModal();
                handleEdit(selectedPlace);
              }}>
                수정하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <PlaceForm
        isOpen={isFormOpen}
        onSubmit={editingPlace ? handleUpdatePlace : handleCreatePlace}
        onCancel={handleCloseForm}
        onEditHall={handleEditHall}
        onAddHalls={handleAddHalls}
        initialData={editingPlace || undefined}
      />
    </div>
  );
} 