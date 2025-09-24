'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sendAlarmTest, AlarmTestRequest } from '@/lib/api';
import { FiBell, FiCalendar, FiClock, FiMapPin, FiInfo } from 'react-icons/fi';

interface AlarmCase {
  id: string;
  title: string;
  description: string;
  type: AlarmTestRequest['type'];
  requiresDayLeft: boolean;
  defaultDayLeft?: number;
  icon: React.ReactNode;
}

const alarmCases: AlarmCase[] = [
  {
    id: 'case1',
    title: 'CASE 1: 예약 오픈일 업데이트 알림',
    description: '지정한 날짜에 예약 오픈일이 업데이트된 공연에 대한 알림 발송',
    type: 'updateReservation',
    requiresDayLeft: false,
    icon: <FiBell className="text-blue-500" />
  },
  {
    id: 'case2',
    title: 'CASE 2: 예매일 알림',
    description: '지정한 날짜로부터 X일 이후에 예매일이 있는 공연에 대한 알림 발송',
    type: 'reservation',
    requiresDayLeft: true,
    defaultDayLeft: 1,
    icon: <FiCalendar className="text-green-500" />
  },
  {
    id: 'case3',
    title: 'CASE 3: 금지물품/교통안내 알림',
    description: '지정한 날짜 이후로 1일 이후에 실제 예매일 있는 공연에 대한 금지물품/교통안내 알림 발송',
    type: 'guide',
    requiresDayLeft: false,
    defaultDayLeft: 1,
    icon: <FiInfo className="text-orange-500" />
  }
];

export default function AlarmsPage() {
  const [selectedCase, setSelectedCase] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dayLeft, setDayLeft] = useState<string>('1');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  // 오늘 날짜를 기본값으로 설정
  const today = new Date().toISOString().split('T')[0];

  const handleSendAlarm = async () => {
    if (!selectedCase || !selectedDate) {
      alert('케이스와 날짜를 모두 선택해주세요.');
      return;
    }

    const alarmCase = alarmCases.find(c => c.id === selectedCase);
    if (!alarmCase) {
      alert('유효하지 않은 케이스입니다.');
      return;
    }

    setIsLoading(true);
    setResult('');

    try {
      const request: AlarmTestRequest = {
        type: alarmCase.type,
        date: selectedDate,
        // CASE 3과 CASE 4는 기본 dayLeft 값을 사용하고, CASE 2는 사용자 입력값 사용
        dayLeft: alarmCase.requiresDayLeft ? parseInt(dayLeft) : alarmCase.defaultDayLeft || 1
      };

      const response = await sendAlarmTest(request);
      setResult(`알람 테스트가 성공적으로 발송되었습니다.\n응답: ${JSON.stringify(response, null, 2)}`);
    } catch (error: any) {
      setResult(`알람 테스트 발송 실패: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaseChange = (caseId: string) => {
    setSelectedCase(caseId);
    const alarmCase = alarmCases.find(c => c.id === caseId);
    if (alarmCase?.defaultDayLeft) {
      setDayLeft(alarmCase.defaultDayLeft.toString());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">알람 테스트 관리</h1>
        <p className="text-gray-600">다양한 케이스의 알람을 테스트 발송할 수 있습니다.</p>
      </div>

      {/* 알람 케이스 선택 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">알람 케이스 선택</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alarmCases.map((alarmCase) => (
            <div
              key={alarmCase.id}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedCase === alarmCase.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
              onClick={() => handleCaseChange(alarmCase.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl mt-1">{alarmCase.icon}</div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 mb-1">{alarmCase.title}</h3>
                  <p className="text-sm text-gray-600">{alarmCase.description}</p>
                  {alarmCase.requiresDayLeft && (
                    <p className="text-xs text-blue-600 mt-1">* dayLeft 파라미터 필요</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 설정 폼 */}
      {selectedCase && (
        <div className="mb-8 p-6 bg-gray-50 rounded-lg border">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">테스트 설정</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                날짜 선택
              </label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                오늘 이후의 날짜를 선택해주세요.
              </p>
            </div>

            {alarmCases.find(c => c.id === selectedCase)?.requiresDayLeft && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  일수 설정 (dayLeft)
                </label>
                <Input
                  type="number"
                  value={dayLeft}
                  onChange={(e) => setDayLeft(e.target.value)}
                  min="1"
                  max="365"
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  지정한 날짜로부터 몇 일 후를 의미합니다.
                </p>
              </div>
            )}
          </div>

          
        </div>
      )}

      {/* 발송 버튼 */}
      {selectedCase && selectedDate && (
        <div className="mb-8">
          <Button
            onClick={handleSendAlarm}
            disabled={isLoading}
            className="w-full md:w-auto px-8 py-3 text-lg"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                발송 중...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FiBell />
                알람 테스트 발송
              </div>
            )}
          </Button>
        </div>
      )}

      {/* 결과 표시 */}
      {result && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">발송 결과</h2>
          <div className="p-4 bg-gray-100 rounded-lg border">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {result}
            </pre>
          </div>
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>주의:</strong> 발송 대상이 없어도 성공으로 처리됩니다.
            </p>
          </div>
        </div>
      )}


    </div>
  );
} 