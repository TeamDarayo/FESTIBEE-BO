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
    return <div className="text-center py-4">타임테이블 정보가 없습니다.</div>;
  }

  return (
    <Tabs defaultValue={timeTablesByDate[0][0]} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        {timeTablesByDate.map(([date]) => (
          <TabsTrigger key={date} value={date}>
            {format(new Date(date), 'MM/dd (EEE)')}
          </TabsTrigger>
        ))}
      </TabsList>

      {timeTablesByDate.map(([date, tables]) => (
        <TabsContent key={date} value={date}>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">시간</TableHead>
                  {halls.map(hall => (
                    <TableHead key={hall}>{hall}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map(time => (
                  <TableRow key={time}>
                    <TableCell className="font-medium">{time}</TableCell>
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
                          className="bg-blue-50 border border-blue-200"
                        >
                          <div className="font-medium">
                            {performance.artists.map(artist => artist.artistId).join(', ')}
                          </div>
                          <div className="text-sm text-gray-500">
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
  );
} 