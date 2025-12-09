'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  fetchCrawledPerformanceById,
  fetchFestivals,
  fetchPlaces,
  fetchArtists,
  createPerformanceLink,
  createNewPerformanceLink,
  updatePerformanceLink,
  deletePerformanceLink,
  createPlaceLink,
  createNewPlaceLink,
  updatePlaceLink,
  deletePlaceLink,
  createArtistLink,
  createNewArtistLink,
  updateArtistLink,
  deleteArtistLink,
  deleteArtist,
  autoLinkArtists,
  updateTimeTable,
  Artist
} from '@/lib/api';
import { 
  CrawledPerformanceWithLinks, 
  ArtistLink, 
  PlaceLink, 
  PerformanceLink,
  ArtistLinkStatus,
  CrawlingLinkItem,
  CrawledTimetable
} from '@/types/crawling';
import { Festival } from '@/types/festival';
import { Place } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FiArrowLeft, 
  FiRefreshCw, 
  FiLink, 
  FiPlus, 
  FiTrash2, 
  FiSearch,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiExternalLink,
  FiEdit
} from 'react-icons/fi';

// 아티스트 연동 상태 뱃지
const ArtistStatusBadge = ({ status }: { status: ArtistLinkStatus }) => {
  const statusConfig = {
    PENDING: { bg: 'bg-gray-100', text: 'text-gray-700', label: '대기중' },
    TEMP: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '임시' },
    TEMP_WITH_NEW_ARTIST: { bg: 'bg-orange-100', text: 'text-orange-700', label: '새 아티스트 임시' },
    CONFIRMED: { bg: 'bg-green-100', text: 'text-green-700', label: '확정' },
  };
  
  const config = statusConfig[status] || statusConfig.PENDING;
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
};

// 섹션 헤더 컴포넌트
const SectionHeader = ({ 
  title, 
  count, 
  hasLinks,
  onAutoLink,
  isAutoLinking 
}: { 
  title: string; 
  count: number;
  hasLinks: boolean;
  onAutoLink?: () => void;
  isAutoLinking?: boolean;
}) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-3">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {hasLinks ? (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
          <FiCheck className="w-3 h-3" />
          연동됨 ({count})
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
          <FiX className="w-3 h-3" />
          미연동
        </span>
      )}
    </div>
    {onAutoLink && (
      <Button
        variant="outline"
        size="sm"
        onClick={onAutoLink}
        disabled={isAutoLinking}
      >
        <FiRefreshCw className={`w-4 h-4 mr-1 ${isAutoLinking ? 'animate-spin' : ''}`} />
        자동 연동
      </Button>
    )}
  </div>
);

// Apple Music 이미지 사이즈 헬퍼
const getAppleArtworkUrl = (url?: string | null, size: 'small' | 'medium' | 'large' = 'small') => {
  if (!url) return '';
  const map = { small: '60', medium: '120', large: '240' };
  const w = map[size] || map.small;
  const h = w;
  if (url.includes('{w}') && url.includes('{h}')) {
    return url.replace('{w}', w).replace('{h}', h);
  }
  return url;
};

// 검색 모달 컴포넌트
interface SearchModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  searchPlaceholder: string;
  initialQuery?: string;
  items: T[];
  isLoading: boolean;
  onSearch: (query: string) => void;
  onSelect: (item: T) => void;
  renderItem: (item: T) => React.ReactNode;
  getItemKey: (item: T) => string | number;
}

function SearchModal<T>({
  isOpen,
  onClose,
  title,
  searchPlaceholder,
  items,
  isLoading,
  onSearch,
  onSelect,
  renderItem,
  getItemKey,
  initialQuery
}: SearchModalProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const initializedQueryRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      initializedQueryRef.current = null;
      return;
    }
    if (initialQuery !== undefined && initializedQueryRef.current !== initialQuery) {
      setSearchQuery(initialQuery);
      onSearch(initialQuery);
      initializedQueryRef.current = initialQuery;
    }
  }, [isOpen, initialQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={getItemKey(item)}
                  className="p-3 border rounded-lg hover:bg-blue-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelect(item);
                    onClose();
                  }}
                >
                  {renderItem(item)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 새 항목 생성 모달
interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitLabel?: string;
}

function CreateModal({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  isSubmitting,
  submitLabel = '생성 및 연동'
}: CreateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            취소
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <FiRefreshCw className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <FiPlus className="w-4 h-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CrawledPerformanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  // 기본 상태
  const [data, setData] = useState<CrawledPerformanceWithLinks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 검색용 데이터
  const [festivals, setFestivals] = useState<Festival[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredFestivals, setFilteredFestivals] = useState<Festival[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);

  // 모달 상태
  const [showPerformanceSearch, setShowPerformanceSearch] = useState(false);
  const [showPlaceSearch, setShowPlaceSearch] = useState(false);
  const [showArtistSearch, setShowArtistSearch] = useState<string | null>(null);
  const [showNewPerformance, setShowNewPerformance] = useState(false);
  const [showNewPlace, setShowNewPlace] = useState(false);
  const [showNewArtist, setShowNewArtist] = useState<string | null>(null);
  const [showEditPerformance, setShowEditPerformance] = useState(false);
  const [showEditPlace, setShowEditPlace] = useState(false);
  const [showEditArtist, setShowEditArtist] = useState<string | null>(null);

  // 새 항목 생성 폼 데이터
  const [newPerformance, setNewPerformance] = useState({
    name: '',
    placeId: 0,
    startDate: '',
    endDate: '',
    posterUrl: '',
    linkItems: ['BASIC' as const], // 기본값: BASIC
  });
  // 수정할 공연 연동 항목
  const [editLinkItems, setEditLinkItems] = useState<CrawlingLinkItem[]>([]);
  // 수정할 장소 정보
  const [editPlace, setEditPlace] = useState<{ placeId: number } | null>(null);
  // 수정할 아티스트 정보
  const [editArtist, setEditArtist] = useState<{ venderArtistName: string; artistId: number; previousArtistId?: number; status: ArtistLinkStatus } | null>(null);
  const [editArtistSearch, setEditArtistSearch] = useState('');
  const [editArtistStatus, setEditArtistStatus] = useState<ArtistLinkStatus>('TEMP');
  const [removePrevArtist, setRemovePrevArtist] = useState(false);
  const [newPlace, setNewPlace] = useState({
    placeName: '',
    address: '',
    venderPlaceId: '',
    site: 'INTERPARK' as const,
  });
  const [newArtist, setNewArtist] = useState({
    venderArtistId: '',
    site: 'INTERPARK' as const,
  });
  const [editTimetable, setEditTimetable] = useState<{
    timetableId: number;
    performanceDate: string;
    startTime: string;
    endTime: string;
    hallId: number | null;
    venderArtistName: string;
  } | null>(null);

  // 작업 상태
  const [isLinking, setIsLinking] = useState(false);
  const [isAutoLinking, setIsAutoLinking] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdatingTimetable, setIsUpdatingTimetable] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 데이터 로드
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchCrawledPerformanceById(id);
      if (!result) {
        setError('해당 크롤링 공연을 찾을 수 없습니다.');
        return;
      }
      setData(result);
    } catch (err: any) {
      setError(err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadReferenceData = useCallback(async () => {
    try {
      const [festivalsData, placesData, artistsData] = await Promise.all([
        fetchFestivals(),
        fetchPlaces(),
        fetchArtists()
      ]);
      setFestivals(festivalsData);
      setFilteredFestivals(festivalsData);
      setPlaces(placesData);
      setFilteredPlaces(placesData);
      setArtists(artistsData);
      setFilteredArtists(artistsData);
    } catch (err) {
      console.error('Failed to load reference data:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadReferenceData();
  }, [loadData, loadReferenceData]);

  // 크롤링 데이터로 새 항목 폼 초기화
  useEffect(() => {
    if (data) {
      const crawledData = data.performance.data;
      
      // 장소 연동 정보에서 placeId 가져오기
      const linkedPlaceId = data.placeLinks.length > 0 
        ? data.placeLinks[0].performancePlaceId 
        : 0;
      
      // 공연 폼 초기화
      setNewPerformance({
        name: crawledData.title || '',
        placeId: linkedPlaceId, // 연동된 장소가 있으면 자동 설정
        startDate: crawledData.dates?.[0]?.split('T')[0] || '',
        endDate: crawledData.dates?.[crawledData.dates.length - 1]?.split('T')[0] || '',
        posterUrl: crawledData.posterUrl || '',
        linkItems: ['BASIC' as const],
      });

      // 장소 폼 초기화
      setNewPlace({
        placeName: crawledData.place?.name || '',
        address: crawledData.place?.address || '',
        venderPlaceId: crawledData.place?.venderPlaceId || '',
        site: data.performance.site as 'INTERPARK',
      });
    }
  }, [data]);

  // 메시지 표시 후 자동 제거
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

  // 검색 필터
  const handleSearchFestivals = (query: string) => {
    const filtered = festivals.filter(f => 
      f.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredFestivals(filtered);
  };

  const handleSearchPlaces = (query: string) => {
    const filtered = places.filter(p => 
      p.placeName.toLowerCase().includes(query.toLowerCase()) ||
      p.address.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredPlaces(filtered);
  };

  const handleSearchArtists = (query: string) => {
    const filtered = artists.filter(a => 
      a.name.toLowerCase().includes(query.toLowerCase()) ||
      a.aliases.some(alias => alias.name.toLowerCase().includes(query.toLowerCase()))
    );
    setFilteredArtists(filtered);
  };

  // 공연 연동
  const handleLinkPerformance = async (festival: Festival) => {
    setIsLinking(true);
    try {
      await createPerformanceLink(id, { 
        performanceId: festival.id,
        linkItems: ['BASIC'] // 기본값: 기본 정보만 연동
      });
      await loadData();
      setActionMessage({ type: 'success', text: `"${festival.name}" 공연이 연동되었습니다. (기본 정보)` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPerformance = async (performanceId: number) => {
    if (!confirm('공연 연동을 해제하시겠습니까?')) return;
    setIsLinking(true);
    try {
      await deletePerformanceLink(id, performanceId);
      await loadData();
      setActionMessage({ type: 'success', text: '공연 연동이 해제되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동 해제에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateNewPerformance = async () => {
    if (!newPerformance.name || !newPerformance.placeId) {
      setActionMessage({ type: 'error', text: '공연명과 장소를 입력해주세요.' });
      return;
    }
    if (newPerformance.linkItems.length === 0) {
      setActionMessage({ type: 'error', text: '연동 항목을 최소 1개 이상 선택해주세요.' });
      return;
    }
    setIsCreating(true);
    try {
      await createNewPerformanceLink(id, {
        name: newPerformance.name,
        placeId: newPerformance.placeId,
        startDate: newPerformance.startDate,
        endDate: newPerformance.endDate,
        posterUrl: newPerformance.posterUrl,
        linkItems: newPerformance.linkItems,
      });
      await loadData();
      await loadReferenceData();
      setShowNewPerformance(false);
      setActionMessage({ type: 'success', text: '새 공연이 생성되고 연동되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '생성에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePerformance = async () => {
    if (!linkedPerformance) return;
    if (editLinkItems.length === 0) {
      setActionMessage({ type: 'error', text: '연동 항목을 최소 1개 이상 선택해주세요.' });
      return;
    }
    setIsLinking(true);
    try {
      await updatePerformanceLink(id, linkedPerformance.id, {
        linkItems: editLinkItems,
      });
      await loadData();
      setShowEditPerformance(false);
      setActionMessage({ type: 'success', text: '공연 연동이 수정되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '수정에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  // 장소 연동
  const handleLinkPlace = async (place: Place) => {
    setIsLinking(true);
    try {
      if (!data) throw new Error('데이터를 불러오지 못했습니다.');
      const venderHallId = (data.performance.data.place as any)?.venderHallId;
      await createPlaceLink(id, { performancePlaceId: place.id, site: data.performance.site, venderHallId });
      await loadData();
      setActionMessage({ type: 'success', text: `"${place.placeName}" 장소가 연동되었습니다.` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkPlace = async (placeId: number) => {
    if (!confirm('장소 연동을 해제하시겠습니까?')) return;
    setIsLinking(true);
    try {
      await deletePlaceLink(id, placeId);
      await loadData();
      setActionMessage({ type: 'success', text: '장소 연동이 해제되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동 해제에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleCreateNewPlace = async () => {
    if (!newPlace.placeName) {
      setActionMessage({ type: 'error', text: '장소명을 입력해주세요.' });
      return;
    }
    setIsCreating(true);
    try {
      await createNewPlaceLink(id, {
        placeName: newPlace.placeName,
        address: newPlace.address,
        venderPlaceId: newPlace.venderPlaceId || undefined,
        site: newPlace.site,
      });
      await loadData();
      await loadReferenceData();
      setShowNewPlace(false);
      setActionMessage({ type: 'success', text: '새 장소가 생성되고 연동되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '생성에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePlace = async () => {
    if (!editPlace || !data || data.placeLinks.length === 0) return;
    setIsLinking(true);
    try {
      const currentPlaceId = data.placeLinks[0].performancePlaceId;
      await updatePlaceLink(id, currentPlaceId, {
        targetPerformancePlaceId: editPlace.placeId,
        site: data.performance.site,
      });
      await loadData();
      await loadReferenceData();
      setShowEditPlace(false);
      setActionMessage({ type: 'success', text: '장소 연동이 수정되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '수정에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  // 아티스트 연동
  const handleLinkArtist = async (venderArtistName: string, artist: Artist) => {
    setIsLinking(true);
    try {
      await createArtistLink(id, venderArtistName, { artistId: artist.id });
      await loadData();
      setActionMessage({ type: 'success', text: `"${artist.name}" 아티스트가 연동되었습니다.` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkArtist = async (venderArtistName: string) => {
    if (!confirm('아티스트 연동을 해제하시겠습니까?')) return;
    setIsLinking(true);
    try {
      await deleteArtistLink(id, venderArtistName);
      await loadData();
      setActionMessage({ type: 'success', text: '아티스트 연동이 해제되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '연동 해제에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleAutoLinkArtists = async () => {
    setIsAutoLinking(true);
    try {
      await autoLinkArtists(id);
      await loadData();
      setActionMessage({ type: 'success', text: '아티스트가 자동 연동되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '자동 연동에 실패했습니다.' });
    } finally {
      setIsAutoLinking(false);
    }
  };

  const handleCreateNewArtist = async (venderArtistName: string) => {
    setIsCreating(true);
    try {
      await createNewArtistLink(id, venderArtistName, {
        venderArtistId: newArtist.venderArtistId || undefined,
        site: newArtist.site,
      });
      await loadData();
      await loadReferenceData();
      setShowNewArtist(null);
      setNewArtist({ venderArtistId: '', site: 'INTERPARK' });
      setActionMessage({ type: 'success', text: '새 아티스트가 생성되고 연동되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '생성에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateArtist = async () => {
    if (!editArtist || !data) return;
    setIsLinking(true);
    try {
      // 이전 연동 삭제 선택 시: 기존 링크 삭제 후 새로 연동
      if (removePrevArtist && editArtist.previousArtistId) {
        await deleteArtistLink(id, editArtist.venderArtistName);
        await createArtistLink(id, editArtist.venderArtistName, {
          artistId: editArtist.artistId,
          site: data.performance.site,
          status: editArtistStatus,
        });
      } else {
        await updateArtistLink(id, editArtist.venderArtistName, {
          artistId: editArtist.artistId,
          site: data.performance.site,
          status: editArtistStatus,
        });
      }
      await loadData();
      await loadReferenceData();
      setShowEditArtist(null);
      setRemovePrevArtist(false);
      setActionMessage({ type: 'success', text: '아티스트 연동이 수정되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '수정에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  const handleDeleteArtistInternal = async () => {
    if (!editArtist) return;
    if (!confirm('이 아티스트를 시스템에서 삭제하시겠습니까? (연동과 무관하게 삭제)')) return;
    setIsLinking(true);
    try {
      await deleteArtist(editArtist.artistId);
      // 연동된 경우 링크도 정리
      await deleteArtistLink(id, editArtist.venderArtistName);
      await loadData();
      await loadReferenceData();
      setShowEditArtist(null);
      setActionMessage({ type: 'success', text: '아티스트가 삭제되었습니다.' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '삭제에 실패했습니다.' });
    } finally {
      setIsLinking(false);
    }
  };

  // Apple Music 검색 결과로 바로 아티스트 생성
  const handleCreateArtistFromAppleMusic = async (venderArtistName: string, appleMusicResult: { id: string; name: string; imageUrl: string }) => {
    setIsCreating(true);
    try {
      await createNewArtistLink(id, venderArtistName, {
        venderArtistId: appleMusicResult.id,
        site: data!.performance.site,
      });
      await loadData();
      await loadReferenceData();
      setShowNewArtist(null);
      setActionMessage({ type: 'success', text: `"${appleMusicResult.name}" 아티스트가 생성되고 연동되었습니다.` });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '생성에 실패했습니다.' });
    } finally {
      setIsCreating(false);
    }
  };

  // 날짜 포맷팅
  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Hooks는 early return 전에 호출되어야 함 (Hooks 규칙)
  // 연동된 공연 찾기 (메모이제이션)
  const linkedPerformance = useMemo(() => {
    if (!data || data.performanceLinks.length === 0) return null;
    return festivals.find(f => f.id === data.performanceLinks[0].performanceId) || null;
  }, [data, festivals]);
  
  // 연동된 장소 찾기 (메모이제이션)
  const linkedPlace = useMemo(() => {
    if (!data || data.placeLinks.length === 0) return null;
    const placeId = data.placeLinks[0].performancePlaceId;
    const place = places.find(p => p.id === placeId);
    
    // 디버깅 로그
    if (!place && places.length > 0) {
      console.log('🔍 장소를 찾을 수 없음:', JSON.stringify({
        찾는ID: placeId,
        장소목록개수: places.length,
        장소ID목록: places.map(p => ({ id: p.id, name: p.placeName })),
      }, null, 2));
    } else if (place) {
      console.log('✅ 장소 찾음:', JSON.stringify({ id: place.id, name: place.placeName }, null, 2));
    }
    
    return place || null;
  }, [data, places]);

  const filteredInternalArtists = useMemo(() => {
    const keyword = editArtistSearch.trim().toLowerCase();
    if (!keyword) return artists;
    return artists.filter(a => 
      a.name.toLowerCase().includes(keyword) ||
      a.aliases.some(al => al.name.toLowerCase().includes(keyword))
    );
  }, [artists, editArtistSearch]);

  const handleSelectTimetable = (tt: CrawledTimetable) => {
    if (!linkedPerformance) {
      setActionMessage({ type: 'error', text: '공연이 연동되어야 타임테이블을 수정할 수 있습니다.' });
      return;
    }
    if (!data) {
      setActionMessage({ type: 'error', text: '데이터를 불러오지 못했습니다.' });
      return;
    }
    const timetableLink = data.timetableLinks.find(link => link.venderArtistId === tt.venderArtistId);
    if (!timetableLink) {
      setActionMessage({ type: 'error', text: '타임테이블이 시스템에 연동되어 있지 않습니다.' });
      return;
    }
    const hallLink = tt.hallName ? data.hallLinks.find(h => h.venderHallName === tt.hallName) : null;
    setEditTimetable({
      timetableId: timetableLink.timetableId,
      performanceDate: tt.date ? tt.date.split('T')[0] : '',
      startTime: tt.startTime || '',
      endTime: tt.endTime || '',
      hallId: hallLink?.hallId ?? 0,
      venderArtistName: tt.venderArtistName,
    });
  };

  const handleUpdateTimetable = async () => {
    if (!editTimetable || !linkedPerformance) return;
    if (!editTimetable.performanceDate || !editTimetable.startTime || !editTimetable.endTime) {
      setActionMessage({ type: 'error', text: '날짜와 시간을 모두 입력해주세요.' });
      return;
    }
    setIsUpdatingTimetable(true);
    try {
      await updateTimeTable(linkedPerformance.id, editTimetable.timetableId, {
        performanceDate: editTimetable.performanceDate,
        startTime: editTimetable.startTime,
        endTime: editTimetable.endTime,
        hallId: editTimetable.hallId,
      });
      setActionMessage({ type: 'success', text: '타임테이블이 수정되었습니다.' });
      setEditTimetable(null);
      await loadData();
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || '타임테이블 수정에 실패했습니다.' });
    } finally {
      setIsUpdatingTimetable(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <FiAlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error || '데이터를 찾을 수 없습니다.'}</p>
          <Button onClick={() => router.back()}>
            <FiArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const crawledData = data.performance.data;

  // 타임테이블에서 고유 아티스트 목록 추출
  const uniqueArtists = crawledData.timetables?.reduce<{ name: string; id: string | null }[]>((acc, tt) => {
    if (tt.venderArtistName && !acc.find(a => a.name === tt.venderArtistName)) {
      acc.push({ name: tt.venderArtistName, id: tt.venderArtistId });
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => router.back()}>
              <FiArrowLeft className="w-4 h-4 mr-2" />
              목록으로
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">크롤링 공연 상세</h1>
          </div>
          <Button onClick={loadData} disabled={loading}>
            <FiRefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        {/* 알림 메시지 */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            actionMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {actionMessage.type === 'success' ? (
              <FiCheck className="w-5 h-5" />
            ) : (
              <FiAlertCircle className="w-5 h-5" />
            )}
            {actionMessage.text}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 기본 정보 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
              {/* 포스터 */}
              <div className="flex justify-center mb-6">
                {crawledData.posterUrl ? (
                  <Image
                    src={crawledData.posterUrl.startsWith('http') ? crawledData.posterUrl : `https:${crawledData.posterUrl}`}
                    alt={crawledData.title}
                    width={200}
                    height={280}
                    className="rounded-lg object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-48 h-64 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
              </div>

              {/* 기본 정보 */}
              <h2 className="text-xl font-bold text-gray-900 mb-4">{crawledData.title}</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">ID</span>
                  <span className="font-medium">{data.performance.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Vendor ID</span>
                  <span className="font-medium">{data.performance.venderPerformanceId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">사이트</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {data.performance.site}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">상태</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    data.performance.isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {data.performance.isOpen ? '오픈' : '닫힘'}
                  </span>
                </div>
                
                {/* 공연 일정 */}
                {crawledData.dates && crawledData.dates.length > 0 && (
                  <div className="pt-3 border-t">
                    <span className="text-gray-500 block mb-2">공연 일정</span>
                    <div className="space-y-1">
                      {crawledData.dates.map((date, idx) => (
                        <div key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                          {formatDateTime(date)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 장소 정보 */}
                {crawledData.place && (
                  <div className="pt-3 border-t">
                    <span className="text-gray-500 block mb-2">크롤링된 장소</span>
                    <div className="text-sm">
                      <p className="font-medium">{crawledData.place.name}</p>
                      <p className="text-gray-600 text-xs mt-1">{crawledData.place.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 우측: 연동 관리 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 공연 연동 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <SectionHeader 
                title="공연 연동" 
                count={data.performanceLinks.length}
                hasLinks={data.performanceLinks.length > 0}
              />
              
              {linkedPerformance ? (
                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{linkedPerformance.name}</p>
                      <p className="text-sm text-gray-600">
                        {linkedPerformance.placeName} | {linkedPerformance.startDate} ~ {linkedPerformance.endDate}
                      </p>
                      {data.performanceLinks.length > 0 && data.performanceLinks[0].linkItems && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {data.performanceLinks[0].linkItems.map((item: CrawlingLinkItem) => (
                            <span key={item} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {item === 'BASIC' && '기본정보'}
                              {item === 'PERFORMANCE_DATE' && '공연일'}
                              {item === 'RESERVATION_INFO' && '예매정보'}
                              {item === 'TIMETABLE' && '타임테이블'}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          const items = data.performanceLinks[0]?.linkItems || ['BASIC' as CrawlingLinkItem];
                          setEditLinkItems(items as CrawlingLinkItem[]);
                          setShowEditPerformance(true);
                        }}
                        disabled={isLinking}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEdit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleUnlinkPerformance(linkedPerformance.id)}
                        disabled={isLinking}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => setShowPerformanceSearch(true)} disabled={isLinking}>
                    <FiSearch className="w-4 h-4 mr-2" />
                    기존 공연 검색
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPerformance(true)} disabled={isLinking}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    새 공연 생성
                  </Button>
                </div>
              )}
            </div>

            {/* 장소 연동 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <SectionHeader 
                title="장소 연동" 
                count={data.placeLinks.length}
                hasLinks={data.placeLinks.length > 0}
              />
              
              {data.placeLinks.length > 0 ? (
                <div>
                  {linkedPlace ? (
                    <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{linkedPlace.placeName}</p>
                          <p className="text-sm text-gray-600">{linkedPlace.address}</p>
                          {linkedPlace.halls && linkedPlace.halls.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {linkedPlace.halls.map(hall => (
                                <span key={hall.id} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                  {hall.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">연동 ID: {data.placeLinks[0].performancePlaceId}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setEditPlace({ placeId: linkedPlace.id });
                              setShowEditPlace(true);
                            }}
                            disabled={isLinking}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FiEdit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleUnlinkPlace(linkedPlace.id)}
                            disabled={isLinking}
                            className="text-red-600 hover:text-red-700"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 bg-orange-50 border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FiAlertCircle className="w-5 h-5 text-orange-600" />
                            <p className="font-medium text-gray-900">연동된 장소 정보를 찾을 수 없습니다</p>
                          </div>
                          <p className="text-sm text-gray-600">
                            연동 ID: <strong>{data.placeLinks[0].performancePlaceId}</strong>
                          </p>
                          <p className="text-xs text-orange-600 mt-1">
                            장소가 삭제되었거나 아직 로드되지 않았습니다. 연동을 해제하고 다시 연동해주세요.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleUnlinkPlace(data.placeLinks[0].performancePlaceId)}
                          disabled={isLinking}
                          className="text-red-600 hover:text-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex gap-3">
                  <Button onClick={() => setShowPlaceSearch(true)} disabled={isLinking}>
                    <FiSearch className="w-4 h-4 mr-2" />
                    기존 장소 검색
                  </Button>
                  <Button variant="outline" onClick={() => setShowNewPlace(true)} disabled={isLinking}>
                    <FiPlus className="w-4 h-4 mr-2" />
                    새 장소 생성
                  </Button>
                </div>
              )}
            </div>

            {/* 아티스트 연동 섹션 */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <SectionHeader 
                title="아티스트 연동" 
                count={data.artistLinks.filter(a => a.status === 'CONFIRMED').length}
                hasLinks={data.artistLinks.some(a => a.status === 'CONFIRMED')}
                onAutoLink={handleAutoLinkArtists}
                isAutoLinking={isAutoLinking}
              />

              {uniqueArtists.length === 0 && data.artistLinks.length === 0 ? (
                <p className="text-gray-500 text-sm">타임테이블에 아티스트 정보가 없습니다.</p>
              ) : (
                <div className="space-y-3">
                  {/* 크롤링된 아티스트 목록 */}
                  {uniqueArtists.map((artist) => {
                    const linkInfo = data.artistLinks.find(al => al.venderArtistName === artist.name);
                    const linkedArtist = linkInfo?.artistId 
                      ? artists.find(a => a.id === linkInfo.artistId)
                      : null;

                    return (
                      <div 
                        key={artist.name} 
                        className={`border rounded-lg p-4 ${
                          linkInfo?.status === 'CONFIRMED' ? 'bg-green-50 border-green-200' : 
                          linkInfo ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{artist.name}</span>
                              {linkInfo && <ArtistStatusBadge status={linkInfo.status} />}
                            </div>
                            {linkInfo?.status === 'TEMP_WITH_NEW_ARTIST' && linkInfo.artistId && (
                              <p className="text-xs text-orange-600 mb-1">
                                새 아티스트 임시 생성 ID: {linkInfo.artistId}
                              </p>
                            )}
                            {linkedArtist && (
                              <p className="text-sm text-gray-600">
                                → 연동됨: {linkedArtist.name}
                                {linkedArtist.aliases.length > 0 && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    ({linkedArtist.aliases.map(a => a.name).join(', ')})
                                  </span>
                                )}
                              </p>
                            )}
                            {linkInfo?.autoSearchInfo && (
                              <div className="mt-2">
                                <p className="text-xs text-gray-500 mb-1">Apple Music 검색 결과:</p>
                                <div className="flex flex-wrap gap-2">
                                  {linkInfo.autoSearchInfo.results.artists.data.slice(0, 3).map((result, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border text-gray-700"
                                    >
                                      {result.attributes.artwork?.url && (
                                        <Image
                                          src={getAppleArtworkUrl(result.attributes.artwork.url, 'small')}
                                          alt={result.attributes.name}
                                          width={16}
                                          height={16}
                                          className="rounded-full"
                                        />
                                      )}
                                      <span>{result.attributes.name}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 ml-4">
                            {linkInfo ? (
                              <>
                                {linkInfo.artistId && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      setEditArtist({
                                        venderArtistName: artist.name,
                                        artistId: linkInfo.artistId!,
                                        previousArtistId: linkInfo.artistId!,
                                        status: linkInfo.status,
                                      });
                                      setEditArtistStatus(linkInfo.status);
                                      setEditArtistSearch('');
                                      setRemovePrevArtist(false);
                                      setShowEditArtist(artist.name);
                                    }}
                                    disabled={isLinking}
                                    className="text-blue-600 hover:text-blue-700"
                                  >
                                    <FiEdit className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleUnlinkArtist(artist.name)}
                                  disabled={isLinking}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <FiTrash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setShowArtistSearch(artist.name)}
                                  disabled={isLinking}
                                >
                                  <FiLink className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setNewArtist({ 
                                      venderArtistId: artist.id || '',
                                      site: data.performance.site as 'INTERPARK'
                                    });
                                    setShowNewArtist(artist.name);
                                  }}
                                  disabled={isLinking}
                                >
                                  <FiPlus className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 예매 정보 */}
            {crawledData.reservations && crawledData.reservations.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">예매 정보</h3>
                <div className="space-y-3">
                  {crawledData.reservations.map((reservation, idx) => (
                    <div key={idx} className="border rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500 block">시작일</span>
                          <span className="font-medium">{formatDateTime(reservation.startDate)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">마감일</span>
                          <span className="font-medium">{formatDateTime(reservation.endDate)}</span>
                        </div>
                        <div>
                          <a
                            href={reservation.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            예매 링크 <FiExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 타임테이블 */}
            {crawledData.timetables && crawledData.timetables.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">타임테이블</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">날짜</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">시간</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">아티스트</th>
                        <th className="text-left py-2 px-3 text-gray-500 font-medium">홀</th>
                      </tr>
                    </thead>
                    <tbody>
                      {crawledData.timetables.map((tt, idx) => (
                        <tr 
                          key={idx} 
                          className="border-b last:border-0 hover:bg-blue-50 cursor-pointer"
                          onClick={() => handleSelectTimetable(tt)}
                          title="클릭하여 타임테이블을 수정합니다"
                        >
                          <td className="py-2 px-3">{tt.date || '-'}</td>
                          <td className="py-2 px-3">
                            {tt.startTime || '-'} {tt.endTime ? `~ ${tt.endTime}` : ''}
                          </td>
                          <td className="py-2 px-3">{tt.venderArtistName}</td>
                          <td className="py-2 px-3">{tt.hallName || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 공연 검색 모달 */}
      <SearchModal
        isOpen={showPerformanceSearch}
        onClose={() => setShowPerformanceSearch(false)}
        title="기존 공연 검색"
        searchPlaceholder="공연명으로 검색..."
        initialQuery={crawledData.title || ''}
        items={filteredFestivals}
        isLoading={false}
        onSearch={handleSearchFestivals}
        onSelect={handleLinkPerformance}
        getItemKey={(f) => f.id}
        renderItem={(f) => (
          <div>
            <p className="font-medium">{f.name}</p>
            <p className="text-sm text-gray-600">
              {f.placeName} | {f.startDate} ~ {f.endDate}
            </p>
          </div>
        )}
      />

      {/* 장소 검색 모달 */}
      <SearchModal
        isOpen={showPlaceSearch}
        onClose={() => setShowPlaceSearch(false)}
        title="기존 장소 검색"
        searchPlaceholder="장소명 또는 주소로 검색..."
        initialQuery={crawledData.place?.name || crawledData.place?.address || ''}
        items={filteredPlaces}
        isLoading={false}
        onSearch={handleSearchPlaces}
        onSelect={handleLinkPlace}
        getItemKey={(p) => p.id}
        renderItem={(p) => (
          <div>
            <p className="font-medium">{p.placeName}</p>
            <p className="text-sm text-gray-600">{p.address}</p>
            {p.halls && p.halls.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {p.halls.map(h => (
                  <span key={h.id} className="text-xs bg-gray-100 px-1 py-0.5 rounded">
                    {h.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      />

      {/* 아티스트 검색 모달 */}
      <SearchModal
        isOpen={showArtistSearch !== null}
        onClose={() => setShowArtistSearch(null)}
        title={`아티스트 검색: ${showArtistSearch}`}
        searchPlaceholder="아티스트명 또는 별명으로 검색..."
        initialQuery={showArtistSearch || ''}
        items={filteredArtists}
        isLoading={false}
        onSearch={handleSearchArtists}
        onSelect={(artist) => showArtistSearch && handleLinkArtist(showArtistSearch, artist)}
        getItemKey={(a) => a.id}
        renderItem={(a) => (
          <div className="flex items-center gap-3">
            {a.imageUrl && (
              <Image
                src={a.imageUrl}
                alt={a.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-medium">{a.name}</p>
              {a.aliases.length > 0 && (
                <p className="text-sm text-gray-600">
                  별명: {a.aliases.map(alias => alias.name).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}
      />

      {/* 새 공연 생성 모달 */}
      <CreateModal
        isOpen={showNewPerformance}
        onClose={() => setShowNewPerformance(false)}
        title="새 공연 생성"
        onSubmit={handleCreateNewPerformance}
        isSubmitting={isCreating}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공연명 *</label>
            <Input
              value={newPerformance.name}
              onChange={(e) => setNewPerformance({ ...newPerformance, name: e.target.value })}
              placeholder="공연명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소 *</label>
            {data && data.placeLinks.length > 0 && (
              <div className="mb-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <FiCheck className="w-4 h-4 text-green-600" />
                  <p className="text-sm text-green-800">
                    <strong>연동된 장소 ID:</strong> {data.placeLinks[0].performancePlaceId}
                  </p>
                </div>
                {linkedPlace ? (
                  <div className="mt-1">
                    <p className="text-sm text-green-800">{linkedPlace.placeName}</p>
                    <p className="text-xs text-green-600">{linkedPlace.address}</p>
                  </div>
                ) : (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ 장소 정보를 찾을 수 없습니다. 장소가 삭제되었거나 아직 로드되지 않았습니다.
                  </p>
                )}
              </div>
            )}
            <select
              value={newPerformance.placeId}
              onChange={(e) => setNewPerformance({ ...newPerformance, placeId: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={0}>장소를 선택하세요</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>{p.placeName}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
              <Input
                type="date"
                value={newPerformance.startDate}
                onChange={(e) => setNewPerformance({ ...newPerformance, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
              <Input
                type="date"
                value={newPerformance.endDate}
                onChange={(e) => setNewPerformance({ ...newPerformance, endDate: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">포스터 URL</label>
            <Input
              value={newPerformance.posterUrl}
              onChange={(e) => setNewPerformance({ ...newPerformance, posterUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연동 항목 * (최소 1개)</label>
            <div className="space-y-2">
              {[
                { value: 'BASIC', label: '기본 정보 (포스터, 교통정보, 금지물품)' },
                { value: 'PERFORMANCE_DATE', label: '공연일 정보' },
                { value: 'RESERVATION_INFO', label: '예매 정보' },
                { value: 'TIMETABLE', label: '타임테이블' },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPerformance.linkItems.includes(item.value as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setNewPerformance({
                          ...newPerformance,
                          linkItems: [...newPerformance.linkItems, item.value as any]
                        });
                      } else {
                        setNewPerformance({
                          ...newPerformance,
                          linkItems: newPerformance.linkItems.filter(i => i !== item.value)
                        });
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </CreateModal>

      {/* 공연 연동 수정 모달 */}
      <CreateModal
        isOpen={showEditPerformance}
        onClose={() => setShowEditPerformance(false)}
        title="공연 연동 수정"
        onSubmit={handleUpdatePerformance}
        isSubmitting={isLinking}
      >
        <div className="space-y-4">
          {linkedPerformance && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="font-medium text-gray-900">{linkedPerformance.name}</p>
              <p className="text-sm text-gray-600">
                {linkedPerformance.placeName} | {linkedPerformance.startDate} ~ {linkedPerformance.endDate}
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">연동 항목 * (최소 1개)</label>
            <div className="space-y-2">
              {[
                { value: 'BASIC', label: '기본 정보 (포스터, 교통정보, 금지물품)' },
                { value: 'PERFORMANCE_DATE', label: '공연일 정보' },
                { value: 'RESERVATION_INFO', label: '예매 정보' },
                { value: 'TIMETABLE', label: '타임테이블' },
              ].map((item) => (
                <label key={item.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editLinkItems.includes(item.value as any)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setEditLinkItems([...editLinkItems, item.value as any]);
                      } else {
                        setEditLinkItems(editLinkItems.filter(i => i !== item.value));
                      }
                    }}
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>💡 팁:</strong> 연동 항목을 선택하면 크롤링된 데이터가 해당 항목에 반영됩니다.
          </div>
        </div>
      </CreateModal>

      {/* 장소 연동 수정 모달 */}
      <CreateModal
        isOpen={showEditPlace}
        onClose={() => setShowEditPlace(false)}
        title="장소 연동 수정"
        onSubmit={handleUpdatePlace}
        isSubmitting={isLinking}
      >
        <div className="space-y-4">
          {linkedPlace && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="font-medium text-gray-900">현재 연동: {linkedPlace.placeName}</p>
              <p className="text-sm text-gray-600">{linkedPlace.address}</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">새 장소 선택 *</label>
            <select
              value={editPlace?.placeId || 0}
              onChange={(e) => setEditPlace({ placeId: Number(e.target.value) })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value={0}>장소를 선택하세요</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>{p.placeName}</option>
              ))}
            </select>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <strong>💡 팁:</strong> 다른 장소로 변경하면 크롤링 데이터는 유지되지만 연동 대상만 변경됩니다.
          </div>
        </div>
      </CreateModal>

      {/* 새 장소 생성 모달 */}
      <CreateModal
        isOpen={showNewPlace}
        onClose={() => setShowNewPlace(false)}
        title="새 장소 생성"
        onSubmit={handleCreateNewPlace}
        isSubmitting={isCreating}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소명 *</label>
            <Input
              value={newPlace.placeName}
              onChange={(e) => setNewPlace({ ...newPlace, placeName: e.target.value })}
              placeholder="장소명을 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <Input
              value={newPlace.address}
              onChange={(e) => setNewPlace({ ...newPlace, address: e.target.value })}
              placeholder="주소를 입력하세요"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor 장소 ID</label>
            <Input
              value={newPlace.venderPlaceId}
              onChange={(e) => setNewPlace({ ...newPlace, venderPlaceId: e.target.value })}
              placeholder="크롤링된 장소 ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사이트 *</label>
            <select
              value={newPlace.site}
              onChange={(e) => setNewPlace({ ...newPlace, site: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="INTERPARK">인터파크</option>
              <option value="MELON">멜론</option>
            </select>
          </div>
        </div>
      </CreateModal>

      {/* 아티스트 연동 수정 모달 */}
      <CreateModal
        isOpen={showEditArtist !== null}
        onClose={() => setShowEditArtist(null)}
        title="아티스트 연동 수정"
        onSubmit={handleUpdateArtist}
        isSubmitting={isLinking}
      >
        <div className="space-y-4">
          {editArtist && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
              <p className="font-medium text-gray-900">크롤링 아티스트: {editArtist.venderArtistName}</p>
              <div className="mt-2">
                <ArtistStatusBadge status={editArtist.status} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">내부 아티스트 검색</label>
            <Input
              value={editArtistSearch}
              onChange={(e) => setEditArtistSearch(e.target.value)}
              placeholder="이름 또는 별칭으로 검색"
            />
            <div className="border rounded-lg max-h-64 overflow-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 text-left">ID</th>
                    <th className="px-3 py-2 text-left">이름 / 별칭</th>
                    <th className="px-3 py-2 text-left">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInternalArtists.map((a) => {
                    const isSelected = editArtist?.artistId === a.id;
                    return (
                      <tr key={a.id} className={isSelected ? 'bg-blue-50' : ''}>
                        <td className="px-3 py-2">{a.id}</td>
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900">{a.name}</div>
                          {a.aliases.length > 0 && (
                            <div className="text-xs text-gray-500">
                              별칭: {a.aliases.map(al => al.name).join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => editArtist && setEditArtist({ ...editArtist, artistId: a.id })}
                          >
                            선택
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredInternalArtists.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-center text-gray-500" colSpan={3}>검색 결과가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">연동 상태</label>
              <select
                value={editArtistStatus}
                onChange={(e) => setEditArtistStatus(e.target.value as ArtistLinkStatus)}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="PENDING">대기중</option>
                <option value="TEMP">임시</option>
                <option value="TEMP_WITH_NEW_ARTIST">새 아티스트 임시</option>
                <option value="CONFIRMED">확정</option>
              </select>
            </div>
            <div className="flex items-center gap-2 mt-6">
              <input
                id="removePrevArtist"
                type="checkbox"
                checked={removePrevArtist}
                onChange={(e) => setRemovePrevArtist(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="removePrevArtist" className="text-sm text-gray-700">
                기존 연동 아티스트를 삭제(언링크) 후 재연동
              </label>
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded space-y-1">
            <div><strong>💡 팁:</strong> 검색 테이블에서 아티스트를 선택하면 즉시 반영됩니다.</div>
            <div>연동 상태를 임시 → 확정으로 변경할 수 있습니다.</div>
            <div>기존 아티스트를 삭제 선택 시, 기존 연동을 해제 후 새 아티스트로 다시 연동합니다.</div>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-xs text-gray-500">정식 삭제: 아티스트 엔티티 자체를 삭제합니다.</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteArtistInternal}
              disabled={isLinking || !editArtist}
            >
              영구 삭제
            </Button>
          </div>
        </div>
      </CreateModal>

      {/* 새 아티스트 생성 모달 */}
      <CreateModal
        isOpen={showNewArtist !== null}
        onClose={() => setShowNewArtist(null)}
        title={`새 아티스트 생성: ${showNewArtist}`}
        onSubmit={() => showNewArtist && handleCreateNewArtist(showNewArtist)}
        isSubmitting={isCreating}
      >
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>아티스트명:</strong> {showNewArtist}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              이 이름으로 시스템에서 아티스트를 자동 생성하고 연동합니다.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor 아티스트 ID</label>
            <Input
              value={newArtist.venderArtistId}
              onChange={(e) => setNewArtist({ ...newArtist, venderArtistId: e.target.value })}
              placeholder="크롤링된 아티스트 ID (선택사항)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사이트 *</label>
            <select
              value={newArtist.site}
              onChange={(e) => setNewArtist({ ...newArtist, site: e.target.value as any })}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="INTERPARK">인터파크</option>
              <option value="MELON">멜론</option>
            </select>
          </div>
        </div>
      </CreateModal>

      {/* 타임테이블 수정 모달 */}
      <CreateModal
        isOpen={!!editTimetable}
        onClose={() => setEditTimetable(null)}
        title={editTimetable ? `타임테이블 수정: ${editTimetable.venderArtistName}` : '타임테이블 수정'}
        onSubmit={handleUpdateTimetable}
        isSubmitting={isUpdatingTimetable}
        submitLabel="수정"
      >
        {editTimetable && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">공연일</label>
                <Input
                  type="date"
                  value={editTimetable.performanceDate}
                  onChange={(e) => setEditTimetable(prev => prev ? { ...prev, performanceDate: e.target.value } : prev)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">홀</label>
                <select
                  value={editTimetable.hallId ?? 0}
                  onChange={(e) => setEditTimetable(prev => prev ? { ...prev, hallId: Number(e.target.value) } : prev)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value={0}>선택 안 함</option>
                  {linkedPlace?.halls?.map((hall) => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                <Input
                  value={editTimetable.startTime}
                  onChange={(e) => setEditTimetable(prev => prev ? { ...prev, startTime: e.target.value } : prev)}
                  placeholder="HH:MM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                <Input
                  value={editTimetable.endTime}
                  onChange={(e) => setEditTimetable(prev => prev ? { ...prev, endTime: e.target.value } : prev)}
                  placeholder="HH:MM"
                />
              </div>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
              타임테이블 아이템을 클릭하면 수정할 수 있습니다. 공연 연동 및 타임테이블 연동이 되어 있어야 수정 가능합니다.
            </div>
          </div>
        )}
      </CreateModal>
    </div>
  );
}
