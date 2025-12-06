'use client';

import { useEffect, useState } from 'react';
import { fetchCrawlingJobs, fetchSeedPerformances, fetchCrawledPerformances } from '@/lib/api';
import { CrawlingJob, SeedPerformance, CrawledPerformance, CrawlingSite } from '@/types/crawling';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Image from 'next/image';

export default function CrawlingPage() {
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
  const [crawledPerformances, setCrawledPerformances] = useState<CrawledPerformance[]>([]);
  const [crawledSite, setCrawledSite] = useState<CrawlingSite>('INTERPARK');
  const [crawledPage, setCrawledPage] = useState(0);
  const [crawledSize] = useState(10);
  const [crawledLoading, setCrawledLoading] = useState(false);
  const [crawledError, setCrawledError] = useState<string | null>(null);

  // 상세 보기 상태
  const [selectedSeedPerformance, setSelectedSeedPerformance] = useState<SeedPerformance | null>(null);
  const [selectedCrawledPerformance, setSelectedCrawledPerformance] = useState<CrawledPerformance | null>(null);

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

  // 행 클릭 핸들러
  const handleSeedPerformanceClick = (performance: SeedPerformance) => {
    setSelectedSeedPerformance(performance);
  };

  const handleCrawledPerformanceClick = (performance: CrawledPerformance) => {
    setSelectedCrawledPerformance(performance);
  };

  const handleCloseSeedModal = () => {
    setSelectedSeedPerformance(null);
  };

  const handleCloseCrawledModal = () => {
    setSelectedCrawledPerformance(null);
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
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="jobs">크롤링 작업</TabsTrigger>
              <TabsTrigger value="seed">시드 공연</TabsTrigger>
              <TabsTrigger value="crawled">크롤링된 공연</TabsTrigger>
            </TabsList>

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
                          <TableHead>ID</TableHead>
                          <TableHead>Vendor ID</TableHead>
                          <TableHead>사이트</TableHead>
                          <TableHead>오픈 여부</TableHead>
                          <TableHead>포스터</TableHead>
                          <TableHead>제목</TableHead>
                          <TableHead>생성일시</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {crawledPerformances.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                              데이터가 없습니다.
                            </TableCell>
                          </TableRow>
                        ) : (
                          crawledPerformances.map((performance) => (
                            <TableRow
                              key={performance.id}
                              className="cursor-pointer hover:bg-blue-50"
                              onClick={() => handleCrawledPerformanceClick(performance)}
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
                    page={crawledPage}
                    onPageChange={setCrawledPage}
                    hasData={crawledPerformances.length === crawledSize}
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

      {/* 크롤링된 공연 상세 모달 */}
      {selectedCrawledPerformance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">크롤링된 공연 상세 정보</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseCrawledModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* 포스터 */}
                <div className="flex justify-center">
                  {selectedCrawledPerformance.data.posterUrl ? (
                    <Image
                      src={selectedCrawledPerformance.data.posterUrl.startsWith('http') ? selectedCrawledPerformance.data.posterUrl : `https:${selectedCrawledPerformance.data.posterUrl}`}
                      alt={selectedCrawledPerformance.data.title}
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
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{selectedCrawledPerformance.data.title}</h3>
                  <div className="grid grid-cols-1 gap-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">공연 ID:</span>
                        <p className="text-gray-900">{selectedCrawledPerformance.id}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Vendor ID:</span>
                        <p className="text-gray-900">{selectedCrawledPerformance.venderPerformanceId || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium text-gray-700">사이트:</span>
                        <p className="text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {selectedCrawledPerformance.site}
                          </span>
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">오픈 상태:</span>
                        <p className="text-gray-900">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            selectedCrawledPerformance.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedCrawledPerformance.isOpen ? '오픈' : '닫힘'}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* 추가 크롤링 데이터 */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium text-gray-700 mb-4">크롤링된 추가 정보</h4>
                      <div className="space-y-4">

                        {/* 공연 일정 */}
                        <div>
                          <span className="font-medium text-gray-700">공연 일정:</span>
                          {selectedCrawledPerformance.data.dates && selectedCrawledPerformance.data.dates.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedCrawledPerformance.data.dates.map((dateStr, index) => (
                                <span key={index} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                                  {new Date(dateStr).toLocaleString('ko-KR', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    weekday: 'short'
                                  })}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1 text-sm">정보 없음</p>
                          )}
                        </div>

                        {/* 장소 정보 */}
                        <div>
                          <span className="font-medium text-gray-700">장소:</span>
                          {selectedCrawledPerformance.data.place ? (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <p className="font-medium text-gray-900">
                                {selectedCrawledPerformance.data.place.name}
                              </p>
                              <p className="text-gray-600 text-sm mt-1">
                                {selectedCrawledPerformance.data.place.address}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1 text-sm">정보 없음</p>
                          )}
                        </div>

                        {/* 참여자 정보 */}
                        <div>
                          <span className="font-medium text-gray-700">참여자:</span>
                          {selectedCrawledPerformance.data.participants && selectedCrawledPerformance.data.participants.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {selectedCrawledPerformance.data.participants.map((participant: any, index: number) => (
                                <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                                  {participant.name || participant}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1 text-sm">정보 없음</p>
                          )}
                        </div>

                        {/* 참여자 날짜 정보 */}
                        <div>
                          <span className="font-medium text-gray-700">참여자 출연 일정:</span>
                          {selectedCrawledPerformance.data.participantDates && selectedCrawledPerformance.data.participantDates.length > 0 ? (
                            <div className="mt-2">
                              {/* 날짜별로 그룹화 */}
                              {(() => {
                                const groupedByDate = selectedCrawledPerformance.data.participantDates.reduce((acc: any, participantDate: any) => {
                                  const date = participantDate.date || '날짜 미정';
                                  if (!acc[date]) {
                                    acc[date] = [];
                                  }
                                  acc[date].push(participantDate.name);
                                  return acc;
                                }, {});

                                return Object.entries(groupedByDate).map(([date, participants]) => (
                                  <div key={date} className="mb-3 p-4 bg-gray-50 rounded-lg border-l-4 border-purple-200">
                                    <div className="mb-2">
                                      <span className="font-semibold text-gray-900 text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                        {date === '날짜 미정' ? '날짜 미정' : new Date(date).toLocaleDateString('ko-KR', {
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                          weekday: 'long'
                                        })}
                                      </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {(participants as string[]).map((participant, index) => (
                                        <span key={index} className="bg-white text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-200">
                                          {participant}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ));
                              })()}
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1 text-sm">정보 없음</p>
                          )}
                        </div>

                        {/* 예매 정보 */}
                        <div>
                          <span className="font-medium text-gray-700">예매 정보:</span>
                          {selectedCrawledPerformance.data.reservations && selectedCrawledPerformance.data.reservations.length > 0 ? (
                            <div className="mt-2 space-y-2">
                              {selectedCrawledPerformance.data.reservations.map((reservation: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3 bg-white">
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-600">예매 시작:</span>
                                      <p className="font-medium text-gray-900">
                                        {new Date(reservation.startDate).toLocaleString('ko-KR', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">예매 마감:</span>
                                      <p className="font-medium text-gray-900">
                                        {new Date(reservation.endDate).toLocaleString('ko-KR', {
                                          year: 'numeric',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </p>
                                    </div>
                                    <div>
                                      <span className="text-gray-600">예매 링크:</span>
                                      <a
                                        href={reservation.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                                      >
                                        티켓 예매하기 →
                                      </a>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 mt-1 text-sm">정보 없음</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                      <div>
                        <span className="font-medium text-gray-700">생성일시:</span>
                        <p className="text-gray-900">{formatDateTime(selectedCrawledPerformance.createdAt)}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">수정일시:</span>
                        <p className="text-gray-900">{formatDateTime(selectedCrawledPerformance.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseCrawledModal}>
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

