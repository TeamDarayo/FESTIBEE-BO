import { useMemo } from 'react';
import { TimeTable as TimeTableType } from '@/types/festival';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface TimeTableProps {
  timeTables: TimeTableType[];
}

export default function TimeTable({ timeTables }: TimeTableProps) {
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
    const uniqueHalls = new Map<number, string>();
    timeTables.forEach(tt => {
      if (!uniqueHalls.has(tt.hallId)) {
        uniqueHalls.set(tt.hallId, tt.hallName || `Hall ID ${tt.hallId}`);
      }
    });
    return Array.from(uniqueHalls.entries()).sort((a,b) => a[0] - b[0]);
  }, [timeTables]);

  const timeSlots = useMemo(() => {
    const times = new Set<string>();
    timeTables.forEach(tt => {
      times.add(tt.startTime);
      times.add(tt.endTime);
    });
    // 시간 정렬 (예: "19:00", "20:30")
    return Array.from(times).sort((a, b) => a.localeCompare(b));
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
      <Tabs defaultValue={timeTablesByDate.length > 0 ? timeTablesByDate[0][0] : ''} className="w-full">
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
                  {timeSlots.map((time, timeIndex) => (
                    <TableRow key={time} className="hover:bg-gray-50">
                      <TableCell className="font-medium text-gray-600">{time}</TableCell>
                      {halls.map(([hallId]) => {
                        const performance = tablesForDate.find(
                          tt => tt.hallId === hallId && tt.startTime === time
                        );
                        
                        if (!performance) {
                          // Check if this cell is part of a rowspan
                          const ongoingPerformance = tablesForDate.find(tt => 
                            tt.hallId === hallId &&
                            tt.startTime < time &&
                            tt.endTime > time
                          );
                          return ongoingPerformance ? null : <TableCell key={hallId} />;
                        }

                        const startIdx = timeSlots.findIndex(t => t === performance.startTime);
                        const endIdx = timeSlots.findIndex(t => t === performance.endTime);
                        const rowSpan = endIdx >= startIdx ? endIdx - startIdx : 1;
                        
                        return (
                          <TableCell 
                            key={hallId} 
                            rowSpan={rowSpan}
                            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors align-top"
                          >
                            <div className="font-medium text-blue-800 p-2">
                              {performance.artists.map(artist => artist.artistName || `ID ${artist.artistId}`).join(', ')}
                            </div>
                            <div className="text-sm text-blue-600 mt-1 p-2">
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