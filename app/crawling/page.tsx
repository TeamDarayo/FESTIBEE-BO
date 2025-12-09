'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchCrawlingJobs, fetchSeedPerformances, fetchCrawledPerformances } from '@/lib/api';
import { CrawlingJob, SeedPerformance, CrawlingSite, CrawledPerformanceWithLinks } from '@/types/crawling';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FiRefreshCw, FiChevronLeft, FiChevronRight, FiExternalLink, FiCheck, FiX, FiMinus } from 'react-icons/fi';
import Image from 'next/image';

// 연동 상태 뱃지 컴포넌트
const LinkStatusBadge = ({ 
  hasLinks, 
  count, 
  label 
}: { 
  hasLinks: boolean; 
  count: number;
  label: string;
}) => {
  if (!hasLinks) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
        <FiMinus className="w-3 h-3" />
        {label}
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
      <FiCheck className="w-3 h-3" />
      {label} ({count})
    </span>
  );
};

export default function CrawlingPage() {
  const router = useRouter();
  
  // 크롤링 작업 상태
  const [jobs, setJobs] = useState<CrawlingJob[]>([]);
  const [jobsPage, setJobsPage] = useState(0);
  const [jobsSize] = useState(10);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState<string | null>(null);

  // 시드 공연 상태
  const [seedPerformances, setSeedPerformances] = useState<SeedPerformance[]>([]);
  const [seedSite, setSeedSite] = useState<CrawlingSite>('INTERPARK');
  const [seedPage, setSeedPage] = useState(0);
  const [seedSize] = useState(10);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);

  // 크롤링된 공연 상태
  const [crawledPerformances, setCrawledPerformances] = useState<CrawledPerformanceWithLinks[]>([]);
  const [crawledSite, setCrawledSite] = useState<CrawlingSite>('INTERPARK');
  const [crawledPage, setCrawledPage] = useState(0);
  const [crawledSize] = useState(10);
  const [crawledLoading, setCrawledLoading] = useState(false);
  const [crawledError, setCrawledError] = useState<string | null>(null);

  // 상세 보기 상태 (시드 공연만 모달 사용)
  const [selectedSeedPerformance, setSelectedSeedPerformance] = useState<SeedPerformance | null>(null);

  // 크롤링 작업 로드
  const loadJobs = async () => {
    setJobsLoading(true);
    setJobsError(null);
    try {
      const data = await fetchCrawlingJobs(jobsPage, jobsSize);
      setJobs(data);
    } catch (err: any) {
      setJobsError(err.message || '크롤링 작업을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setJobsLoading(false);
    }
  };

  // 시드 공연 로드
  const loadSeedPerformances = async () => {
    setSeedLoading(true);
    setSeedError(null);
    try {
      const data = await fetchSeedPerformances(seedSite, seedPage, seedSize);
      setSeedPerformances(data);
    } catch (err: any) {
      setSeedError(err.message || '시드 공연을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setSeedLoading(false);
    }
  };

  // 크롤링된 공연 로드
  const loadCrawledPerformances = async () => {
    setCrawledLoading(true);
    setCrawledError(null);
    try {
      const data = await fetchCrawledPerformances(crawledSite, crawledPage, crawledSize);
      setCrawledPerformances(data);
    } catch (err: any) {
      setCrawledError(err.message || '크롤링된 공연을 불러오는데 실패했습니다.');
      console.error(err);
    } finally {
      setCrawledLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadJobs();
  }, [jobsPage]);

  useEffect(() => {
    loadSeedPerformances();
  }, [seedPage, seedSite]);

  useEffect(() => {
    loadCrawledPerformances();
  }, [crawledPage, crawledSite]);

  // 상태 뱃지 색상
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 상세 페이지로 이동
  const handleCrawledPerformanceClick = (performanceId: number) => {
    router.push(`/crawling/${performanceId}`);
  };

  // 시드 공연 행 클릭 핸들러
  const handleSeedPerformanceClick = (performance: SeedPerformance) => {
    setSelectedSeedPerformance(performance);
  };

  const handleCloseSeedModal = () => {
    setSelectedSeedPerformance(null);
  };

  // 날짜 포맷팅
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 로딩 스피너
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  // 에러 메시지
  const ErrorMessage = ({ message }: { message: string }) => (
    <div className="flex justify-center items-center py-8">
      <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
        {message}
      </div>
    </div>
  );

  // 페이지네이션 컨트롤
  const PaginationControls = ({ 
    page, 
    onPageChange, 
    hasData 
  }: { 
    page: number; 
    onPageChange: (page: number) => void; 
    hasData: boolean;
  }) => (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
      >
        <FiChevronLeft className="mr-1" />
        이전
      </Button>
      <span className="text-sm text-gray-600">페이지 {page + 1}</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasData}
      >
        다음
        <FiChevronRight className="ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">크롤링 관리</h1>
        
        <div className="bg-white rounded-2xl shadow p-6">
          <Tabs defaultValue="crawled" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="crawled">크롤링된 공연</TabsTrigger>
              <TabsTrigger value="seed">시드 공연</TabsTrigger>
              <TabsTrigger value="jobs">크롤링 작업</TabsTrigger>
            </TabsList>

            {/* 크롤링된 공연 탭 */}
            <TabsContent value="crawled" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">크롤링된 공연 목록</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={crawledSite}
                    onChange={(e) => {
                      setCrawledSite(e.target.value as CrawlingSite);
                      setCrawledPage(0);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="INTERPARK">인터파크</option>
                    <option value="YES24">YES24</option>
                    <option value="MELON">멜론</option>
                  </select>
                  <Button onClick={loadCrawledPerformances} disabled={crawledLoading}>
                    <FiRefreshCw className={`mr-2 ${crawledLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </Button>
                </div>
              </div>

              {crawledLoading ? (
                <LoadingSpinner />
              ) : crawledError ? (
                <ErrorMessage message={crawledError} />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ID</TableHead>
                          <TableHead className="w-24">포스터</TableHead>
                          <TableHead>제목</TableHead>
                          <TableHead className="w-24">사이트</TableHead>
                          <TableHead className="w-24">오픈</TableHead>
                          <TableHead>연동 상태</TableHead>
                          <TableHead className="w-32">생성일시</TableHead>
                          <TableHead className="w-20">상세</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crawledPerformances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                              데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          crawledPerformances.map((item) => (
                            <TableRow
                              key={item.performance.id}
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => handleCrawledPerformanceClick(item.performance.id)}
                            >
                              <TableCell className="font-medium">{item.performance.id}</TableCell>
                              <TableCell>
                                {item.performance.data.posterUrl ? (
                                  <Image 
                                    src={item.performance.data.posterUrl.startsWith('http') ? item.performance.data.posterUrl : `https:${item.performance.data.posterUrl}`}
                                    alt={item.performance.data.title} 
                                    width={48} 
                                    height={64} 
                                    className="rounded-md object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                    No Image
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <div className="font-medium text-gray-900 line-clamp-2">
                                  {item.performance.data.title}
                                </div>
                                {item.performance.data.dates && item.performance.data.dates.length > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(item.performance.data.dates[0]).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    {item.performance.data.dates.length > 1 && ` 외 ${item.performance.data.dates.length - 1}일`}
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  {item.performance.site}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.performance.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.performance.isOpen ? '오픈' : '닫힘'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  <LinkStatusBadge 
                                    hasLinks={item.performanceLinks.length > 0} 
                                    count={item.performanceLinks.length}
                                    label="공연"
                                  />
                                  <LinkStatusBadge 
                                    hasLinks={item.placeLinks.length > 0} 
                                    count={item.placeLinks.length}
                                    label="장소"
                                  />
                                  <LinkStatusBadge 
                                    hasLinks={item.artistLinks.length > 0} 
                                    count={item.artistLinks.length}
                                    label="아티스트"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDateTime(item.performance.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCrawledPerformanceClick(item.performance.id);
                                  }}
                                >
                                  <FiExternalLink className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    page={crawledPage}
                    onPageChange={setCrawledPage}
                    hasData={crawledPerformances.length === crawledSize}
                  />
                </>
              )}
            </TabsContent>

            {/* 시드 공연 탭 */}
            <TabsContent value="seed" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">시드 공연 목록</h2>
                <div className="flex items-center gap-4">
                  <select
                    value={seedSite}
                    onChange={(e) => {
                      setSeedSite(e.target.value as CrawlingSite);
                      setSeedPage(0);
                    }}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                  >
                    <option value="INTERPARK">인터파크</option>
                    <option value="YES24">YES24</option>
                    <option value="MELON">멜론</option>
                  </select>
                  <Button onClick={loadSeedPerformances} disabled={seedLoading}>
                    <FiRefreshCw className={`mr-2 ${seedLoading ? 'animate-spin' : ''}`} />
                    새로고침
                  </Button>
                </div>
              </div>

              {seedLoading ? (
                <LoadingSpinner />
              ) : seedError ? (
                <ErrorMessage message={seedError} />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Vendor ID</TableHead>
                          <TableHead>사이트</TableHead>
                          <TableHead>오픈 여부</TableHead>
                          <TableHead>포스터</TableHead>
                          <TableHead>제목</TableHead>
                          <TableHead>상세 URL</TableHead>
                          <TableHead>생성일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {seedPerformances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-gray-500 py-8">
                              데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          seedPerformances.map((performance) => (
                            <TableRow
                              key={performance.id}
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => handleSeedPerformanceClick(performance)}
                            >
                              <TableCell className="font-medium">{performance.id}</TableCell>
                              <TableCell>{performance.venderPerformanceId}</TableCell>
                              <TableCell>
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                                  {performance.site}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  performance.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {performance.isOpen ? '오픈' : '닫힘'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {performance.data.posterUrl ? (
                                  <Image 
                                    src={performance.data.posterUrl.startsWith('http') ? performance.data.posterUrl : `https:${performance.data.posterUrl}`}
                                    alt={performance.data.title} 
                                    width={48} 
                                    height={48} 
                                    className="rounded-md object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                    No Image
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="max-w-xs">
                                {performance.data.title}
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                <a 
                                  href={performance.data.detailUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline text-sm"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  상세보기
                                </a>
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDateTime(performance.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    page={seedPage}
                    onPageChange={setSeedPage}
                    hasData={seedPerformances.length === seedSize}
                  />
                </>
              )}
            </TabsContent>

            {/* 크롤링 작업 탭 */}
            <TabsContent value="jobs" className="mt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">크롤링 작업 목록</h2>
                <Button onClick={loadJobs} disabled={jobsLoading}>
                  <FiRefreshCw className={`mr-2 ${jobsLoading ? 'animate-spin' : ''}`} />
                  새로고침
                </Button>
              </div>

              {jobsLoading ? (
                <LoadingSpinner />
              ) : jobsError ? (
                <ErrorMessage message={jobsError} />
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>URL</TableHead>
                          <TableHead>재시도 횟수</TableHead>
                          <TableHead>에러</TableHead>
                          <TableHead>생성일시</TableHead>
                          <TableHead>완료일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          jobs.map((job) => (
                            <TableRow key={job.id}>
                              <TableCell className="font-medium">{job.id}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeClass(job.status)}`}>
                                  {job.status}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">
                                <a 
                                  href={job.url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline"
                                >
                                  {job.url}
                                </a>
                              </TableCell>
                              <TableCell className="text-center">{job.retryCount}</TableCell>
                              <TableCell className="max-w-xs truncate text-red-600 text-sm">
                                {job.lastError || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDateTime(job.createdAt)}
                              </TableCell>
                              <TableCell className="text-sm text-gray-600">
                                {formatDateTime(job.completedAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  <PaginationControls
                    page={jobsPage}
                    onPageChange={setJobsPage}
                    hasData={jobs.length === jobsSize}
                  />
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* 시드 공연 상세 모달 */}
      {selectedSeedPerformance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">시드 공연 상세 정보</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseSeedModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* 포스터 */}
                <div className="flex justify-center">
                  {selectedSeedPerformance.data.posterUrl ? (
                    <Image
                      src={selectedSeedPerformance.data.posterUrl.startsWith('http') ? selectedSeedPerformance.data.posterUrl : `https:${selectedSeedPerformance.data.posterUrl}`}
                      alt={selectedSeedPerformance.data.title}
                      width={200}
                      height={200}
                      className="rounded-lg object-cover shadow-lg"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                      No Image
                    </div>
                  )}
                </div>

                {/* 기본 정보 */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedSeedPerformance.data.title}</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">공연 ID:</span>
                        <p className="text-gray-900">{selectedSeedPerformance.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Vendor ID:</span>
                        <p className="text-gray-900">{selectedSeedPerformance.venderPerformanceId}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">사이트:</span>
                        <p className="text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {selectedSeedPerformance.site}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">오픈 상태:</span>
                        <p className="text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedSeedPerformance.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedSeedPerformance.isOpen ? '오픈' : '닫힘'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">상세 URL:</span>
                      <p className="text-gray-900 break-all">
                        <a
                          href={selectedSeedPerformance.data.detailUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {selectedSeedPerformance.data.detailUrl}
                        </a>
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">생성일시:</span>
                        <p className="text-gray-900">{formatDateTime(selectedSeedPerformance.createdAt)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">수정일시:</span>
                        <p className="text-gray-900">{formatDateTime(selectedSeedPerformance.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseSeedModal}>
                닫기
              </Button>
              <Button
                onClick={() => {
                  window.open(selectedSeedPerformance.data.detailUrl, '_blank');
                }}
              >
                원본 사이트에서 보기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
