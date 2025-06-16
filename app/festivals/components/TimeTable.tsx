import { useState, useMemo } from 'react';
import { TimeTable as TimeTableType } from '@/types/festival';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TimeTableProps {
  timeTables: TimeTableType[];
}

export default function TimeTable({ timeTables }: TimeTableProps) {
  // 날짜별로 타임테이블 그룹화
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

  // 모든 공연장 목록 추출
  const halls = useMemo(() => {
    const uniqueHalls = new Set(timeTables.map(tt => tt.performanceHall));
    return Array.from(uniqueHalls).sort();
  }, [timeTables]);

  // 모든 시간대 추출 및 정렬
  const timeSlots = useMemo(() => {
    const times = new Set<string>();
    timeTables.forEach(tt => {
      times.add(tt.startTime);
      times.add(tt.endTime);
    });
    return Array.from(times).sort();
  }, [timeTables]);

  if (timeTablesByDate.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        타임테이블 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">공연 타임테이블</h2>
      <Tabs defaultValue={timeTablesByDate[0][0]} className="w-full">
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

        {timeTablesByDate.map(([date, tables]) => (
          <TabsContent key={date} value={date}>
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[100px] font-semibold text-gray-700">시간</TableHead>
                    {halls.map(hall => (
                      <TableHead key={hall} className="font-semibold text-gray-700">{hall}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeSlots.map(time => (
                    <TableRow key={time} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-600">{time}</TableCell>
                      {halls.map(hall => {
                        const performance = tables.find(
                          tt => tt.performanceHall === hall && 
                          (tt.startTime === time || tt.endTime === time)
                        );
                        
                        if (!performance) {
                          return <TableCell key={hall} />;
                        }

                        const isStart = performance.startTime === time;
                        const rowSpan = timeSlots.indexOf(performance.endTime) - 
                                      timeSlots.indexOf(performance.startTime) + 1;

                        if (!isStart) return null;

                        return (
                          <TableCell 
                            key={hall} 
                            rowSpan={rowSpan}
                            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors"
                          >
                            <div className="font-medium text-blue-800">
                              {performance.artists.map(artist => artist.artistId).join(', ')}
                            </div>
                            <div className="text-sm text-blue-600 mt-1">
                              {performance.startTime} - {performance.endTime}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
} 