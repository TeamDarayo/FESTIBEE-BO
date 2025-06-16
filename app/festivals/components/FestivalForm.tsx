import { useState, useEffect } from 'react';
import { Festival, TimeTable, ReservationInfo } from '@/types/festival';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
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
              <Label htmlFor="posterUrl" className="text-sm font-medium text-gray-700">포스터 URL</Label>
              <Input
                id="posterUrl"
                required
                value={formData.posterUrl}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, posterUrl: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="포스터 이미지 URL을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banGoods" className="text-sm font-medium text-gray-700">금지물품</Label>
              <Input
                id="banGoods"
                value={formData.banGoods}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, banGoods: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="금지물품 목록을 입력하세요"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transportationInfo" className="text-sm font-medium text-gray-700">교통정보</Label>
              <Input
                id="transportationInfo"
                value={formData.transportationInfo}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, transportationInfo: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="교통정보를 입력하세요"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
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
          </div>

          {/* 타임테이블 섹션 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">타임테이블</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="performanceDate" className="text-sm font-medium text-gray-700">공연일자</Label>
                <Input
                  id="performanceDate"
                  type="date"
                  value={newTimeTable.performanceDate}
                  onChange={(e) => setNewTimeTable(prev => ({ ...prev, performanceDate: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="performanceHall" className="text-sm font-medium text-gray-700">공연장</Label>
                <Input
                  id="performanceHall"
                  value={newTimeTable.performanceHall}
                  onChange={(e) => setNewTimeTable(prev => ({ ...prev, performanceHall: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="공연장 이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium text-gray-700">시작 시간</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newTimeTable.startTime}
                  onChange={(e) => setNewTimeTable(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-sm font-medium text-gray-700">종료 시간</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newTimeTable.endTime}
                  onChange={(e) => setNewTimeTable(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <Button
                type="button"
                onClick={handleAddTimeTable}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                타임테이블 추가
              </Button>
            </div>

            {formData.timeTables.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공연일자</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공연장</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시작 시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">종료 시간</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">아티스트</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.timeTables.map((tt) => (
                      <tr key={tt.timeTableId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(tt.performanceDate), 'yyyy/MM/dd')}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tt.performanceHall}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tt.startTime}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{tt.endTime}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {tt.artists.map(artist => artist.artistId).join(', ')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTimeTable(tt.timeTableId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 예매정보 섹션 */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">예매정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="space-y-2">
                <Label htmlFor="openDateTime" className="text-sm font-medium text-gray-700">예매 시작</Label>
                <Input
                  id="openDateTime"
                  type="datetime-local"
                  value={newReservationInfo.openDateTime}
                  onChange={(e) => setNewReservationInfo(prev => ({ ...prev, openDateTime: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="closeDateTime" className="text-sm font-medium text-gray-700">예매 종료</Label>
                <Input
                  id="closeDateTime"
                  type="datetime-local"
                  value={newReservationInfo.closeDateTime}
                  onChange={(e) => setNewReservationInfo(prev => ({ ...prev, closeDateTime: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ticketURL" className="text-sm font-medium text-gray-700">예매 URL</Label>
                <Input
                  id="ticketURL"
                  value={newReservationInfo.ticketURL}
                  onChange={(e) => setNewReservationInfo(prev => ({ ...prev, ticketURL: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="예매 URL을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-700">유형</Label>
                <Input
                  id="type"
                  value={newReservationInfo.type}
                  onChange={(e) => setNewReservationInfo(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="예매 유형을 입력하세요"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="remark" className="text-sm font-medium text-gray-700">비고</Label>
                <Input
                  id="remark"
                  value={newReservationInfo.remark}
                  onChange={(e) => setNewReservationInfo(prev => ({ ...prev, remark: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="추가 정보를 입력하세요"
                />
              </div>
            </div>

            <div className="flex justify-end mb-4">
              <Button
                type="button"
                onClick={handleAddReservationInfo}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg"
              >
                예매정보 추가
              </Button>
            </div>

            {formData.reservationInfos.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예매 시작</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예매 종료</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">예매 URL</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">비고</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">작업</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {formData.reservationInfos.map((ri) => (
                      <tr key={ri.reservationInfoId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(ri.openDateTime), 'yyyy/MM/dd HH:mm')}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{format(new Date(ri.closeDateTime), 'yyyy/MM/dd HH:mm')}</td>
                        <td className="px-6 py-4 text-sm text-blue-600 hover:text-blue-700">
                          <a href={ri.ticketURL} target="_blank" rel="noopener noreferrer">
                            {ri.ticketURL}
                          </a>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{ri.type}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{ri.remark}</td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveReservationInfo(ri.reservationInfoId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            삭제
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="px-6 py-2 rounded-lg border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              취소
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white hover:bg-blue-700 px-6 py-2 rounded-lg"
            >
              {initialData ? '수정하기' : '추가하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 