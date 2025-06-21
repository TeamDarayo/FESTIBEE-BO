import { useState, useEffect } from 'react';
import { Festival, TimeTable, ReservationInfo } from '@/types/festival';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import React from 'react';

interface FestivalFormProps {
  onSubmit: (data: Omit<Festival, 'id'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Festival;
  isOpen: boolean;
}

export default function FestivalForm({ onSubmit, onCancel, initialData, isOpen }: FestivalFormProps) {
  const [formData, setFormData] = useState<Omit<Festival, 'id'>>(() => ({
    name: initialData?.name || '',
    placeName: initialData?.placeName || '',
    placeAddress: initialData?.placeAddress || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    poster: initialData?.poster || '',
    bannedItems: initialData?.bannedItems || '',
    transportation: initialData?.transportation || '',
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
        poster: initialData.poster,
        bannedItems: initialData.bannedItems,
        transportation: initialData.transportation,
        remark: initialData.remark,
        timeTables: initialData.timeTables,
        reservationInfos: initialData.reservationInfos,
      });
    }
  }, [initialData]);

  const [newTimeTable, setNewTimeTable] = useState<Omit<TimeTable, 'id'>>({
    date: '',
    start: '',
    end: '',
    hall: '',
    artists: [],
  });
  const [newArtist, setNewArtist] = useState({ artistId: '', type: 'MAIN' });

  const [newReservationInfo, setNewReservationInfo] = useState<Omit<ReservationInfo, 'id'>>({
    openDate: '',
    closeDate: '',
    ticketUrl: '',
    type: '',
    remark: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleAddTimeTable = () => {
    if (!newTimeTable.date || !newTimeTable.start || !newTimeTable.end || !newTimeTable.hall) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      timeTables: [...prev.timeTables, { ...newTimeTable, id: Date.now().toString() }],
    }));

    setNewTimeTable({
      date: '',
      start: '',
      end: '',
      hall: '',
      artists: [],
    });
  };

  const handleRemoveTimeTable = (id: string) => {
    setFormData(prev => ({
      ...prev,
      timeTables: prev.timeTables.filter(tt => tt.id !== id),
    }));
  };

  const handleAddReservationInfo = () => {
    if (!newReservationInfo.openDate || !newReservationInfo.closeDate || !newReservationInfo.ticketUrl || !newReservationInfo.type) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      reservationInfos: [...prev.reservationInfos, { ...newReservationInfo, id: Date.now().toString() }],
    }));

    setNewReservationInfo({
      openDate: '',
      closeDate: '',
      ticketUrl: '',
      type: '',
      remark: '',
    });
  };

  const handleRemoveReservationInfo = (id: string) => {
    setFormData(prev => ({
      ...prev,
      reservationInfos: prev.reservationInfos.filter(ri => ri.id !== id),
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? '페스티벌 수정' : '새 페스티벌 추가'}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">이름</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="페스티벌 이름을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeName" className="text-sm font-medium text-gray-700">장소명</Label>
              <Input
                id="placeName"
                required
                value={formData.placeName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, placeName: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="장소명을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeAddress" className="text-sm font-medium text-gray-700">주소</Label>
              <Input
                id="placeAddress"
                required
                value={formData.placeAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, placeAddress: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="주소를 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-medium text-gray-700">시작일</Label>
              <Input
                id="startDate"
                type="date"
                required
                value={formData.startDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-medium text-gray-700">종료일</Label>
              <Input
                id="endDate"
                type="date"
                required
                value={formData.endDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poster" className="text-sm font-medium text-gray-700">포스터 URL</Label>
              <Input
                id="poster"
                type="url"
                required
                value={formData.poster}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, poster: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="포스터 이미지 URL을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bannedItems" className="text-sm font-medium text-gray-700">금지 물품</Label>
              <Input
                id="bannedItems"
                value={formData.bannedItems}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, bannedItems: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="금지 물품을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportation" className="text-sm font-medium text-gray-700">교통 정보</Label>
              <Input
                id="transportation"
                value={formData.transportation}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, transportation: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="교통 정보를 입력하세요"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="remark" className="text-sm font-medium text-gray-700">비고</Label>
            <Textarea
              id="remark"
              value={formData.remark}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="추가 정보를 입력하세요"
              rows={3}
            />
          </div>

          {/* 타임테이블 섹션 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">공연 일정</h3>
            
            {/* 기존 타임테이블 목록 */}
            {formData.timeTables.map((timeTable) => (
              <div key={timeTable.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">공연 일정</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveTimeTable(timeTable.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    삭제
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">날짜:</span> {timeTable.date}
                  </div>
                  <div>
                    <span className="font-medium">시작:</span> {timeTable.start}
                  </div>
                  <div>
                    <span className="font-medium">종료:</span> {timeTable.end}
                  </div>
                  <div>
                    <span className="font-medium">홀:</span> {timeTable.hall}
                  </div>
                </div>
                {timeTable.artists.length > 0 && (
                  <div className="mt-2">
                    <span className="font-medium">아티스트:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {timeTable.artists.map((artist, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {artist.artistId} ({artist.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 새 타임테이블 추가 */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-4">새 공연 일정 추가</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">날짜</Label>
                  <Input
                    type="date"
                    value={newTimeTable.date}
                    onChange={(e) => setNewTimeTable(prev => ({ ...prev, date: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">시작 시간</Label>
                  <Input
                    type="time"
                    value={newTimeTable.start}
                    onChange={(e) => setNewTimeTable(prev => ({ ...prev, start: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">종료 시간</Label>
                  <Input
                    type="time"
                    value={newTimeTable.end}
                    onChange={(e) => setNewTimeTable(prev => ({ ...prev, end: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">홀</Label>
                  <Input
                    value={newTimeTable.hall}
                    onChange={(e) => setNewTimeTable(prev => ({ ...prev, hall: e.target.value }))}
                    className="text-sm"
                    placeholder="홀명"
                  />
                </div>
              </div>

              {/* 아티스트 추가 */}
              <div className="mb-4">
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="아티스트 ID"
                    value={newArtist.artistId}
                    onChange={(e) => setNewArtist(prev => ({ ...prev, artistId: e.target.value }))}
                    className="text-sm flex-1"
                  />
                  <select
                    value={newArtist.type}
                    onChange={(e) => setNewArtist(prev => ({ ...prev, type: e.target.value }))}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="MAIN">메인</option>
                    <option value="SUB">서브</option>
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddArtistToTimeTable}
                    className="text-sm"
                  >
                    추가
                  </Button>
                </div>
                {newTimeTable.artists.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newTimeTable.artists.map((artist, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs flex items-center gap-1">
                        {artist.artistId} ({artist.type})
                        <button
                          type="button"
                          onClick={() => handleRemoveArtistFromTimeTable(artist.artistId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="button"
                onClick={handleAddTimeTable}
                className="w-full"
              >
                일정 추가
              </Button>
            </div>
          </div>

          {/* 예약 정보 섹션 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">예약 정보</h3>
            
            {/* 기존 예약 정보 목록 */}
            {formData.reservationInfos.map((reservationInfo) => (
              <div key={reservationInfo.id} className="border rounded-lg p-4 mb-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">예약 정보</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveReservationInfo(reservationInfo.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    삭제
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">오픈:</span> {reservationInfo.openDate}
                  </div>
                  <div>
                    <span className="font-medium">마감:</span> {reservationInfo.closeDate}
                  </div>
                  <div>
                    <span className="font-medium">유형:</span> {reservationInfo.type}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">티켓 URL:</span> {reservationInfo.ticketUrl}
                  </div>
                  {reservationInfo.remark && (
                    <div className="md:col-span-3">
                      <span className="font-medium">비고:</span> {reservationInfo.remark}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* 새 예약 정보 추가 */}
            <div className="border rounded-lg p-4 bg-white">
              <h4 className="font-medium mb-4">새 예약 정보 추가</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">오픈 날짜</Label>
                  <Input
                    type="datetime-local"
                    value={newReservationInfo.openDate}
                    onChange={(e) => setNewReservationInfo(prev => ({ ...prev, openDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">마감 날짜</Label>
                  <Input
                    type="datetime-local"
                    value={newReservationInfo.closeDate}
                    onChange={(e) => setNewReservationInfo(prev => ({ ...prev, closeDate: e.target.value }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">유형</Label>
                  <Input
                    value={newReservationInfo.type}
                    onChange={(e) => setNewReservationInfo(prev => ({ ...prev, type: e.target.value }))}
                    className="text-sm"
                    placeholder="예: 얼리버드"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <Label className="text-xs text-gray-600">티켓 URL</Label>
                  <Input
                    type="url"
                    value={newReservationInfo.ticketUrl}
                    onChange={(e) => setNewReservationInfo(prev => ({ ...prev, ticketUrl: e.target.value }))}
                    className="text-sm"
                    placeholder="티켓 예약 URL"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-600">비고</Label>
                  <Input
                    value={newReservationInfo.remark}
                    onChange={(e) => setNewReservationInfo(prev => ({ ...prev, remark: e.target.value }))}
                    className="text-sm"
                    placeholder="추가 정보"
                  />
                </div>
              </div>

              <Button
                type="button"
                onClick={handleAddReservationInfo}
                className="w-full"
              >
                예약 정보 추가
              </Button>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              취소
            </Button>
            <Button type="submit">
              {initialData ? '수정' : '추가'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 