'use client';

import { useEffect, useState } from 'react';
import { Festival } from '@/types/festival';
import { fetchFestivals, createFestival, updateFestival } from '@/lib/api';
import { format } from 'date-fns';
import FestivalForm from './components/FestivalForm';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
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
                  <React.Fragment key={festival.festivalId}>
                    <TableRow>
                      <TableCell>
                        <Image src={festival.posterUrl} alt={festival.name} width={48} height={48} className="rounded-md" />
                      </TableCell>
                      <TableCell className="font-medium">{festival.name}</TableCell>
                      <TableCell>{festival.placeName}<br/><span className="text-xs text-gray-500">{festival.placeAddress}</span></TableCell>
                      <TableCell>{`${festival.startDate} ~ ${festival.endDate}`}</TableCell>
                      <TableCell>{festival.banGoods}</TableCell>
                      <TableCell>{festival.transportationInfo}</TableCell>
                      <TableCell>{festival.remark}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          if (openTimeTable === festival.festivalId) {
                            setOpenTimeTable(null);
                          } else {
                            setOpenTimeTable(festival.festivalId);
                            setOpenReservation(null);
                          }
                        }}>
                          {openTimeTable === festival.festivalId ? '닫기' : '타임테이블'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => {
                          if (openReservation === festival.festivalId) {
                            setOpenReservation(null);
                          } else {
                            setOpenReservation(festival.festivalId);
                            setOpenTimeTable(null);
                          }
                        }}>
                          {openReservation === festival.festivalId ? '닫기' : '예매정보'}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(festival)}>
                          수정
                        </Button>
                      </TableCell>
                    </TableRow>
                    {openTimeTable === festival.festivalId && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-4 bg-muted">
                          <TimeTable timeTables={festival.timeTables} />
                        </TableCell>
                      </TableRow>
                    )}
                    {openReservation === festival.festivalId && (
                      <TableRow>
                        <TableCell colSpan={8} className="p-4 bg-muted">
                          {/* Reservation Info Component Here */}
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
      />
    </div>
  );
} 