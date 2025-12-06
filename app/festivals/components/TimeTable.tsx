import { useMemo, useState, useEffect } from 'react';
import { TimeTable as TimeTableType } from '@/types/festival';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  fetchArtists, 
  addTimeTableArtist, 
  deleteTimeTableArtist, 
  updateTimeTable,
  addHalls,
  updateHall
} from '@/lib/api';
import PasswordModal from '@/components/PasswordModal';

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
  festivalStartDate?: string;
  performanceId?: number;
  placeId?: number;
  onRefresh?: () => void;
}

export default function TimeTable({ 
  timeTables, 
  onAddTimeTable, 
  onEditTimeTable, 
  showManageButtons = false,
  onSaveNewTimeTable,
  availableHalls = [],
  festivalStartDate,
  performanceId,
  placeId,
  onRefresh
}: TimeTableProps) {
  const [isAddingTimeTable, setIsAddingTimeTable] = useState(false);
  const [isEditingArtists, setIsEditingArtists] = useState(false);
  const [selectedTimeTable, setSelectedTimeTable] = useState<TimeTableType | null>(null);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<{ artistId: number; participationType: string }[]>([]);
  const [artistSearchTerm, setArtistSearchTerm] = useState('');
  const [lastAddedArtistIndex, setLastAddedArtistIndex] = useState<number | null>(null);
  const [deletingArtistIndex, setDeletingArtistIndex] = useState<number | null>(null);
  
  // 날짜 관리 모달
  const [isDateEditModalOpen, setIsDateEditModalOpen] = useState(false);
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [isDatePasswordModalOpen, setIsDatePasswordModalOpen] = useState(false);
  const [pendingDateChange, setPendingDateChange] = useState<{ oldDate: string; newDate: string } | null>(null);
  
  // 날짜 추가 모달
  const [isAddDateModalOpen, setIsAddDateModalOpen] = useState(false);
  const [addingNewDate, setAddingNewDate] = useState('');
  
  // 홀 관리 모달
  const [isHallEditModalOpen, setIsHallEditModalOpen] = useState(false);
  const [editingHall, setEditingHall] = useState<{ id: number; name: string } | null>(null);
  const [newHallName, setNewHallName] = useState('');
  const [isHallPasswordModalOpen, setIsHallPasswordModalOpen] = useState(false);
  const [pendingHallChange, setPendingHallChange] = useState<{ id: number; name: string } | null>(null);
  
  // 홀 추가 모달
  const [isAddHallModalOpen, setIsAddHallModalOpen] = useState(false);
  const [addingHallName, setAddingHallName] = useState('');
  const [isAddHallPasswordModalOpen, setIsAddHallPasswordModalOpen] = useState(false);
  const [pendingHallAdd, setPendingHallAdd] = useState<string | null>(null);
  
  // 로컬 홀 상태 (동적으로 관리)
  const [localHalls, setLocalHalls] = useState<{ id: number; name: string }[]>(availableHalls);
  
  const [newTimeTable, setNewTimeTable] = useState<Omit<TimeTableType, 'id'>>({
    performanceDate: festivalStartDate || '',
    startTime: '',
    endTime: '',
    hallId: undefined,
    artists: []
  });

  // availableHalls가 변경되면 localHalls 업데이트
  useEffect(() => {
    setLocalHalls(availableHalls);
  }, [availableHalls]);

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
    if (!time) return '00:00';
    const [hours, minutes] = time.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 10) * 10;
    const adjustedHours = hours + Math.floor(roundedMinutes / 60);
    const finalMinutes = roundedMinutes % 60;
    return `${adjustedHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
  };

  const timeTablesByDate = useMemo(() => {
    const grouped = timeTables.reduce((acc, tt) => {
      const date = tt.performanceDate || '미정';
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(tt);
      return acc;
    }, {} as Record<string, TimeTableType[]>);

    return Object.entries(grouped).sort(([dateA], [dateB]) => {
      // '미정'은 항상 마지막
      if (dateA === '미정') return 1;
      if (dateB === '미정') return -1;
      return dateA.localeCompare(dateB);
    });
  }, [timeTables]);

  const halls = useMemo(() => {
    return localHalls.map(hall => [hall.id, hall.name] as [number, string]);
  }, [localHalls]);

  const timeSlots = useMemo(() => {
    const times = new Set<string>();
    
    // 기존 타임테이블에서 시간 추출
    timeTables.forEach(tt => {
      if (tt.startTime) times.add(tt.startTime);
      if (tt.endTime) times.add(tt.endTime);
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
      if (tt.startTime) {
        const startTime = roundToNearest10Minutes(tt.startTime);
        slots.add(startTime);
      }
      if (tt.endTime) {
        const endTime = roundToNearest10Minutes(tt.endTime);
        slots.add(endTime);
      }
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
      if (tt.startTime) {
        const startTime = roundToNearest10Minutes(tt.startTime);
        performanceTimes.add(startTime);
      }
      if (tt.endTime) {
        const endTime = roundToNearest10Minutes(tt.endTime);
        performanceTimes.add(endTime);
      }
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

  const handleAddTimeTableClick = () => {
    if (onAddTimeTable) {
      onAddTimeTable();
    } else {
      setIsAddingTimeTable(true);
    }
  };

  const handleSaveNewTimeTable = () => {
    if (!newTimeTable.performanceDate || !newTimeTable.startTime || !newTimeTable.endTime) {
      alert('날짜와 시간을 입력해주세요.');
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
      hallId: undefined,
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
      hallId: undefined,
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
      
      // 페이지 새로고침
      if (onRefresh) {
        onRefresh();
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

  // 날짜 수정 핸들러
  const handleEditDate = (date: string) => {
    setEditingDate(date);
    setNewDate(date);
    setIsDateEditModalOpen(true);
  };

  const handleSaveDateEdit = () => {
    if (!newDate || !editingDate) return;
    if (newDate === editingDate) {
      setIsDateEditModalOpen(false);
      return;
    }
    
    setPendingDateChange({ oldDate: editingDate, newDate });
    setIsDateEditModalOpen(false);
    setIsDatePasswordModalOpen(true);
  };

  const handleDatePasswordConfirm = async (password: string) => {
    if (!pendingDateChange || !performanceId) return;

    try {
      // 해당 날짜의 모든 시간표 찾기
      const timeTablesForDate = timeTables.filter(tt => tt.performanceDate === pendingDateChange.oldDate);
      
      // 각 시간표의 날짜 업데이트 (모든 필드 포함)
      for (const tt of timeTablesForDate) {
        if (tt.id) {
          await updateTimeTable(performanceId, tt.id, { 
            performanceDate: pendingDateChange.newDate,
            startTime: tt.startTime || '00:00',
            endTime: tt.endTime || '00:00',
            hallId: tt.hallId ?? null
          }, password);
        }
      }

      alert('날짜가 성공적으로 변경되었습니다.');
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('날짜 변경 오류:', error);
      alert(`날짜 변경 오류: ${error.message}`);
    } finally {
      setIsDatePasswordModalOpen(false);
      setPendingDateChange(null);
      setEditingDate(null);
    }
  };

  // 날짜 추가 핸들러
  const handleAddDate = () => {
    setAddingNewDate(festivalStartDate || '');
    setIsAddDateModalOpen(true);
  };

  const handleSaveNewDate = () => {
    if (!addingNewDate) {
      alert('날짜를 입력해주세요.');
      return;
    }
    
    // 새 날짜에 기본 시간표 추가
    if (onSaveNewTimeTable) {
      onSaveNewTimeTable({
        performanceDate: addingNewDate,
        startTime: '00:00',
        endTime: '00:00',
        hallId: undefined,
        artists: []
      });
    }
    
    setIsAddDateModalOpen(false);
    setAddingNewDate('');
  };

  // 홀 수정 핸들러
  const handleEditHall = (hall: { id: number; name: string }) => {
    setEditingHall(hall);
    setNewHallName(hall.name);
    setIsHallEditModalOpen(true);
  };

  const handleSaveHallEdit = () => {
    if (!newHallName || !editingHall) return;
    if (newHallName === editingHall.name) {
      setIsHallEditModalOpen(false);
      return;
    }
    
    setPendingHallChange({ id: editingHall.id, name: newHallName });
    setIsHallEditModalOpen(false);
    setIsHallPasswordModalOpen(true);
  };

  const handleHallPasswordConfirm = async (password: string) => {
    if (!pendingHallChange) return;

    try {
      await updateHall(pendingHallChange.id, { name: pendingHallChange.name }, password);
      
      // 로컬 상태 업데이트
      setLocalHalls(prev => 
        prev.map(h => h.id === pendingHallChange.id ? { ...h, name: pendingHallChange.name } : h)
      );

      alert('홀 이름이 성공적으로 변경되었습니다.');
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('홀 이름 변경 오류:', error);
      alert(`홀 이름 변경 오류: ${error.message}`);
    } finally {
      setIsHallPasswordModalOpen(false);
      setPendingHallChange(null);
      setEditingHall(null);
    }
  };

  // 홀 추가 핸들러
  const handleAddHall = () => {
    setAddingHallName('');
    setIsAddHallModalOpen(true);
  };

  const handleSaveNewHall = () => {
    if (!addingHallName.trim()) {
      alert('홀 이름을 입력해주세요.');
      return;
    }
    
    if (!placeId) {
      alert('장소 ID를 찾을 수 없습니다.');
      return;
    }
    
    setPendingHallAdd(addingHallName);
    setIsAddHallModalOpen(false);
    setIsAddHallPasswordModalOpen(true);
  };

  const handleAddHallPasswordConfirm = async (password: string) => {
    if (!pendingHallAdd || !placeId) return;

    try {
      const newHalls = await addHalls(placeId, [pendingHallAdd], password);
      
      // 로컬 상태에 새 홀 추가
      if (newHalls.length > 0) {
        setLocalHalls(prev => [...prev, newHalls[0]]);
      }

      alert('홀이 성공적으로 추가되었습니다.');
      
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      console.error('홀 추가 오류:', error);
      alert(`홀 추가 오류: ${error.message}`);
    } finally {
      setIsAddHallPasswordModalOpen(false);
      setPendingHallAdd(null);
      setAddingHallName('');
    }
  };

  if (timeTablesByDate.length === 0 && !isAddingTimeTable) {
    return (
      <div className="w-full max-w-7xl mx-auto p-4">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">공연 타임테이블</h2>
        
        {/* 장소 정보 표시 */}
        {localHalls.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-700">
              <span className="font-medium">장소:</span> {localHalls.map(hall => hall.name).join(', ')}
            </p>
          </div>
        )}
        
        {/* 빈 타임테이블 표시 */}
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg mb-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-700 mb-2">타임테이블 정보가 없습니다.</h3>
            {localHalls.length > 0 && (
              <div className="text-sm text-gray-600">
                <p>이 장소의 홀: {localHalls.map(hall => hall.name).join(', ')}</p>
              </div>
            )}
          </div>
          {showManageButtons && (
            <div className="mt-4 space-x-2">
              <Button size="sm" onClick={handleAddTimeTableClick}>
                타임테이블 추가
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddDate}>
                날짜 추가
              </Button>
              <Button size="sm" variant="outline" onClick={handleAddHall}>
                홀 추가
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
                  <TableHead 
                    key={hallId} 
                    className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => showManageButtons && handleEditHall({ id: hallId, name: hallName })}
                  >
                    {hallName}
                  </TableHead>
                ))}
                {showManageButtons && (
                  <TableHead className="w-[60px]">
                    <Button size="sm" variant="ghost" onClick={handleAddHall} className="h-8 w-8 p-0">
                      <span className="text-xl text-blue-600">+</span>
                    </Button>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTimeSlots.map((time) => (
                <TableRow key={time} className="hover:bg-gray-50">
                  <TableCell className="font-medium text-gray-600">{time}</TableCell>
                  {halls.map(([hallId]) => (
                    <TableCell key={hallId} className="text-gray-400">-</TableCell>
                  ))}
                  {showManageButtons && <TableCell />}
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
      {localHalls.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200 flex justify-between items-center">
          <p className="text-sm text-blue-700">
            <span className="font-medium">장소:</span> {localHalls.map(hall => hall.name).join(', ')}
          </p>
          {showManageButtons && (
            <Button size="sm" variant="outline" onClick={handleAddHall} className="text-blue-600">
              홀 추가 +
            </Button>
          )}
        </div>
      )}
      
      {/* 기존 타임테이블 */}
      {timeTablesByDate.length > 0 && (
        <Tabs defaultValue={timeTablesByDate.length > 0 ? timeTablesByDate[0][0] : ''} className="w-full mb-6">
          <div className="flex items-center gap-2 mb-6">
            <TabsList className="flex-1 grid auto-cols-fr grid-flow-col bg-gray-100 p-1 rounded-lg">
              {timeTablesByDate.map(([date]) => (
                <TabsTrigger 
                  key={date} 
                  value={date}
                  className="data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm relative group"
                >
                  <div className="flex items-center gap-2">
                    <span>
                      {date === '미정' ? '날짜 미정' : format(new Date(date), 'MM/dd (EEE)')}
                    </span>
                    {showManageButtons && date !== '미정' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditDate(date);
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs bg-blue-500 hover:bg-blue-600 text-white rounded px-2 py-0.5"
                      >
                        수정
                      </button>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
            {showManageButtons && (
              <Button size="sm" variant="outline" onClick={handleAddDate} className="flex-shrink-0">
                날짜 추가 +
              </Button>
            )}
          </div>

          {timeTablesByDate.map(([date, tablesForDate]) => (
            <TabsContent key={date} value={date}>
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[100px] font-semibold text-gray-700">시간</TableHead>
                      {halls.map(([hallId, hallName]) => (
                        <TableHead 
                          key={hallId} 
                          className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors relative group"
                          onClick={() => showManageButtons && handleEditHall({ id: hallId, name: hallName })}
                        >
                          <div className="flex items-center justify-between">
                            <span>{hallName}</span>
                            {showManageButtons && (
                              <span className="opacity-0 group-hover:opacity-100 text-xs text-blue-600">
                                수정
                              </span>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      {showManageButtons && (
                        <TableHead className="w-[60px]">
                          <Button size="sm" variant="ghost" onClick={handleAddHall} className="h-8 w-8 p-0">
                            <span className="text-xl text-blue-600">+</span>
                          </Button>
                        </TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTimeSlots.map((time) => (
                      <TableRow key={time} className="hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-600">{time}</TableCell>
                        {halls.map(([hallId]) => {
                          const performance = tablesForDate.find(
                            tt => tt.hallId === hallId && roundToNearest10Minutes(tt.startTime || '') === time
                          );
                          
                          if (!performance) {
                            // Check if this cell is part of a rowspan
                            const ongoingPerformance = tablesForDate.find(tt => 
                              tt.hallId === hallId &&
                              tt.startTime && tt.endTime &&
                              roundToNearest10Minutes(tt.startTime) < time &&
                              roundToNearest10Minutes(tt.endTime) > time
                            );
                            return ongoingPerformance ? null : <TableCell key={hallId} />;
                          }

                          // 공연이 시작되는 시간에만 표시
                          if (performance.startTime && roundToNearest10Minutes(performance.startTime) === time) {
                            const startIdx = filteredTimeSlots.findIndex(t => t === roundToNearest10Minutes(performance.startTime || ''));
                            const endIdx = filteredTimeSlots.findIndex(t => t === roundToNearest10Minutes(performance.endTime || ''));
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
                                    
                                    if (mainArtists.length === 0 && subArtists.length === 0) {
                                      return <span className="text-gray-400">아티스트 미정</span>;
                                    }
                                    
                                    let displayText = mainArtists.map(artist => artist.artistName || `ID ${artist.artistId}`).join(', ');
                                    
                                    if (subArtists.length > 0) {
                                      const subArtistNames = subArtists.map(artist => artist.artistName || `ID ${artist.artistId}`).join(', ');
                                      displayText += ` (With ${subArtistNames})`;
                                    }
                                    
                                    return displayText;
                                  })()}
                                </div>
                                <div className="text-sm text-green-600 mt-1 p-2 font-medium">
                                  {performance.startTime?.split(':').slice(0, 2).join(':') || '00:00'} - {performance.endTime?.split(':').slice(0, 2).join(':') || '00:00'}
                                </div>
                                <div className="text-xs text-blue-500 mt-1 p-2">
                                  클릭하여 아티스트 편집
                                </div>
                              </TableCell>
                            );
                          }
                          
                          return null;
                        })}
                        {showManageButtons && <TableCell />}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">홀 (선택사항)</label>
              <Select 
                value={newTimeTable.hallId?.toString() || 'none'} 
                onValueChange={(value) => setNewTimeTable(prev => ({ ...prev, hallId: value === 'none' ? undefined : parseInt(value, 10) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="홀 선택 (선택사항)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">홀 미정</SelectItem>
                  {localHalls.map(hall => (
                    <SelectItem key={hall.id} value={hall.id.toString()}>{hall.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <Input 
                type="time" 
                value={newTimeTable.startTime}
                onChange={(e) => setNewTimeTable(prev => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <Input 
                type="time" 
                value={newTimeTable.endTime}
                onChange={(e) => setNewTimeTable(prev => ({ ...prev, endTime: e.target.value }))}
              />
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
                <span className="font-medium"> 홀:</span> {selectedTimeTable.hallName || '미정'}
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
              
              {/* 아티스트 목록 스크롤 영역 */}
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                {selectedArtists.map((artist, index) => (
                  <div key={index} className="flex gap-2 mb-2 p-2 border rounded bg-gray-50">
                    <Select 
                      value={artist.artistId.toString()} 
                      onValueChange={(value) => updateArtist(index, 'artistId', value)}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="아티스트 선택" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
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
                    <SelectContent className="max-h-60 overflow-y-auto">
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
            </div>

            {/* 버튼들 */}
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveArtists}>저장</Button>
              <Button variant="outline" onClick={handleCancelArtists}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 수정 모달 */}
      {isDateEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">날짜 수정</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새로운 날짜
              </label>
              <Input 
                type="date" 
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                이 날짜의 모든 시간표가 새 날짜로 변경됩니다.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveDateEdit}>확인</Button>
              <Button variant="outline" onClick={() => setIsDateEditModalOpen(false)}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* 날짜 추가 모달 */}
      {isAddDateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">날짜 추가</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                추가할 날짜
              </label>
              <Input 
                type="date" 
                value={addingNewDate}
                onChange={(e) => setAddingNewDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-2">
                새 날짜에 기본 시간표가 생성됩니다.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveNewDate}>확인</Button>
              <Button variant="outline" onClick={() => setIsAddDateModalOpen(false)}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* 홀 수정 모달 */}
      {isHallEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">홀 이름 수정</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                새로운 홀 이름
              </label>
              <Input 
                type="text" 
                value={newHallName}
                onChange={(e) => setNewHallName(e.target.value)}
                placeholder="홀 이름 입력"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveHallEdit}>확인</Button>
              <Button variant="outline" onClick={() => setIsHallEditModalOpen(false)}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* 홀 추가 모달 */}
      {isAddHallModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">홀 추가</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                홀 이름
              </label>
              <Input 
                type="text" 
                value={addingHallName}
                onChange={(e) => setAddingHallName(e.target.value)}
                placeholder="홀 이름 입력"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={handleSaveNewHall}>확인</Button>
              <Button variant="outline" onClick={() => setIsAddHallModalOpen(false)}>취소</Button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 모달들 */}
      <PasswordModal 
        isOpen={isDatePasswordModalOpen}
        onCancel={() => {
          setIsDatePasswordModalOpen(false);
          setPendingDateChange(null);
        }}
        onConfirm={handleDatePasswordConfirm}
        title="날짜 변경"
        message="날짜를 변경하려면 관리자 비밀번호를 입력해주세요."
      />

      <PasswordModal 
        isOpen={isHallPasswordModalOpen}
        onCancel={() => {
          setIsHallPasswordModalOpen(false);
          setPendingHallChange(null);
        }}
        onConfirm={handleHallPasswordConfirm}
        title="홀 이름 변경"
        message="홀 이름을 변경하려면 관리자 비밀번호를 입력해주세요."
      />

      <PasswordModal 
        isOpen={isAddHallPasswordModalOpen}
        onCancel={() => {
          setIsAddHallPasswordModalOpen(false);
          setPendingHallAdd(null);
        }}
        onConfirm={handleAddHallPasswordConfirm}
        title="홀 추가"
        message="홀을 추가하려면 관리자 비밀번호를 입력해주세요."
      />
    </div>
  );
}
