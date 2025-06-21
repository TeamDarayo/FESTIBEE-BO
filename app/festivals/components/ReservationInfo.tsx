import { ReservationInfo as ReservationInfoType } from '@/types/festival';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface ReservationInfoProps {
  reservationInfos: ReservationInfoType[];
}

export default function ReservationInfo({ reservationInfos }: ReservationInfoProps) {
  if (reservationInfos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
        예매 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">예매 정보</h2>
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="font-semibold text-gray-700">예매 유형</TableHead>
              <TableHead className="font-semibold text-gray-700">오픈 날짜</TableHead>
              <TableHead className="font-semibold text-gray-700">마감 날짜</TableHead>
              <TableHead className="font-semibold text-gray-700">티켓 URL</TableHead>
              <TableHead className="font-semibold text-gray-700">비고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservationInfos.map((reservationInfo) => (
              <TableRow key={reservationInfo.id} className="hover:bg-gray-50">
                <TableCell className="font-medium text-gray-900">
                  {reservationInfo.type}
                </TableCell>
                <TableCell className="text-gray-900">
                  {format(new Date(reservationInfo.openDate), 'yyyy/MM/dd HH:mm')}
                </TableCell>
                <TableCell className="text-gray-900">
                  {format(new Date(reservationInfo.closeDate), 'yyyy/MM/dd HH:mm')}
                </TableCell>
                <TableCell className="text-blue-600 hover:text-blue-700">
                  <a 
                    href={reservationInfo.ticketUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:no-underline"
                  >
                    예매하기
                  </a>
                </TableCell>
                <TableCell className="text-gray-900">
                  {reservationInfo.remark || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 