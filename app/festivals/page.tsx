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
import React from 'react';
import { FiPlus } from 'react-icons/fi';

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
            <Button
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-semibold shadow hover:bg-blue-700"
              onClick={() => {
                if (isFormOpen && !editingFestival) {
                  setIsFormOpen(false);
                } else {
                  setIsFormOpen(true);
                  setEditingFestival(null);
                }
              }}
            >
              {isFormOpen && !editingFestival ? '추가 닫기' : '페스티벌 추가'}
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-xl shadow overflow-hidden border border-gray-300 border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">포스터</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">이름</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">장소명</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">주소</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">시작일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">종료일</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">금지물품</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">교통정보</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 border border-gray-200">비고</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 border border-gray-200">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {festivals.map(festival => (
                  <React.Fragment key={festival.festivalId}>
                    <tr className="border-b last:border-b-0 hover:bg-gray-50">
                      <td className="px-6 py-4 border border-gray-200">
                        <Image src={festival.posterUrl} alt={festival.name} width={48} height={48} className="rounded-lg" />
                      </td>
                      <td className="px-6 py-4 font-medium border border-gray-200">{festival.name}</td>
                      <td className="px-6 py-4 border border-gray-200">{festival.placeName}</td>
                      <td className="px-6 py-4 border border-gray-200">{festival.placeAddress}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border border-gray-200">{festival.startDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border border-gray-200">{festival.endDate}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border border-gray-200">{festival.banGoods}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border border-gray-200">{festival.transportationInfo}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 border border-gray-200">{festival.remark}</td>
                      <td className="px-6 py-4 text-right space-x-2 border border-gray-200">
                        <Button size="sm" className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold" onClick={() => {
                          if (openTimeTable === festival.festivalId) {
                            setOpenTimeTable(null);
                          } else {
                            setOpenTimeTable(festival.festivalId);
                            setOpenReservation(null);
                          }
                        }}>
                          {openTimeTable === festival.festivalId ? '타임테이블 닫기' : '타임테이블'}
                        </Button>
                        <Button size="sm" className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold" onClick={() => {
                          if (openReservation === festival.festivalId) {
                            setOpenReservation(null);
                          } else {
                            setOpenReservation(festival.festivalId);
                            setOpenTimeTable(null);
                          }
                        }}>
                          {openReservation === festival.festivalId ? '예매정보 닫기' : '예매정보'}
                        </Button>
                        <Button size="sm" className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold" onClick={() => {
                          if (editingFestival && editingFestival.festivalId === festival.festivalId && isFormOpen) {
                            setIsFormOpen(false);
                            setEditingFestival(null);
                          } else {
                            setEditingFestival(festival);
                            setIsFormOpen(true);
                          }
                        }}>
                          {editingFestival && editingFestival.festivalId === festival.festivalId && isFormOpen ? '수정 닫기' : '수정'}
                        </Button>
                      </td>
                    </tr>
                    {/* 타임테이블 펼침 */}
                    {openTimeTable === festival.festivalId && (
                      <tr>
                        <td colSpan={10} className="bg-blue-50">
                          <div className="p-4">
                            <div className="font-semibold mb-4">타임테이블</div>
                            <TimeTable timeTables={festival.timeTables} />
                          </div>
                        </td>
                      </tr>
                    )}
                    {/* 예매정보 펼침 */}
                    {openReservation === festival.festivalId && (
                      <tr>
                        <td colSpan={10} className="bg-green-50">
                          <div className="p-4">
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
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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