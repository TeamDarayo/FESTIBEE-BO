import { useState, useEffect } from 'react';
import { Festival, TimeTable, ReservationInfo } from '@/types/festival';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';

interface FestivalFormProps {
  onSubmit: (data: Omit<Festival, 'festivalId'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Festival;
  isOpen: boolean;
}

export default function FestivalForm({ onSubmit, onCancel, initialData, isOpen }: FestivalFormProps) {
  const [formData, setFormData] = useState<Omit<Festival, 'festivalId'>>(() => ({
    name: initialData?.name || '',
    placeName: initialData?.placeName || '',
    placeAddress: initialData?.placeAddress || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    posterUrl: initialData?.posterUrl || '',
    banGoods: initialData?.banGoods || '',
    transportationInfo: initialData?.transportationInfo || '',
    remark: initialData?.remark || '',
    timeTables: initialData?.timeTables || [],
    reservationInfos: initialData?.reservationInfos || [],
  }));

  // initialData가 변경될 때 formData 업데이트
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        placeName: initialData.placeName,
        placeAddress: initialData.placeAddress,
        startDate: initialData.startDate,
        endDate: initialData.endDate,
        posterUrl: initialData.posterUrl,
        banGoods: initialData.banGoods,
        transportationInfo: initialData.transportationInfo,
        remark: initialData.remark,
        timeTables: initialData.timeTables,
        reservationInfos: initialData.reservationInfos,
      });
    }
  }, [initialData]);

  const [newTimeTable, setNewTimeTable] = useState<Omit<TimeTable, 'timeTableId'>>({
    performanceDate: '',
    startTime: '',
    endTime: '',
    performanceHall: '',
    artists: [],
  });
  const [newArtist, setNewArtist] = useState({ artistId: '', type: 'MAIN' });

  const [newReservationInfo, setNewReservationInfo] = useState<Omit<ReservationInfo, 'reservationInfoId'>>({
    openDateTime: '',
    closeDateTime: '',
    ticketURL: '',
    type: '',
    remark: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddTimeTable = () => {
    if (!newTimeTable.performanceDate || !newTimeTable.startTime || !newTimeTable.endTime || !newTimeTable.performanceHall) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      timeTables: [...prev.timeTables, { ...newTimeTable, timeTableId: Date.now().toString() }],
    }));

    setNewTimeTable({
      performanceDate: '',
      startTime: '',
      endTime: '',
      performanceHall: '',
      artists: [],
    });
  };

  const handleRemoveTimeTable = (timeTableId: string) => {
    setFormData(prev => ({
      ...prev,
      timeTables: prev.timeTables.filter(tt => tt.timeTableId !== timeTableId),
    }));
  };

  const handleAddReservationInfo = () => {
    if (!newReservationInfo.openDateTime || !newReservationInfo.closeDateTime || !newReservationInfo.ticketURL || !newReservationInfo.type) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      reservationInfos: [...prev.reservationInfos, { ...newReservationInfo, reservationInfoId: Date.now().toString() }],
    }));

    setNewReservationInfo({
      openDateTime: '',
      closeDateTime: '',
      ticketURL: '',
      type: '',
      remark: '',
    });
  };

  const handleRemoveReservationInfo = (reservationInfoId: string) => {
    setFormData(prev => ({
      ...prev,
      reservationInfos: prev.reservationInfos.filter(ri => ri.reservationInfoId !== reservationInfoId),
    }));
  };

  const handleAddArtistToTimeTable = () => {
    if (!newArtist.artistId || !newArtist.type) {
      alert('아티스트 ID와 유형을 입력하세요.');
      return;
    }
    setNewTimeTable(prev => ({
      ...prev,
      artists: [...prev.artists, { ...newArtist }],
    }));
    setNewArtist({ artistId: '', type: 'MAIN' });
  };

  const handleRemoveArtistFromTimeTable = (artistId: string) => {
    setNewTimeTable(prev => ({
      ...prev,
      artists: prev.artists.filter(a => a.artistId !== artistId),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">{initialData ? 'Edit Festival' : 'Add New Festival'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="placeName">장소명</Label>
              <Input
                id="placeName"
                required
                value={formData.placeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="placeAddress">주소</Label>
              <Input
                id="placeAddress"
                required
                value={formData.placeAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, placeAddress: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="startDate">시작일</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="endDate">종료일</Label>
              <Input
                id="endDate"
                type="date"
                required
                value={formData.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="posterUrl">포스터 URL</Label>
              <Input
                id="posterUrl"
                required
                value={formData.posterUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="banGoods">금지물품</Label>
              <Input
                id="banGoods"
                value={formData.banGoods}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, banGoods: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="transportationInfo">교통정보</Label>
              <Input
                id="transportationInfo"
                value={formData.transportationInfo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, transportationInfo: e.target.value }))}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="remark">비고</Label>
              <Textarea
                id="remark"
                value={formData.remark}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              />
            </div>
          </div>

          {/* 타임테이블 섹션 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">타임테이블</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="performanceDate">공연일자</Label>
                <Input
                  id="performanceDate"
                  type="date"
                  value={newTimeTable.performanceDate}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTimeTable(prev => ({ ...prev, performanceDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="performanceHall">공연장</Label>
                <Input
                  id="performanceHall"
                  value={newTimeTable.performanceHall}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTimeTable(prev => ({ ...prev, performanceHall: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="startTime">시작시간</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newTimeTable.startTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTimeTable(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">종료시간</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newTimeTable.endTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTimeTable(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            {/* artists 입력 UI */}
            <div className="mb-2">
              <div className="flex gap-2 items-end">
                <div>
                  <Label htmlFor="artistId">아티스트 ID</Label>
                  <Input
                    id="artistId"
                    value={newArtist.artistId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewArtist(prev => ({ ...prev, artistId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="artistType">유형</Label>
                  <Input
                    id="artistType"
                    value={newArtist.type}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewArtist(prev => ({ ...prev, type: e.target.value }))}
                    placeholder="MAIN 또는 SUB"
                  />
                </div>
                <Button type="button" onClick={handleAddArtistToTimeTable} className="h-10">아티스트 추가</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {newTimeTable.artists.map((artist, idx) => (
                  <div key={artist.artistId + idx} className="flex items-center bg-gray-100 rounded px-2 py-1">
                    <span>{artist.artistId} ({artist.type})</span>
                    <Button type="button" size="sm" variant="destructive" className="ml-2 px-1 py-0.5" onClick={() => handleRemoveArtistFromTimeTable(artist.artistId)}>삭제</Button>
                  </div>
                ))}
              </div>
            </div>
            <Button type="button" onClick={handleAddTimeTable}>타임테이블 추가</Button>

            <div className="mt-4 space-y-2">
              {formData.timeTables.map((tt) => (
                <div key={tt.timeTableId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>
                    {tt.performanceDate} {tt.startTime}-{tt.endTime} ({tt.performanceHall})
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveTimeTable(tt.timeTableId)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* 예매정보 섹션 */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">예매정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="openDateTime">예매시작</Label>
                <Input
                  id="openDateTime"
                  type="datetime-local"
                  value={newReservationInfo.openDateTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservationInfo(prev => ({ ...prev, openDateTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="closeDateTime">예매종료</Label>
                <Input
                  id="closeDateTime"
                  type="datetime-local"
                  value={newReservationInfo.closeDateTime}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservationInfo(prev => ({ ...prev, closeDateTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="ticketURL">예매URL</Label>
                <Input
                  id="ticketURL"
                  value={newReservationInfo.ticketURL}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservationInfo(prev => ({ ...prev, ticketURL: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="type">유형</Label>
                <Input
                  id="type"
                  value={newReservationInfo.type}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservationInfo(prev => ({ ...prev, type: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="reservationRemark">비고</Label>
                <Input
                  id="reservationRemark"
                  value={newReservationInfo.remark}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewReservationInfo(prev => ({ ...prev, remark: e.target.value }))}
                />
              </div>
            </div>
            <Button type="button" onClick={handleAddReservationInfo}>예매정보 추가</Button>

            <div className="mt-4 space-y-2">
              {formData.reservationInfos.map((ri) => (
                <div key={ri.reservationInfoId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span>
                    {ri.type}: {ri.openDateTime} ~ {ri.closeDateTime}
                  </span>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveReservationInfo(ri.reservationInfoId)}
                  >
                    삭제
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              취소
            </Button>
            <Button type="submit">
              {initialData ? '수정' : '등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 