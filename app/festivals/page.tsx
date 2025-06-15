'use client';

import { useEffect, useState } from 'react';
import { Festival } from '@/types/festival';
import { fetchFestivals, createFestival, updateFestival } from '@/lib/api';
import { format } from 'date-fns';
import FestivalForm from './components/FestivalForm';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import TimeTable from './components/TimeTable';

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingFestival, setEditingFestival] = useState<Festival | null>(null);
  const [openTimeTable, setOpenTimeTable] = useState<string | null>(null);
  const [openReservation, setOpenReservation] = useState<string | null>(null);

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

  const handleCreateFestival = async (festivalData: Omit<Festival, 'festivalId'>) => {
    try {
      await createFestival(festivalData);
      await loadFestivals();
    } catch (error) {
      console.error('Error creating festival:', error);
      throw error;
    }
  };

  const handleUpdateFestival = async (festivalData: Omit<Festival, 'festivalId'>) => {
    if (!editingFestival) return;
    try {
      await updateFestival(editingFestival.festivalId, festivalData);
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
        <Table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포스터</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">장소명</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주소</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종료일</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">금지물품</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">교통정보</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
            </tr>
          </thead>
          <TableBody>
            {festivals.map((festival) => (
              <>
                <TableRow key={festival.festivalId}>
                  <TableCell className="w-16">
                    <div style={{ position: 'relative', width: '48px', height: '48px' }} className="overflow-hidden rounded-md">
                      <Image
                        src={festival.posterUrl}
                        alt={festival.name}
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-md"
                        sizes="48px"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{festival.name}</TableCell>
                  <TableCell>{festival.placeName}</TableCell>
                  <TableCell>{festival.placeAddress}</TableCell>
                  <TableCell>{festival.startDate}</TableCell>
                  <TableCell>{festival.endDate}</TableCell>
                  <TableCell>{festival.banGoods}</TableCell>
                  <TableCell>{festival.transportationInfo}</TableCell>
                  <TableCell>{festival.remark}</TableCell>
                  <TableCell className="text-right space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(festival)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {/* TODO: Implement delete */}}
                    >
                      삭제
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => {
                        if (openTimeTable === festival.festivalId) {
                          setOpenTimeTable(null);
                        } else {
                          setOpenTimeTable(festival.festivalId);
                          setOpenReservation(null);
                        }
                      }}
                    >
                      타임테이블 보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-1"
                      onClick={() => {
                        if (openReservation === festival.festivalId) {
                          setOpenReservation(null);
                        } else {
                          setOpenReservation(festival.festivalId);
                          setOpenTimeTable(null);
                        }
                      }}
                    >
                      예매정보 보기
                    </Button>
                  </TableCell>
                </TableRow>
                {/* 타임테이블 펼침 */}
                {openTimeTable === festival.festivalId && (
                  <TableRow>
                    <TableCell colSpan={10} className="bg-gray-50">
                      <div className="p-4">
                        <div className="font-semibold mb-4">타임테이블</div>
                        <TimeTable timeTables={festival.timeTables} />
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {/* 예매정보 펼침 */}
                {openReservation === festival.festivalId && (
                  <TableRow>
                    <TableCell colSpan={10} className="bg-gray-50">
                      <div>
                        <div className="font-semibold mb-2">예매정보</div>
                        <table className="w-full text-sm border">
                          <thead>
                            <tr className="bg-gray-100">
                              <th>예매ID</th>
                              <th>예매시작</th>
                              <th>예매종료</th>
                              <th>예매URL</th>
                              <th>유형</th>
                              <th>비고</th>
                            </tr>
                          </thead>
                          <tbody>
                            {festival.reservationInfos.map((ri, i) => (
                              <tr key={i}>
                                <td>{ri.reservationInfoId}</td>
                                <td>{ri.openDateTime}</td>
                                <td>{ri.closeDateTime}</td>
                                <td>{ri.ticketURL}</td>
                                <td>{ri.type}</td>
                                <td>{ri.remark}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
          </TableBody>
        </Table>
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