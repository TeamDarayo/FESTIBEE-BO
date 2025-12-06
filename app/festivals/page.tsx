'use client';

import { useEffect, useState } from 'react';
import { Festival } from '@/types/festival';
import { fetchFestivals, createFestival, updateFestival, deleteFestival, updateReservationInfos, fetchHallsByPlaceId, addTimeTable, fetchPlaces } from '@/lib/api';
import { format } from 'date-fns';
import FestivalForm from './components/FestivalForm';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import TimeTable from './components/TimeTable';
import ReservationInfo from './components/ReservationInfo';
import { useAuth } from '@/contexts/AuthContext';
import React from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Hall } from '@/types/place';

export default function FestivalsPage() {
  const { isAuthenticated } = useAuth();
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [openTimeTable, setOpenTimeTable] = useState<number | null>(null);
  const [openReservation, setOpenReservation] = useState<number | null>(null);
  const [hallsByPlaceId, setHallsByPlaceId] = useState<Record<number, Hall[]>>({});

  useEffect(() => {
    loadFestivals();
  }, []);

  const loadFestivals = async () => {
    try {
      const data = await fetchFestivals();
      console.log('Fetched festivals:', data);
      setFestivals(data);
      
      // 전체 장소 목록을 가져와서 홀 정보 추출
      try {
        const places = await fetchPlaces();
        console.log('Fetched places:', places);
        const hallsMap: Record<number, Hall[]> = {};
        
        // 각 장소의 홀 정보를 맵에 저장
        places.forEach(place => {
          console.log(`Processing place ${place.id}: ${place.placeName}`, place.halls);
          hallsMap[place.id] = place.halls || [];
        });
        
        console.log('Halls map:', hallsMap);
        
        // 페스티벌의 placeId 확인
        data.forEach(festival => {
          console.log(`Festival "${festival.name}" has placeId: ${festival.placeId}`);
          if (festival.placeId && hallsMap[festival.placeId]) {
            console.log(`Available halls for festival "${festival.name}":`, hallsMap[festival.placeId]);
          }
        });
        
        setHallsByPlaceId(hallsMap);
      } catch (error) {
        console.error('Failed to fetch places:', error);
        setHallsByPlaceId({});
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load festivals');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFestival = async (festivalData: Omit<Festival, 'id'>) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await createFestival(festivalData);
      alert('페스티벌이 성공적으로 추가되었습니다.');
      await loadFestivals();
      setIsFormOpen(false);
      setEditingFestival(null);
    } catch (err: any) {
      console.error('Error creating festival:', err);
      alert(err.message || '페스티벌 추가에 실패했습니다.');
    }
  };

  const handleUpdateFestival = async (festivalData: Omit<Festival, 'id'>) => {
    if (!editingFestival) return;
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await updateFestival(editingFestival.id, festivalData);
      alert('페스티벌이 성공적으로 수정되었습니다.');
      await loadFestivals();
      setIsFormOpen(false);
      setEditingFestival(null);
    } catch (err: any) {
      console.error('Error updating festival:', err);
      alert(err.message || '페스티벌 수정에 실패했습니다.');
    }
  };

  const handleDeleteFestival = async (id: number) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    if (!confirm('정말로 이 페스티벌을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteFestival(id);
      alert('페스티벌이 성공적으로 삭제되었습니다.');
      await loadFestivals();
    } catch (err: any) {
      console.error('Error deleting festival:', err);
      alert(err.message || '페스티벌 삭제에 실패했습니다.');
    }
  };

  const handleUpdateReservationInfos = async (performanceId: number, reservationInfos: any) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await updateReservationInfos(performanceId, reservationInfos);
      alert('예매정보가 성공적으로 저장되었습니다.');
      await loadFestivals();
      setOpenReservation(null);
    } catch (err: any) {
      console.error('Error updating reservation infos:', err);
      alert(err.message || '예매정보 저장에 실패했습니다.');
    }
  };

  const handleAddTimeTable = async (performanceId: number, timeTableData: any) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await addTimeTable(performanceId, timeTableData);
      alert('타임테이블이 성공적으로 추가되었습니다.');
      await loadFestivals();
    } catch (err: any) {
      console.error('Error adding timetable:', err);
      alert(err.message || '타임테이블 추가에 실패했습니다.');
    }
  };


  const handleEdit = (festival: Festival) => {
    setEditingFestival(festival);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFestival(null);
    // 폼이 닫힐 때 모든 관련 상태를 초기화
    setOpenTimeTable(null);
    setOpenReservation(null);
  };

  const handleAddReservation = (festivalId: number) => {
    // 예매정보 추가는 인라인 폼에서 처리하므로 아무것도 하지 않음
    // ReservationInfo 컴포넌트 내부에서 처리됨
  };

  const handleEditReservation = (festivalId: number) => {
    // 예매정보 수정 로직 - 상세보기 모달을 열고 예매정보 수정 모드로 설정
    const festival = festivals.find(f => f.id === festivalId);
    if (festival) {
      setEditingFestival(festival);
      setIsFormOpen(true);
      // TODO: 예매정보 수정 모드로 설정하는 로직 추가 필요
    }
  };

  const handleSaveNewReservation = async (festivalId: number, newReservation: any) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      const currentFestival = festivals.find(f => f.id === festivalId);
      if (!currentFestival) {
        throw new Error('페스티벌을 찾을 수 없습니다.');
      }

      const updatedReservationInfos = [
        ...currentFestival.reservationInfos,
        newReservation
      ];

      await handleUpdateReservationInfos(festivalId, updatedReservationInfos);
    } catch (error: any) {
      alert(`예매정보 추가 오류: ${error.message}`);
    }
  };

  const handleSaveUpdatedReservations = async (festivalId: number, updatedReservations: any[]) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      await handleUpdateReservationInfos(festivalId, updatedReservations);
    } catch (error: any) {
      alert(`예매정보 수정 오류: ${error.message}`);
    }
  };

  const handleSaveNewTimeTable = async (newTimeTable: any) => {
    if (!isAuthenticated) {
      alert('먼저 관리자 로그인을 해주세요.');
      return;
    }

    try {
      // 빈 객체가 전달되면 아티스트 업데이트 후 새로고침
      if (Object.keys(newTimeTable).length === 0) {
        await loadFestivals();
        return;
      }

      const currentFestival = festivals.find(f => f.id === openTimeTable);
      if (!currentFestival) {
        throw new Error('페스티벌을 찾을 수 없습니다.');
      }

      await handleAddTimeTable(currentFestival.id, {
        performanceDate: newTimeTable.performanceDate,
        startTime: newTimeTable.startTime,
        endTime: newTimeTable.endTime,
        hallId: newTimeTable.hallId,
      });
    } catch (error: any) {
      alert(`타임테이블 추가 오류: ${error.message}`);
    }
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
        <h1 className="text-3xl font-bold mb-8 text-gray-900">페스티벌 관리</h1>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">페스티벌 목록</h2>
            <Button onClick={() => setIsFormOpen(true)}>
              <FiPlus className="mr-2" />
              페스티벌 추가
            </Button>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>포스터</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>장소</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>금지물품</TableHead>
                  <TableHead>교통정보</TableHead>
                  <TableHead>비고</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {festivals.map(festival => (
                  <React.Fragment key={festival.id}>
                    <TableRow>
                      <TableCell>
                        <Image src={festival.posterUrl} alt={festival.name} width={48} height={48} className="rounded-md" />
                      </TableCell>
                      <TableCell className="font-medium">{festival.name}</TableCell>
                      <TableCell>{festival.placeName || '미정'}<br/><span className="text-xs text-gray-500">{festival.placeAddress || ''}</span></TableCell>
                      <TableCell>{`${festival.startDate} ~ ${festival.endDate}`}</TableCell>
                      <TableCell>
                        <div className="max-h-20 overflow-y-auto">
                          <div className="whitespace-pre-wrap text-sm">
                            {festival.banGoods}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-h-20 overflow-y-auto">
                          <div className="whitespace-pre-wrap text-sm">
                            {festival.transportationInfo}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{festival.remark}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          if (openTimeTable === festival.id) {
                            setOpenTimeTable(null);
                          } else {
                            setOpenTimeTable(festival.id);
                            setOpenReservation(null);
                          }
                        }}>
                          {openTimeTable === festival.id ? '닫기' : '타임테이블'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          if (openReservation === festival.id) {
                            setOpenReservation(null);
                          } else {
                            setOpenReservation(festival.id);
                            setOpenTimeTable(null);
                          }
                        }}>
                          {openReservation === festival.id ? '닫기' : '예매정보'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(festival)}>
                          <FiEdit2 className="mr-1" />
                          상세보기
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteFestival(festival.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="mr-1" />
                          삭제
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openTimeTable === festival.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-4 bg-muted">
                          <TimeTable 
                            timeTables={festival.timeTables}
                            onSaveNewTimeTable={(newTimeTable) => handleSaveNewTimeTable(newTimeTable)}
                            showManageButtons={true}
                            availableHalls={festival.placeId ? (hallsByPlaceId[festival.placeId] || []) : []}
                            festivalStartDate={festival.startDate}
                            performanceId={festival.id}
                            placeId={festival.placeId}
                            onRefresh={loadFestivals}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                    {openReservation === festival.id && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-4 bg-muted">
                          <ReservationInfo 
                            reservationInfos={festival.reservationInfos}
                            onEditReservation={() => handleEditReservation(festival.id)}
                            onSaveNewReservation={(newReservation) => handleSaveNewReservation(festival.id, newReservation)}
                            onSaveUpdatedReservations={(updatedReservations) => handleSaveUpdatedReservations(festival.id, updatedReservations)}
                            showManageButtons={true}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <FestivalForm
        isOpen={isFormOpen}
        onSubmit={editingFestival ? handleUpdateFestival : handleCreateFestival}
        onCancel={handleCloseForm}
        initialData={editingFestival || undefined}
        isReadOnly={false}
        hideTimeTableAndReservation={editingFestival ? true : false}
      />
    </div>
  );
} 