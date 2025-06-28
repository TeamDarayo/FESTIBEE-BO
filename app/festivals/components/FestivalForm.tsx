import { useState, useEffect } from 'react';
import { Festival, TimeTable, ReservationInfo, TimeTableArtist } from '@/types/festival';
import { Place, PlaceRequestBody } from '@/types/place';
import { fetchPlaces, createPlace, addTimeTable } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PlaceForm from './PlaceForm';
import PasswordModal from '@/components/PasswordModal';
import React from 'react';

interface FestivalFormProps {
  onSubmit: (data: Omit<Festival, 'id'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Festival;
  isOpen: boolean;
}

const getInitialFormData = (initialData?: Festival): Omit<Festival, 'id'> => ({
  name: initialData?.name || '',
  placeId: initialData?.placeId || 0,
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
});

export default function FestivalForm({ onSubmit, onCancel, initialData, isOpen }: FestivalFormProps) {
  const [formData, setFormData] = useState<Omit<Festival, 'id'>>(() => getInitialFormData(initialData));
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [isPlaceFormOpen, setIsPlaceFormOpen] = useState(false);
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingPlaceData, setPendingPlaceData] = useState<PlaceRequestBody | null>(null);
  
  // 타임테이블 추가를 위한 비밀번호 모달 상태
  const [isTimeTablePasswordModalOpen, setIsTimeTablePasswordModalOpen] = useState(false);
  const [pendingTimeTableData, setPendingTimeTableData] = useState<any>(null);
  
  const [newTimeTable, setNewTimeTable] = useState<Omit<TimeTable, 'id'>>({
    performanceDate: '',
    startTime: '',
    endTime: '',
    hallId: 0,
    artists: [],
  });
  const [newArtist, setNewArtist] = useState<TimeTableArtist>({ artistId: 0, type: 'MAIN' });

  const [newReservationInfo, setNewReservationInfo] = useState<Omit<ReservationInfo, 'id'>>({
    openDateTime: '',
    closeDateTime: '',
    ticketURL: '',
    type: '',
    remark: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadPlaces();
      setFormData(getInitialFormData(initialData));
    }
  }, [initialData, isOpen]);

  // 장소 목록이 로드된 후 placeId 설정
  useEffect(() => {
    if (places.length > 0 && initialData?.placeName && !formData.placeId) {
      const matchingPlace = places.find(p => p.placeName === initialData.placeName);
      if (matchingPlace) {
        setFormData(prev => ({
          ...prev,
          placeId: matchingPlace.id,
          placeName: matchingPlace.placeName,
          placeAddress: matchingPlace.address,
        }));
      }
    }
  }, [places, initialData, formData.placeId]);

  const loadPlaces = async () => {
    setIsLoadingPlaces(true);
    try {
      const data = await fetchPlaces();
      setPlaces(data);
    } catch (error) {
      console.error("Failed to fetch places", error);
      alert("장소 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoadingPlaces(false);
    }
  };

  const handlePlaceSelect = (placeName: string) => {
    const selectedPlace = places.find(p => p.placeName === placeName);
    if (selectedPlace) {
      setFormData(prev => ({
        ...prev,
        placeId: selectedPlace.id,
        placeName: selectedPlace.placeName,
        placeAddress: selectedPlace.address,
        // Reset timetables when place changes as halls will be different
        timeTables: [], 
      }));
    }
  };
  
  const handleCreatePlace = async (placeData: PlaceRequestBody) => {
    setPendingPlaceData(placeData);
    setIsPasswordModalOpen(true);
  };
  
  const handlePasswordConfirmForPlace = async (password: string) => {
    if (!pendingPlaceData) return;
    try {
      await createPlace(pendingPlaceData);
      alert('장소가 성공적으로 추가되었습니다.');
      setIsPlaceFormOpen(false);
      await loadPlaces();
    } catch (error: any) {
      alert(`장소 추가 오류: ${error.message}`);
    } finally {
      setIsPasswordModalOpen(false);
      setPendingPlaceData(null);
    }
  };

  const selectedPlace = places.find(p => p.placeName === formData.placeName);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddTimeTable = () => {
    if (!newTimeTable.performanceDate || !newTimeTable.startTime || !newTimeTable.endTime) {
      alert('타임테이블의 날짜와 시간을 모두 입력해주세요.');
      return;
    }
    
    if (!newTimeTable.hallId || newTimeTable.hallId === 0) {
      alert('홀을 선택해주세요.');
      return;
    }

    if (!initialData?.id) {
      alert('페스티벌 ID가 없습니다.');
      return;
    }

    // 디버깅 정보 출력
    console.log('Selected place:', selectedPlace);
    console.log('Selected place ID:', selectedPlace?.id);
    console.log('Selected hall ID:', newTimeTable.hallId);
    console.log('Available halls:', selectedPlace?.halls);

    // 타임테이블 데이터를 저장하고 비밀번호 모달 열기
    setPendingTimeTableData({
      performanceDate: newTimeTable.performanceDate,
      startTime: newTimeTable.startTime,
      endTime: newTimeTable.endTime,
      hallId: newTimeTable.hallId,
    });
    setIsTimeTablePasswordModalOpen(true);
  };

  const handleTimeTablePasswordConfirm = async (password: string) => {
    if (!pendingTimeTableData || !initialData?.id) return;
    
    // 시간 형식을 HH:mm으로 변환
    const formatTime = (time: string) => {
      if (time.includes(':')) {
        return time; // 이미 HH:mm 형식인 경우
      }
      // HHmm 형식인 경우 HH:mm으로 변환
      if (time.length === 4) {
        return `${time.slice(0, 2)}:${time.slice(2)}`;
      }
      return time;
    };
    
    const formattedData = {
      performanceDate: pendingTimeTableData.performanceDate,
      startTime: formatTime(pendingTimeTableData.startTime),
      endTime: formatTime(pendingTimeTableData.endTime),
      hallId: pendingTimeTableData.hallId,
      password: password,
    };
    
    // 디버깅을 위한 로깅
    console.log('Performance ID:', initialData.id);
    console.log('Original TimeTable Data:', pendingTimeTableData);
    console.log('Formatted TimeTable Data:', formattedData);
    
    try {
      await addTimeTable(initialData.id, formattedData);
      
      alert('타임테이블이 성공적으로 추가되었습니다.');
      
      // 로컬 상태에 추가
      setFormData(prev => ({
        ...prev,
        timeTables: [...prev.timeTables, { 
          ...formattedData, 
          id: Date.now(), 
          artists: [] 
        }],
      }));

      // 입력 필드 초기화
      setNewTimeTable({
        performanceDate: '',
        startTime: '',
        endTime: '',
        hallId: 0,
        artists: [],
      });
    } catch (error: any) {
      let errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      if (error.message && error.message.includes('401')) {
        errorMessage = '비밀번호를 확인해주세요.';
      }
      alert(`오류: ${errorMessage}`);
      console.error('API Error:', error);
    } finally {
      setIsTimeTablePasswordModalOpen(false);
      setPendingTimeTableData(null);
    }
  };

  const handleTimeTablePasswordCancel = () => {
    setIsTimeTablePasswordModalOpen(false);
    setPendingTimeTableData(null);
  };

  const handleAddArtistToTimeTable = (timeTableId: string) => {
    if (!newArtist.artistId) {
      alert('아티스트 ID를 입력하세요.');
      return;
    }
    setFormData(prev => ({
      ...prev,
      timeTables: prev.timeTables.map(tt => 
        tt.id === timeTableId 
          ? { ...tt, artists: [...tt.artists, newArtist] }
          : tt
      )
    }));
    setNewArtist({ artistId: 0, type: 'MAIN' });
  };

  const handleRemoveArtistFromTimeTable = (timeTableId: string, artistIdToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      timeTables: prev.timeTables.map(tt =>
        tt.id === timeTableId
          ? { ...tt, artists: tt.artists.filter(a => a.artistId !== artistIdToRemove) }
          : tt
      ),
    }));
  };


  const handleAddReservationInfo = () => {
    if (!newReservationInfo.openDateTime || !newReservationInfo.closeDateTime || !newReservationInfo.ticketURL || !newReservationInfo.type) {
      alert('예매 정보의 모든 필수 필드를 입력해주세요.');
      return;
    }

    setFormData(prev => ({
      ...prev,
      reservationInfos: [...prev.reservationInfos, { ...newReservationInfo, id: Date.now().toString() }],
    }));

    setNewReservationInfo({
      openDateTime: '',
      closeDateTime: '',
      ticketURL: '',
      type: '',
      remark: '',
    });
  };

  const handleRemoveReservationInfo = (id: number) => {
    setFormData(prev => ({
      ...prev,
      reservationInfos: prev.reservationInfos.filter(ri => ri.id !== id),
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 z-10">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {initialData ? '페스티벌 수정' : '새 페스티벌 추가'}
            </h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>✕</Button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input id="name" required value={formData.name} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">장소</Label>
              <div className="flex gap-2">
                <Select onValueChange={handlePlaceSelect} value={formData.placeName || ''}>
                  <SelectTrigger>
                    <SelectValue placeholder="장소를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingPlaces ? (
                      <SelectItem value="loading" disabled>불러오는 중...</SelectItem>
                    ) : (
                      places.map(p => <SelectItem key={p.id} value={p.placeName}>{p.placeName}</SelectItem>)
                    )}
                  </SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setIsPlaceFormOpen(true)}>새 장소 추가</Button>
              </div>
              {selectedPlace && <p className="text-sm text-gray-500 mt-1">{selectedPlace.address}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate">시작일</Label>
              <Input id="startDate" type="date" required value={formData.startDate} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">종료일</Label>
              <Input id="endDate" type="date" required value={formData.endDate} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posterUrl">포스터 URL</Label>
              <Input id="posterUrl" type="url" required value={formData.posterUrl} onChange={handleInputChange} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="banGoods">금지 물품</Label>
              <Input id="banGoods" value={formData.banGoods} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="transportationInfo">교통 정보</Label>
              <Textarea id="transportationInfo" value={formData.transportationInfo} onChange={handleInputChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="remark">비고</Label>
              <Textarea id="remark" value={formData.remark} onChange={handleInputChange} />
            </div>
          </div>
          
          {/* TimeTables Section - 수정 시에만 표시 */}
          {initialData && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-medium">타임테이블 관리</h3>
              {formData.timeTables.map((tt, index) => (
                <div key={tt.id || index} className="p-4 border rounded-lg space-y-2">
                  <p>일시: {tt.performanceDate} {tt.startTime}~{tt.endTime}</p>
                  <p>홀: {tt.hallName || `ID: ${tt.hallId}`}</p>
                  <p>아티스트: {tt.artists.map(a => `ID ${a.artistId} (${a.type})`).join(', ')}</p>
                </div>
              ))}
              <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <h4 className="font-medium">새 타임테이블 추가</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input type="date" value={newTimeTable.performanceDate} onChange={e => setNewTimeTable(p => ({...p, performanceDate: e.target.value}))} />
                  <Input placeholder="시작시간 (HH:mm)" value={newTimeTable.startTime} onChange={e => setNewTimeTable(p => ({...p, startTime: e.target.value}))} />
                  <Input placeholder="종료시간 (HH:mm)" value={newTimeTable.endTime} onChange={e => setNewTimeTable(p => ({...p, endTime: e.target.value}))} />
                  <Select onValueChange={(hallId) => setNewTimeTable(p => ({...p, hallId: parseInt(hallId, 10)}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="홀 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedPlace?.halls.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.name} (ID: {h.id})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="button" onClick={handleAddTimeTable}>타임테이블 추가</Button>
              </div>
            </div>
          )}

          {/* ReservationInfos Section - 수정 시에만 표시 */}
          {initialData && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-lg font-medium">예매 정보 관리</h3>
              {formData.reservationInfos.map((ri, index) => (
                <div key={ri.id || index} className="p-4 border rounded-lg space-y-2">
                  <p>오픈: {ri.openDateTime}</p>
                  <p>마감: {ri.closeDateTime}</p>
                  <p>종류: {ri.type}</p>
                  <p>URL: {ri.ticketURL}</p>
                  <Button type="button" variant="outline" size="sm" onClick={() => handleRemoveReservationInfo(ri.id!)}>예매 정보 삭제</Button>
                </div>
              ))}
              <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <h4 className="font-medium">새 예매 정보 추가</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input type="datetime-local" placeholder="오픈 일시" value={newReservationInfo.openDateTime} onChange={e => setNewReservationInfo(p => ({...p, openDateTime: e.target.value}))} />
                  <Input type="datetime-local" placeholder="마감 일시" value={newReservationInfo.closeDateTime} onChange={e => setNewReservationInfo(p => ({...p, closeDateTime: e.target.value}))} />
                  <Input placeholder="예매 종류" value={newReservationInfo.type} onChange={e => setNewReservationInfo(p => ({...p, type: e.target.value}))} />
                  <Input type="url" placeholder="예매처 URL" value={newReservationInfo.ticketURL} onChange={e => setNewReservationInfo(p => ({...p, ticketURL: e.target.value}))} />
                  <Textarea placeholder="비고" value={newReservationInfo.remark} onChange={e => setNewReservationInfo(p => ({...p, remark: e.target.value}))} className="md:col-span-2" />
                </div>
                <Button type="button" onClick={handleAddReservationInfo}>예매 정보 추가</Button>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
      <PlaceForm 
        isOpen={isPlaceFormOpen}
        onCancel={() => setIsPlaceFormOpen(false)}
        onSubmit={handleCreatePlace}
      />
      <PasswordModal 
        isOpen={isPasswordModalOpen}
        onCancel={() => setIsPasswordModalOpen(false)}
        onConfirm={handlePasswordConfirmForPlace}
        title="장소 추가"
        message="새 장소를 추가하려면 관리자 비밀번호를 입력해주세요."
      />
      <PasswordModal 
        isOpen={isTimeTablePasswordModalOpen}
        onCancel={handleTimeTablePasswordCancel}
        onConfirm={handleTimeTablePasswordConfirm}
        title="타임테이블 추가"
        message="새 타임테이블을 추가하려면 관리자 비밀번호를 입력해주세요."
      />
    </div>
  );
} 