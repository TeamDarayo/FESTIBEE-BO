import { useMemo, useState, useEffect } from 'react';
import { TimeTable as TimeTableType } from '@/types/festival';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchArtists, addTimeTableArtist, deleteTimeTableArtist } from '@/lib/api';

interface Artist {
  id: number;
  name: string;
  description: string;
  aliases: { id: number; name: string }[];
}

interface TimeTableProps {
  timeTables: TimeTableType[];
  onAddTimeTable?: () => void;
  onEditTimeTable?: () => void;
  showManageButtons?: boolean;
  onSaveNewTimeTable?: (timeTable: Omit<TimeTableType, 'id'>) => void;
  availableHalls?: { id: number; name: string }[];
  festivalStartDate?: string; // 페스티벌 시작 날짜
}

export default function TimeTable({ 
  timeTables, 
  onAddTimeTable, 
  onEditTimeTable, 
  showManageButtons = false,
  onSaveNewTimeTable,
  availableHalls = [],
  festivalStartDate
}: TimeTableProps) {
  const [isAddingTimeTable, setIsAddingTimeTable] = useState(false);
  const [isEditingArtists, setIsEditingArtists] = useState(false);
  const [selectedTimeTable, setSelectedTimeTable] = useState<TimeTableType | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<{ artistId: number; participationType: string }[]>([]);
  const [artistSearchTerm, setArtistSearchTerm] = useState('');
  const [lastAddedArtistIndex, setLastAddedArtistIndex] = useState<number | null>(null);
  const [deletingArtistIndex, setDeletingArtistIndex] = useState<number | null>(null);
  const [newTimeTable, setNewTimeTable] = useState<Omit<TimeTableType, 'id'>>({
    performanceDate: festivalStartDate || '',
    startTime: '',
    endTime: '',
    hallId: 0,
    artists: []
  });

  // 아티스트 목록 가져오기
  useEffect(() => {
    const loadArtists = async () => {
      try {
        const artistData = await fetchArtists();
        setArtists(artistData);
      } catch (error) {
        console.error('Failed to load artists:', error);
      }
    };
    loadArtists();
  }, []);

  // 10분 단위로 반올림하는 함수
  const roundToNearest10Minutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 10) * 10;
    const adjustedHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  };

  const timeTablesByDate = useMemo(() => {
    const grouped = timeTables.reduce((acc, tt) => {
      const date = tt.performanceDate;
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(tt);
      return acc;
    }, {} as Record<string, TimeTableType[]>);

    return Object.entries(grouped).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  }, [timeTables]);

  const halls = useMemo(() => {
    // availableHalls가 있으면 그것을 사용, 없으면 기존 타임테이블에서 추출
    if (availableHalls.length > 0) {
      return availableHalls.map(hall => [hall.id, hall.name] as [number, string]);
    }
    
    // 기존 타임테이블에서 홀 정보 추출 (fallback)
    const uniqueHalls = new Map<number, string>();
    timeTables.forEach(tt => {
      if (tt.hallId && !uniqueHalls.has(tt.hallId)) {
        uniqueHalls.set(tt.hallId, tt.hallName || `Hall ID ${tt.hallId}`);
      }
    });
    return Array.from(uniqueHalls.entries()).sort((a,b) => a[0] - b[0]);
  }, [timeTables, availableHalls]);

  const timeSlots = useMemo(() => {
    const times = new Set<string>();
    
    // 기존 타임테이블에서 시간 추출
    timeTables.forEach(tt => {
      times.add(tt.startTime);
      times.add(tt.endTime);
    });
    
    // 새로운 타임테이블에서도 시간 추출
    if (newTimeTable.startTime) times.add(newTimeTable.startTime);
    if (newTimeTable.endTime) times.add(newTimeTable.endTime);
    
    // 시간이 없으면 기본 시간대 생성 (09:00 ~ 23:00, 10분 간격)
    if (times.size === 0) {
      for (let hour = 9; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
          times.add(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
    }
    
    // 시간 정렬
    return Array.from(times).sort((a, b) => a.localeCompare(b));
  }, [timeTables, newTimeTable]);

  // 10분 단위로 시간대 생성
  const generateTimeSlots = useMemo(() => {
    const slots = new Set<string>();
    
    // 기존 타임테이블의 시작/종료 시간을 10분 단위로 반올림
    timeTables.forEach(tt => {
      const startTime = roundToNearest10Minutes(tt.startTime);
      const endTime = roundToNearest10Minutes(tt.endTime);
      slots.add(startTime);
      slots.add(endTime);
    });
    
    // 새로운 타임테이블도 포함
    if (newTimeTable.startTime) {
      slots.add(roundToNearest10Minutes(newTimeTable.startTime));
    }
    if (newTimeTable.endTime) {
      slots.add(roundToNearest10Minutes(newTimeTable.endTime));
    }
    
    // 시간이 없으면 기본 시간대 생성 (09:00 ~ 23:00, 10분 간격)
    if (slots.size === 0) {
      for (let hour = 9; hour <= 23; hour++) {
        for (let minute = 0; minute < 60; minute += 10) {
          slots.add(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
        }
      }
    }
    
    return Array.from(slots).sort((a, b) => a.localeCompare(b));
  }, [timeTables, newTimeTable]);

  // 공연이 있는 시간대만 필터링
  const filteredTimeSlots = useMemo(() => {
    if (timeTables.length === 0) return generateTimeSlots;
    
    const performanceTimes = new Set<string>();
    timeTables.forEach(tt => {
      const startTime = roundToNearest10Minutes(tt.startTime);
      const endTime = roundToNearest10Minutes(tt.endTime);
      performanceTimes.add(startTime);
      performanceTimes.add(endTime);
    });
    
    return generateTimeSlots.filter(time => performanceTimes.has(time));
  }, [generateTimeSlots, timeTables]);

  // 검색어에 따라 아티스트 필터링
  const filteredArtists = useMemo(() => {
    if (!artistSearchTerm.trim()) return artists;
    
    const searchTerm = artistSearchTerm.toLowerCase();
    return artists.filter(artist => 
      artist.name.toLowerCase().includes(searchTerm) ||
      artist.aliases.some(alias => alias.name.toLowerCase().includes(searchTerm))
    );
  }, [artists, artistSearchTerm]);

  // 디버깅 로그
  console.log('TimeTable component - availableHalls:', availableHalls);
  console.log('TimeTable component - timeTables:', timeTables);
  console.log('TimeTable component - timeTablesByDate:', timeTablesByDate);
  console.log('TimeTable component - timeSlots:', timeSlots);
  console.log('TimeTable component - generateTimeSlots:', generateTimeSlots);
  console.log('TimeTable component - filteredTimeSlots:', filteredTimeSlots);
  console.log('TimeTable component - halls:', halls);
  
  // 각 타임테이블의 상세 정보 로깅
  timeTables.forEach((tt, index) => {
    console.log(`TimeTable ${index}:`, {
      id: tt.id,
      date: tt.performanceDate,
      startTime: tt.startTime,
      endTime: tt.endTime,
      hallName: tt.hallName,
      hallId: tt.hallId,
      artists: tt.artists
    });
  });

  const handleAddTimeTableClick = () => {
    if (onAddTimeTable) {
      onAddTimeTable();
    } else {
      setIsAddingTimeTable(true);
    }
  };

  const handleSaveNewTimeTable = () => {
    if (!newTimeTable.performanceDate || !newTimeTable.startTime || !newTimeTable.endTime || !newTimeTable.hallId) {
      alert('모든 필수 필드를 입력해주세요.');
      return;
    }

    if (onSaveNewTimeTable) {
      onSaveNewTimeTable(newTimeTable);
    }
    
    // 폼 초기화 (페스티벌 시작 날짜를 기본값으로 설정)
    setNewTimeTable({
      performanceDate: festivalStartDate || '',
      startTime: '',
      endTime: '',
      hallId: 0,
      artists: []
    });
    setIsAddingTimeTable(false);
  };

  const handleCancelAdd = () => {
    setIsAddingTimeTable(false);
    setNewTimeTable({
      performanceDate: festivalStartDate || '',
      startTime: '',
      endTime: '',
      hallId: 0,
      artists: []
    });
  };

  const handleTimeTableClick = (timeTable: TimeTableType) => {
    setSelectedTimeTable(timeTable);
    setSelectedArtists(timeTable.artists.map(artist => ({
      artistId: artist.artistId,
      participationType: artist.type
    })));
    setIsEditingArtists(true);
  };

  const handleSaveArtists = async () => {
    if (selectedArtists.length === 0) {
      alert('최소 1명 이상의 아티스트를 선택해주세요.');
      return;
    }

    if (!selectedTimeTable) {
      alert('타임테이블을 찾을 수 없습니다.');
      return;
    }

    try {
      // 기존 아티스트와 새로운 아티스트 비교
      const existingArtists = selectedTimeTable.artists || [];
      const newArtists = selectedArtists.filter(artist => artist.artistId !== 0);
      
      // 새로운 아티스트 추가 (삭제는 이미 개별적으로 처리됨)
      const artistsToAdd = newArtists.filter(newArtist => 
        !existingArtists.some(existing => existing.artistId === newArtist.artistId)
      );

      // 추가 API 호출
      for (const artist of artistsToAdd) {
        await addTimeTableArtist(selectedTimeTable.id!, {
          artistId: artist.artistId,
          participationType: artist.participationType
        });
      }

      alert('아티스트가 성공적으로 업데이트되었습니다.');
      
      // 페이지 새로고침을 위해 부모 컴포넌트에 알림
      if (onSaveNewTimeTable) {
        // 빈 객체를 전달하여 새로고침 트리거
        onSaveNewTimeTable({} as any);
      }
      
    } catch (error: any) {
      console.error('아티스트 업데이트 오류:', error);
      alert(`아티스트 업데이트 오류: ${error.message}`);
    } finally {
      setIsEditingArtists(false);
      setSelectedTimeTable(null);
      setSelectedArtists([]);
      setArtistSearchTerm('');
      setLastAddedArtistIndex(null);
    }
  };

  const handleCancelArtists = () => {
    setIsEditingArtists(false);
    setSelectedTimeTable(null);
    setSelectedArtists([]);
    setArtistSearchTerm('');
    setLastAddedArtistIndex(null);
  };

  const addArtist = () => {
    const newIndex = selectedArtists.length;
    setSelectedArtists([...selectedArtists, { artistId: 0, participationType: 'MAIN' }]);
    setLastAddedArtistIndex(newIndex);
    setArtistSearchTerm('');
  };

  const removeArtist = async (index: number) => {
    const artistToRemove = selectedArtists[index];
    
    // 기존 아티스트인 경우 (timetableArtistId가 있는 경우) API 호출
    if (selectedTimeTable && artistToRemove.artistId !== 0) {
      const existingArtist = selectedTimeTable.artists.find(a => a.artistId === artistToRemove.artistId);
      if (existingArtist?.timetableArtistId) {
        setDeletingArtistIndex(index);
        try {
          await deleteTimeTableArtist(selectedTimeTable.id!, existingArtist.artistId);
          console.log('아티스트가 성공적으로 삭제되었습니다.');
        } catch (error: any) {
          console.error('아티스트 삭제 오류:', error);
          alert(`아티스트 삭제 오류: ${error.message}`);
          setDeletingArtistIndex(null);
          return; // 삭제 실패 시 UI에서 제거하지 않음
        } finally {
          setDeletingArtistIndex(null);
        }
      }
    }
    
    // UI에서 아티스트 제거
    setSelectedArtists(selectedArtists.filter((_, i) => i !== index));
    
    // 마지막 추가된 아티스트가 삭제되면 검색 상태 초기화
    if (lastAddedArtistIndex === index) {
      setLastAddedArtistIndex(null);
      setArtistSearchTerm('');
    } else if (lastAddedArtistIndex !== null && lastAddedArtistIndex > index) {
      // 삭제된 인덱스보다 큰 인덱스들을 조정
      setLastAddedArtistIndex(lastAddedArtistIndex - 1);
    }
  };

  const updateArtist = (index: number, field: 'artistId' | 'participationType', value: string | number) => {
    const updated = [...selectedArtists];
    updated[index] = { ...updated[index], [field]: field === 'artistId' ? Number(value) : value };
    setSelectedArtists(updated);
    
    // 아티스트가 선택되면 검색 상태 초기화
    if (field === 'artistId' && lastAddedArtistIndex === index) {
      setLastAddedArtistIndex(null);
      setArtistSearchTerm('');
    }
  };

  if (timeTablesByDate.length === 0 && !isAddingTimeTable) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">공연 타임테이블</h2>
        
        {/* 장소 정보 표시 */}
        {availableHalls.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">장소:</span> {availableHalls[0]?.name?.includes('공연장') || availableHalls[0]?.name?.includes('홀') ? 
                availableHalls.map(hall => hall.name).join(', ') : 
                `${availableHalls.length}개 홀`}
            </p>
          </div>
        )}
        
        {/* 빈 타임테이블 표시 */}
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">타임테이블 정보가 없습니다.</h3>
            {availableHalls.length > 0 && (
              <div className="text-sm text-gray-600">
                <p>이 장소의 홀: {availableHalls.map(hall => hall.name).join(', ')}</p>
              </div>
            )}
          </div>
          {showManageButtons && (
            <div className="mt-4 space-x-2">
              <Button size="sm" onClick={handleAddTimeTableClick}>
                타임테이블 추가
              </Button>
            </div>
          )}
        </div>
        
        {/* 빈 시간대 테이블 표시 */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px] font-semibold text-gray-700">시간</TableHead>
                {halls.map(([hallId, hallName]) => (
                  <TableHead key={hallId} className="font-semibold text-gray-700">{hallName}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimeSlots.map((time) => (
                <TableRow key={time} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-600">{time}</TableCell>
                  {halls.map(([hallId]) => (
                    <TableCell key={hallId} className="text-gray-400">-</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">공연 타임테이블</h2>
      
      {/* 장소 정보 표시 */}
      {availableHalls.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-700">
            <span className="font-medium">장소:</span> {availableHalls[0]?.name?.includes('공연장') || availableHalls[0]?.name?.includes('홀') ? 
              availableHalls.map(hall => hall.name).join(', ') : 
              `${availableHalls.length}개 홀`}
          </p>
        </div>
      )}
      
      {/* 기존 타임테이블 */}
      {timeTablesByDate.length > 0 && (
        <Tabs defaultValue={timeTablesByDate.length > 0 ? timeTablesByDate[0][0] : ''} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 p-1 rounded-lg">
            {timeTablesByDate.map(([date]) => (
              <TabsTrigger 
                key={date} 
                value={date}
                className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm"
              >
                {format(new Date(date), 'MM/dd (EEE)')}
              </TabsTrigger>
            ))}
          </TabsList>

          {timeTablesByDate.map(([date, tablesForDate]) => (
            <TabsContent key={date} value={date}>
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[100px] font-semibold text-gray-700">시간</TableHead>
                      {halls.map(([hallId, hallName]) => (
                        <TableHead key={hallId} className="font-semibold text-gray-700">{hallName}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimeSlots.map((time, timeIndex) => (
                      <TableRow key={time} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-600">{time}</TableCell>
                        {halls.map(([hallId]) => {
                          const performance = tablesForDate.find(
                            tt => tt.hallId === hallId && roundToNearest10Minutes(tt.startTime) === time
                          );
                          
                          if (!performance) {
                            // Check if this cell is part of a rowspan
                            const ongoingPerformance = tablesForDate.find(tt => 
                              tt.hallId === hallId &&
                              roundToNearest10Minutes(tt.startTime) < time &&
                              roundToNearest10Minutes(tt.endTime) > time
                            );
                            return ongoingPerformance ? null : <TableCell key={hallId} />;
                          }

                          // 공연이 시작되는 시간에만 표시
                          if (roundToNearest10Minutes(performance.startTime) === time) {
                            const startIdx = filteredTimeSlots.findIndex(t => t === roundToNearest10Minutes(performance.startTime));
                            const endIdx = filteredTimeSlots.findIndex(t => t === roundToNearest10Minutes(performance.endTime));
                            const rowSpan = endIdx >= startIdx ? endIdx - startIdx + 1 : 1;
                            
                            return (
                              <TableCell 
                                key={hallId} 
                                rowSpan={rowSpan}
                                className="bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors align-top cursor-pointer"
                                onClick={() => handleTimeTableClick(performance)}
                              >
                                <div className="font-medium text-purple-700 p-2">
                                  {(() => {
                                    const mainArtists = performance.artists.filter(artist => artist.type === 'MAIN');
                                    const subArtists = performance.artists.filter(artist => artist.type === 'SUB');
                                    
                                    let displayText = mainArtists.map(artist => artist.artistName || `ID ${artist.artistId}`).join(', ');
                                    
                                    if (subArtists.length > 0) {
                                      const subArtistNames = subArtists.map(artist => artist.artistName || `ID ${artist.artistId}`).join(', ');
                                      displayText += ` (With ${subArtistNames})`;
                                    }
                                    
                                    return displayText;
                                  })()}
                                </div>
                                <div className="text-sm text-green-600 mt-1 p-2 font-medium">
                                  {performance.startTime.split(':').slice(0, 2).join(':')} - {performance.endTime.split(':').slice(0, 2).join(':')}
                                </div>
                                <div className="text-xs text-blue-500 mt-1 p-2">
                                  클릭하여 아티스트 편집
                                </div>
                              </TableCell>
                            );
                          }
                          
                          return null;
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* 새 타임테이블 추가 폼 */}
      {isAddingTimeTable && (
        <div className="border rounded-lg p-6 bg-gray-50 mb-6">
          <h3 className="text-lg font-medium mb-4">새 타임테이블 추가</h3>
          
          {/* 기본값 설정 버튼들 */}
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">빠른 설정</h4>
            <div className="flex gap-2 flex-wrap">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setNewTimeTable(prev => ({ 
                  ...prev, 
                  performanceDate: '0001-01-01',
                  startTime: '00:00',
                  endTime: '00:00'
                }))}
                className="text-yellow-700 border-yellow-300"
              >
                날짜/시간 미정 설정
              </Button>
              {newTimeTable.performanceDate && (!newTimeTable.startTime || !newTimeTable.endTime) && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setNewTimeTable(prev => ({ 
                    ...prev, 
                    startTime: '00:00',
                    endTime: '00:00'
                  }))}
                  className="text-yellow-700 border-yellow-300"
                >
                  시간 미정 설정
                </Button>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">공연 날짜</label>
              <Input 
                type="date" 
                value={newTimeTable.performanceDate}
                onChange={(e) => setNewTimeTable(prev => ({ ...prev, performanceDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">홀</label>
              <Select onValueChange={(value) => setNewTimeTable(prev => ({ ...prev, hallId: parseInt(value, 10) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="홀 선택" />
                </SelectTrigger>
                <SelectContent>
                  {availableHalls.map(hall => (
                    <SelectItem key={hall.id} value={hall.id.toString()}>{hall.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <div className="flex gap-2">
                <Select 
                  value={newTimeTable.startTime ? newTimeTable.startTime.split(':')[0] : ''} 
                  onValueChange={(hour) => {
                    const currentMinute = newTimeTable.startTime ? newTimeTable.startTime.split(':')[1] || '00' : '00';
                    setNewTimeTable(prev => ({ ...prev, startTime: `${hour}:${currentMinute}` }));
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="시" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center text-gray-500">:</span>
                <Select 
                  value={newTimeTable.startTime ? newTimeTable.startTime.split(':')[1] : ''} 
                  onValueChange={(minute) => {
                    const currentHour = newTimeTable.startTime ? newTimeTable.startTime.split(':')[0] || '00' : '00';
                    setNewTimeTable(prev => ({ ...prev, startTime: `${currentHour}:${minute}` }));
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="분" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const minute = i * 5;
                      return (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <div className="flex gap-2">
                <Select 
                  value={newTimeTable.endTime ? newTimeTable.endTime.split(':')[0] : ''} 
                  onValueChange={(hour) => {
                    const currentMinute = newTimeTable.endTime ? newTimeTable.endTime.split(':')[1] || '00' : '00';
                    setNewTimeTable(prev => ({ ...prev, endTime: `${hour}:${currentMinute}` }));
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="시" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString().padStart(2, '0')}>
                        {i.toString().padStart(2, '0')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center text-gray-500">:</span>
                <Select 
                  value={newTimeTable.endTime ? newTimeTable.endTime.split(':')[1] : ''} 
                  onValueChange={(minute) => {
                    const currentHour = newTimeTable.endTime ? newTimeTable.endTime.split(':')[0] || '00' : '00';
                    setNewTimeTable(prev => ({ ...prev, endTime: `${currentHour}:${minute}` }));
                  }}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue placeholder="분" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => {
                      const minute = i * 5;
                      return (
                        <SelectItem key={minute} value={minute.toString().padStart(2, '0')}>
                          {minute.toString().padStart(2, '0')}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSaveNewTimeTable}>저장</Button>
            <Button variant="outline" onClick={handleCancelAdd}>취소</Button>
          </div>
        </div>
      )}

      {/* 관리 버튼들 */}
      {showManageButtons && (
        <div className="flex gap-2">
          {!isAddingTimeTable && (
            <Button onClick={handleAddTimeTableClick}>
              타임테이블 추가
            </Button>
          )}
        </div>
      )}

      {/* 아티스트 편집 모달 */}
      {isEditingArtists && selectedTimeTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">아티스트 편집</h3>
            
            {/* 타임테이블 정보 */}
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                <span className="font-medium">날짜:</span> {selectedTimeTable.performanceDate} | 
                <span className="font-medium"> 시간:</span> {selectedTimeTable.startTime} - {selectedTimeTable.endTime} | 
                <span className="font-medium"> 홀:</span> {selectedTimeTable.hallName}
              </p>
            </div>

            {/* 아티스트 목록 */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">아티스트 목록</h4>
                <Button size="sm" onClick={addArtist}>아티스트 추가</Button>
              </div>
              
              {/* 아티스트 검색 - 마지막 추가된 아티스트에만 표시 */}
              {lastAddedArtistIndex !== null && (
                <div className="mb-3">
                  <Input
                    type="text"
                    placeholder="아티스트 이름 또는 별명으로 검색..."
                    value={artistSearchTerm}
                    onChange={(e) => setArtistSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
              )}
              
                              {selectedArtists.map((artist, index) => (
                  <div key={index} className="flex gap-2 mb-2 p-2 border rounded">
                    <Select 
                      value={artist.artistId.toString()} 
                      onValueChange={(value) => updateArtist(index, 'artistId', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="아티스트 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {(lastAddedArtistIndex === index ? filteredArtists : artists).length > 0 ? (
                          (lastAddedArtistIndex === index ? filteredArtists : artists).map(a => (
                            <SelectItem key={a.id} value={a.id.toString()}>
                              {a.name}
                              {a.aliases.length > 0 && (
                                <span className="text-gray-500 ml-1">({a.aliases[0].name})</span>
                              )}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-results" disabled>
                            검색 결과가 없습니다
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  
                  <Select 
                    value={artist.participationType} 
                    onValueChange={(value) => updateArtist(index, 'participationType', value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MAIN">메인</SelectItem>
                      <SelectItem value="SUB">서브</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => removeArtist(index)}
                    disabled={deletingArtistIndex === index}
                    className="text-red-600"
                  >
                    {deletingArtistIndex === index ? '삭제 중...' : '삭제'}
                  </Button>
                </div>
              ))}
            </div>

            {/* 버튼들 */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveArtists}>저장</Button>
              <Button variant="outline" onClick={handleCancelArtists}>취소</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 