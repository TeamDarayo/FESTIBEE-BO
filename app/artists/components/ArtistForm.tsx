import { useState, useEffect } from 'react';
import { Artist, ArtistAlias, checkArtistDuplicate, searchAppleMusicArtists, AppleMusicArtist } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FiSearch, FiX } from 'react-icons/fi';

interface ArtistFormProps {
  onSubmit: (data: Omit<Artist, 'id'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Artist;
  isOpen: boolean;
}

export default function ArtistForm({ onSubmit, onCancel, initialData, isOpen }: ArtistFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    imageUrl: initialData?.imageUrl || '',
    aliases: initialData?.aliases || [],
  });

  const [newAlias, setNewAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [aliasError, setAliasError] = useState<string | null>(null);
  const [isCheckingAliasDuplicate, setIsCheckingAliasDuplicate] = useState(false);
  
  // Apple Music 검색 관련 상태
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<AppleMusicArtist[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        imageUrl: initialData.imageUrl || '',
        aliases: initialData.aliases,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        imageUrl: '',
        aliases: [],
      });
    }
    setNewAlias('');
    setNameError(null);
    setAliasError(null);
    setSearchResults([]);
    setShowSearchResults(false);
  }, [initialData, isOpen]);

  // 이름 중복 체크 함수
  const checkNameDuplicate = async (name: string) => {
    if (!name.trim()) {
      setNameError(null);
      return;
    }

    setIsCheckingDuplicate(true);
    try {
      const result = await checkArtistDuplicate(name, initialData?.id);
      if (result.isDuplicate) {
        const errorMessage = result.duplicateType === 'name' 
          ? `이미 등록된 아티스트 이름입니다: "${result.duplicateName}"`
          : `이미 다른 아티스트의 별명으로 등록되어 있습니다: "${result.duplicateName}"`;
        setNameError(errorMessage);
      } else {
        setNameError(null);
      }
    } catch (error) {
      console.error('Error checking duplicate:', error);
      setNameError('중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingDuplicate(false);
    }
  };

  // 이름 입력 시 중복 체크 (디바운스 적용)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (formData.name.trim()) {
        checkNameDuplicate(formData.name);
      } else {
        setNameError(null);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.name]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 중복 체크 에러가 있으면 제출하지 않음
    if (nameError) {
      alert('중복된 아티스트 이름이 있습니다. 다른 이름을 사용해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onCancel();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) return;
    
    // 이미 추가된 별명인지 확인
    if (formData.aliases.some(alias => alias.name === newAlias.trim())) {
      setAliasError('이미 추가된 별명입니다.');
      return;
    }
    
    // 중복 체크
    setIsCheckingAliasDuplicate(true);
    try {
      const result = await checkArtistDuplicate(newAlias.trim(), initialData?.id);
      if (result.isDuplicate) {
        const errorMessage = result.duplicateType === 'name' 
          ? `이미 등록된 아티스트 이름입니다: "${result.duplicateName}"`
          : `이미 다른 아티스트의 별명으로 등록되어 있습니다: "${result.duplicateName}"`;
        setAliasError(errorMessage);
        return;
      }
      
      // 중복이 없으면 추가
      const newAliasObj: ArtistAlias = {
        id: Date.now(),
        name: newAlias.trim()
      };
      setFormData(prev => ({
        ...prev,
        aliases: [...prev.aliases, newAliasObj]
      }));
      setNewAlias('');
      setAliasError(null);
    } catch (error) {
      console.error('Error checking alias duplicate:', error);
      setAliasError('중복 확인 중 오류가 발생했습니다.');
    } finally {
      setIsCheckingAliasDuplicate(false);
    }
  };

  const handleRemoveAlias = (aliasId: number) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter(alias => alias.id !== aliasId)
    }));
  };

  // Apple Music 검색 함수
  const handleSearchAppleMusic = async () => {
    if (!formData.name.trim()) {
      alert('아티스트 이름을 먼저 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchAppleMusicArtists(formData.name);
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Apple Music 검색 오류:', error);
      alert('Apple Music 검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // Apple Music 아티스트 선택 함수
  const handleSelectAppleMusicArtist = (artist: AppleMusicArtist) => {
    if (artist.artworkUrl) {
      setFormData(prev => ({
        ...prev,
        imageUrl: artist.artworkUrl || ''
      }));
      setShowSearchResults(false);
    } else {
      alert('이 아티스트는 이미지가 없습니다.');
    }
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string) => {
    if (imageUrl.includes('{w}x{h}')) {
      setSelectedImage(imageUrl.replace('{w}x{h}', '800x800'));
    } else {
      setSelectedImage(imageUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? '아티스트 수정' : '새 아티스트 추가'}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium text-gray-700">아티스트 이름</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className={`w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                      nameError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                    placeholder="아티스트 이름을 입력하세요"
                  />
                  {isCheckingDuplicate && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={handleSearchAppleMusic}
                  disabled={!formData.name.trim() || isSearching}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300"
                >
                  {isSearching ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FiSearch className="mr-1" />
                      이미지 찾기
                    </>
                  )}
                </Button>
              </div>
              {nameError && (
                <p className="text-red-600 text-sm mt-1">{nameError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">설명</Label>
              <Textarea
                id="description"
                required
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="아티스트에 대한 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-sm font-medium text-gray-700">이미지 URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="아티스트 이미지 URL을 입력하세요 (선택사항)"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">별칭</Label>
              <div className="flex gap-2">
                <Input
                  value={newAlias}
                  onChange={(e) => {
                    setNewAlias(e.target.value);
                    if (aliasError) setAliasError(null);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlias())}
                  className={`flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 ${
                    aliasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                  placeholder="별칭을 입력하고 Enter를 누르세요"
                />
                <Button
                  type="button"
                  onClick={handleAddAlias}
                  disabled={!newAlias.trim() || isCheckingAliasDuplicate}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isCheckingAliasDuplicate ? '확인 중...' : '추가'}
                </Button>
              </div>
              {aliasError && (
                <p className="text-red-600 text-sm mt-1">{aliasError}</p>
              )}
              
              {formData.aliases.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.aliases.map(alias => (
                    <span 
                      key={alias.id} 
                      className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {alias.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveAlias(alias.id)}
                        className="text-red-600 hover:text-red-800 text-xs"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.description || !!nameError || isCheckingDuplicate}
            >
              {isSubmitting ? '저장 중...' : (initialData ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </div>

      {/* Apple Music 검색 결과 모달 */}
      {showSearchResults && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Apple Music 검색 결과</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSearchResults(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              {searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  검색 결과가 없습니다.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResults.map((artist, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        artist.artworkUrl ? 'hover:border-blue-500' : 'opacity-50 cursor-not-allowed'
                      }`}
                      onClick={() => artist.artworkUrl && handleSelectAppleMusicArtist(artist)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                          {artist.artworkUrl ? (
                                                                                      <img 
                               src={artist.artworkUrl.replace('{w}x{h}', '500x500')} 
                               alt={artist.name}
                               className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                               onClick={() => artist.artworkUrl && handleImageClick(artist.artworkUrl)}
                               onError={(e) => {
                                 e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRDMCAzNS4wNSA5Ljk1IDQ0IDIxIDQ0QzMzLjA1IDQ0IDQyIDM1LjA1IDQyIDI0QzQyIDEyLjk1IDMzLjA1IDQgMjQgNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDEyQzI3LjMxIDExIDMwIDExIDMwIDE1QzMwIDE5IDI3LjMxIDIwIDI0IDIwQzIwLjY5IDIwIDE4IDE5IDE4IDE1QzE4IDExIDIwLjY5IDEyIDI0IDEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI4QzE5LjU5IDI4IDE2IDMxLjU5IDE2IDM2SDMyQzMyIDMxLjU5IDI4LjQxIDI4IDI0IDI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
                               }}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{artist.name}</h3>
                          <p className="text-sm text-gray-500">
                            {artist.genreNames.length > 0 ? artist.genreNames.join(', ') : '장르 정보 없음'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
                 </div>
       )}

       {/* 이미지 확대 모달 */}
       {selectedImage && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
           <div className="relative max-w-4xl max-h-[90vh]">
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setSelectedImage(null)}
               className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
             >
               <FiX className="w-6 h-6" />
             </Button>
             <img 
               src={selectedImage.replace('{w}x{h}', '800x800')} 
               alt="확대된 이미지"
               className="max-w-full max-h-full object-contain rounded-lg"
               onError={(e) => {
                 e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRDMCAzNS4wNSA5Ljk1IDQ0IDIxIDQ0QzMzLjA1IDQ0IDQyIDM1LjA1IDQyIDI0QzQyIDEyLjk1IDMzLjA1IDQgMjQgNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDEyQzI3LjMxIDExIDMwIDExIDMwIDE1QzMwIDE5IDI3LjMxIDIwIDI0IDIwQzIwLjY5IDIwIDE4IDE5IDE4IDE1QzE4IDExIDIwLjY5IDEyIDI0IDEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI4QzE5LjU5IDI4IDE2IDMxLjU5IDE2IDM2SDMyQzMyIDMxLjU5IDI4LjQxIDI4IDI0IDI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
               }}
             />
           </div>
         </div>
       )}
     </div>
   );
 } 