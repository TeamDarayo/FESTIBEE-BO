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
import PasswordModal from '@/components/PasswordModal';
import React from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { Hall } from '@/types/place';

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [openTimeTable, setOpenTimeTable] = useState<number | null>(null);
  const [openReservation, setOpenReservation] = useState<number | null>(null);
  const [hallsByPlaceId, setHallsByPlaceId] = useState<Record<number, Hall[]>>({});
  
  // 비밀번호 모달 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete' | 'updateReservation' | 'updateTimeTable';
    data?: any;
    id?: number;
  } | null>(null);

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
    setPendingAction({ type: 'create', data: festivalData });
    setIsPasswordModalOpen(true);
  };

  const handleUpdateFestival = async (festivalData: Omit<Festival, 'id'>) => {
    if (!editingFestival) return;
    setPendingAction({ type: 'update', data: festivalData, id: editingFestival.id });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteFestival = async (id: number) => {
    setPendingAction({ type: 'delete', id });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!pendingAction) return;
    
    try {
      switch (pendingAction.type) {
        case 'create':
          await createFestival(pendingAction.data, password);
          alert('페스티벌이 성공적으로 추가되었습니다.');
          break;
        case 'update':
          if (pendingAction.id) {
            await updateFestival(pendingAction.id, pendingAction.data, password);
            alert('페스티벌이 성공적으로 수정되었습니다.');
          }
          break;
        case 'delete':
          if (pendingAction.id) {
            await deleteFestival(pendingAction.id);
            alert('페스티벌이 성공적으로 삭제되었습니다.');
          }
          break;
        case 'updateReservation':
          if (pendingAction.id) {
            await updateReservationInfos(pendingAction.id, pendingAction.data, password);
            alert('예매정보가 성공적으로 추가되었습니다.');
          }
          break;
        case 'updateTimeTable':
          if (pendingAction.id) {
            // 새로운 타임테이블 데이터 추출
            const newTimeTable = pendingAction.data[pendingAction.data.length - 1]; // 마지막 항목이 새로 추가된 것
            await addTimeTable(pendingAction.id, {
              performanceDate: newTimeTable.performanceDate,
              startTime: newTimeTable.startTime,
              endTime: newTimeTable.endTime,
              hallId: newTimeTable.hallId,
              password: password
            });
            alert('타임테이블이 성공적으로 추가되었습니다.');
            await loadFestivals();
          }
          break;
      }
      
      await loadFestivals();
      setEditingFestival(null);
      setIsFormOpen(false);
    } catch (error: any) {
      // 서버 에러 응답을 alert로 표시
      let errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      if (error.message && error.message.includes('401')) {
        errorMessage = '비밀번호를 확인해주세요.';
      }
      alert(`오류: ${errorMessage}`);
      console.error('API Error:', error);
    } finally {
      setIsPasswordModalOpen(false);
      setPendingAction(null);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalOpen(false);
    setPendingAction(null);
  };

  const handleEdit = (festival: Festival) => {
    setEditingFestival(festival);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingFestival(null);
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
    try {
      // 현재 페스티벌의 예매정보 목록을 가져옴
      const currentFestival = festivals.find(f => f.id === festivalId);
      if (!currentFestival) {
        throw new Error('페스티벌을 찾을 수 없습니다.');
      }

      // 새로운 예매정보를 기존 목록에 추가 (id는 서버에서 생성됨)
      const updatedReservationInfos = [
        ...currentFestival.reservationInfos,
        newReservation
      ];

      // 비밀번호 모달을 열기 위해 pendingAction 설정
      setPendingAction({
        type: 'updateReservation',
        id: festivalId,
        data: updatedReservationInfos,
      });
      setIsPasswordModalOpen(true);
    } catch (error: any) {
      alert(`예매정보 추가 오류: ${error.message}`);
    }
  };

  const handleSaveNewTimeTable = async (newTimeTable: any) => {
    try {
      // 빈 객체가 전달되면 아티스트 업데이트 후 새로고침
      if (Object.keys(newTimeTable).length === 0) {
        await loadFestivals();
        return;
      }

      // 현재 페스티벌의 타임테이블 목록을 가져옴
      const currentFestival = festivals.find(f => f.id === openTimeTable);
      if (!currentFestival) {
        throw new Error('페스티벌을 찾을 수 없습니다.');
      }

      // 새로운 타임테이블을 기존 목록에 추가 (id는 서버에서 생성됨)
      const updatedTimeTables = [
        ...currentFestival.timeTables,
        newTimeTable
      ];

      // 비밀번호 모달을 열기 위해 pendingAction 설정
      setPendingAction({
        type: 'updateTimeTable',
        id: currentFestival.id,
        data: updatedTimeTables,
      });
      setIsPasswordModalOpen(true);
    } catch (error: any) {
      alert(`타임테이블 추가 오류: ${error.message}`);
    }
  };

  const getPasswordModalTitle = () => {
    if (!pendingAction) return '';
    switch (pendingAction.type) {
      case 'create': return '페스티벌 추가';
      case 'update': return '페스티벌 수정';
      case 'delete': return '페스티벌 삭제';
      case 'updateReservation': return '예매정보 추가';
      case 'updateTimeTable': return '타임테이블 추가';
      default: return '관리자 인증';
    }
  };

  const getPasswordModalMessage = () => {
    if (!pendingAction) return '';
    switch (pendingAction.type) {
      case 'create': return '새 페스티벌을 추가하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'update': return '페스티벌을 수정하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'delete': return '페스티벌을 삭제하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'updateReservation': return '예매정보를 추가하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'updateTimeTable': return '타임테이블을 추가하기 위해 관리자 비밀번호를 입력해주세요.';
      default: return '관리자 비밀번호를 입력해주세요.';
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
                      <TableCell>{festival.banGoods}</TableCell>
                      <TableCell>{festival.transportationInfo}</TableCell>
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
        isReadOnly={editingFestival ? true : false}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        title={getPasswordModalTitle()}
        message={getPasswordModalMessage()}
      />
    </div>
  );
} 