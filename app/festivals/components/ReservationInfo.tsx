import { ReservationInfo as ReservationInfoType } from '@/types/festival';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from 'react';

interface ReservationInfoProps {
  reservationInfos: ReservationInfoType[];
  onAddReservation?: () => void;
  onEditReservation?: () => void;
  showManageButtons?: boolean;
  onSaveNewReservation?: (reservation: Omit<ReservationInfoType, 'id'>) => void;
}

export default function ReservationInfo({ 
  reservationInfos, 
  onAddReservation, 
  onEditReservation, 
  showManageButtons = false,
  onSaveNewReservation
}: ReservationInfoProps) {
  const [isAddingReservation, setIsAddingReservation] = useState(false);
  const [isNoCloseDate, setIsNoCloseDate] = useState(false);
  const [newReservation, setNewReservation] = useState<Omit<ReservationInfoType, 'id'>>({
    openDateTime: '',
    closeDateTime: '',
    ticketURL: '',
    type: '',
    remark: ''
  });

  const handleAddReservationClick = () => {
    if (onAddReservation) {
      onAddReservation();
    } else {
      setIsAddingReservation(true);
    }
  };

  const handleSaveNewReservation = () => {
    if (!newReservation.openDateTime || !newReservation.closeDateTime || !newReservation.ticketURL || !newReservation.type) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    // 날짜 형식을 서버 형식으로 변환 (시간대 변환 없이)
    const formatDateTime = (dateTimeString: string) => {
      // datetime-local 입력값을 그대로 사용하되, 서버 형식에 맞게 변환
      // 예: "2025-07-12T18:00" -> "2025-07-12T18:00:00Z"
      if (dateTimeString.includes('T') && !dateTimeString.includes('Z')) {
        return `${dateTimeString}:00Z`;
      }
      return dateTimeString;
    };

    const reservationForServer = {
      ...newReservation,
      openDateTime: formatDateTime(newReservation.openDateTime),
      closeDateTime: formatDateTime(newReservation.closeDateTime),
    };

    if (onSaveNewReservation) {
      onSaveNewReservation(reservationForServer);
    }
    
    // 폼 초기화
    setNewReservation({
      openDateTime: '',
      closeDateTime: '',
      ticketURL: '',
      type: '',
      remark: ''
    });
    setIsAddingReservation(false);
  };

  const handleCancelAdd = () => {
    setIsAddingReservation(false);
    setIsNoCloseDate(false);
    setNewReservation({
      openDateTime: '',
      closeDateTime: '',
      ticketURL: '',
      type: '',
      remark: ''
    });
  };

  if (reservationInfos.length === 0 && !isAddingReservation) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        예매 정보가 없습니다.
        {showManageButtons && (
          <div className="mt-4 space-x-2">
            <Button size="sm" onClick={handleAddReservationClick}>
              예매정보 추가
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">예매 정보</h2>
      
      {/* 기존 예매정보 테이블 */}
      {reservationInfos.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm mb-6">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">예매 유형</TableHead>
                <TableHead className="font-semibold text-gray-700">오픈 일시</TableHead>
                <TableHead className="font-semibold text-gray-700">마감 일시</TableHead>
                <TableHead className="font-semibold text-gray-700">티켓 URL</TableHead>
                <TableHead className="font-semibold text-gray-700">비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reservationInfos.map((info) => (
                <TableRow key={info.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-900">
                    {info.type}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {format(new Date(info.openDateTime), 'yyyy/MM/dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {format(new Date(info.closeDateTime), 'yyyy/MM/dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-blue-600 hover:text-blue-700">
                    <a 
                      href={info.ticketURL} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:no-underline"
                    >
                      예매하기
                    </a>
                  </TableCell>
                  <TableCell className="text-gray-900">
                    {info.remark || '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 새 예매정보 추가 폼 */}
      {isAddingReservation && (
        <div className="border rounded-lg p-6 bg-gray-50 mb-6">
          <h3 className="text-lg font-medium mb-4">새 예매정보 추가</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">예매 유형</label>
              <Select onValueChange={(value) => setNewReservation(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="예매 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GENERAL">일반</SelectItem>
                  <SelectItem value="EARLY_BIRD">얼리버드</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">티켓 URL</label>
              <Input 
                type="url" 
                placeholder="https://example.com/ticket" 
                value={newReservation.ticketURL}
                onChange={(e) => setNewReservation(prev => ({ ...prev, ticketURL: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">오픈 일시</label>
              <Input 
                type="datetime-local" 
                value={newReservation.openDateTime}
                onChange={(e) => {
                  const newOpenDateTime = e.target.value;
                  setNewReservation(prev => ({
                    ...prev, 
                    openDateTime: newOpenDateTime,
                    // 마감일 없음이 설정되어 있으면 마감 일시도 함께 업데이트
                    closeDateTime: isNoCloseDate ? newOpenDateTime : prev.closeDateTime
                  }));
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">마감 일시</label>
              <div className="flex gap-2">
                <Input 
                  type="datetime-local" 
                  value={newReservation.closeDateTime}
                  onChange={(e) => setNewReservation(prev => ({ ...prev, closeDateTime: e.target.value }))}
                  disabled={isNoCloseDate}
                  className={isNoCloseDate ? 'bg-gray-100 text-gray-500' : ''}
                />
                <Button 
                  type="button"
                  variant={isNoCloseDate ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isNoCloseDate) {
                      // 마감일 없음 해제
                      setIsNoCloseDate(false);
                      setNewReservation(prev => ({ ...prev, closeDateTime: '' }));
                    } else {
                      // 마감일 없음 설정
                      setIsNoCloseDate(true);
                      setNewReservation(prev => ({ ...prev, closeDateTime: prev.openDateTime }));
                    }
                  }}
                  className="whitespace-nowrap"
                >
                  {isNoCloseDate ? '마감일 설정' : '마감일 없음'}
                </Button>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">비고</label>
              <Textarea 
                placeholder="추가 정보를 입력하세요" 
                value={newReservation.remark}
                onChange={(e) => setNewReservation(prev => ({ ...prev, remark: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveNewReservation}>저장</Button>
            <Button variant="outline" onClick={handleCancelAdd}>취소</Button>
          </div>
        </div>
      )}

      {/* 관리 버튼들 */}
      {showManageButtons && (
        <div className="flex gap-2">
          {!isAddingReservation && (
            <Button onClick={handleAddReservationClick}>
              예매정보 추가
            </Button>
          )}
        </div>
      )}
    </div>
  );
} 