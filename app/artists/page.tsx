'use client';

import { useEffect, useState } from 'react';
import { Artist, fetchArtists, deleteArtist, createArtist, updateArtist, addArtistAliases, deleteArtistAlias, ArtistAlias } from '@/lib/api';
import ArtistForm from './components/ArtistForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import PasswordModal from '@/components/PasswordModal';
import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiSearch } from 'react-icons/fi';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [filteredArtists, setFilteredArtists] = useState<Artist[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // 비밀번호 모달 상태
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'update' | 'delete';
    data?: any;
    id?: number;
  } | null>(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const data = await fetchArtists();
      setArtists(data);
      setFilteredArtists(data);
      setError(null);
    } catch (err) {
      setError('Failed to load artists');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 기능
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredArtists(artists);
      return;
    }
    
    const filtered = artists.filter(artist => 
      artist.name.toLowerCase().includes(term.toLowerCase()) ||
      artist.description.toLowerCase().includes(term.toLowerCase()) ||
      artist.aliases.some(alias => 
        alias.name.toLowerCase().includes(term.toLowerCase())
      )
    );
    setFilteredArtists(filtered);
  };

  const handleCreateArtist = async (artistData: Omit<Artist, 'id'>) => {
    setPendingAction({ type: 'create', data: artistData });
    setIsPasswordModalOpen(true);
  };

  const handleUpdateArtist = async (artistData: Omit<Artist, 'id'>) => {
    if (!editingArtist) return;
    setPendingAction({ type: 'update', data: artistData, id: editingArtist.id });
    setIsPasswordModalOpen(true);
  };

  const handleDeleteArtist = async (id: number) => {
    setPendingAction({ type: 'delete', id });
    setIsPasswordModalOpen(true);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (!pendingAction) return;

    try {
      switch (pendingAction.type) {
        case 'create':
          await createArtist(pendingAction.data, password);
          alert('아티스트가 성공적으로 추가되었습니다.');
          await loadArtists(); // 목록 새로고침
          break;
        case 'update':
          if (pendingAction.id) {
            // 아티스트 기본 정보 업데이트
            await updateArtist(pendingAction.id, pendingAction.data, password);
            
            // 별칭 변경사항 처리
            const originalArtist = artists.find(a => a.id === pendingAction.id);
            if (originalArtist) {
              const newAliases = pendingAction.data.aliases || [];
              const originalAliases = originalArtist.aliases || [];
              
              // 삭제된 별칭들 찾기
              const deletedAliases = originalAliases.filter((origAlias: ArtistAlias) => 
                !newAliases.some((newAlias: ArtistAlias) => newAlias.name === origAlias.name)
              );
              
              // 삭제된 별칭이 있으면 삭제
              for (const deletedAlias of deletedAliases) {
                await deleteArtistAlias(deletedAlias.id);
              }
              
              // 새로 추가된 별칭들 찾기
              const addedAliases = newAliases.filter((newAlias: ArtistAlias) => 
                !originalAliases.some((origAlias: ArtistAlias) => origAlias.name === newAlias.name)
              );
              
              // 새 별칭이 있으면 추가
              if (addedAliases.length > 0) {
                const aliasNames = addedAliases.map((alias: ArtistAlias) => alias.name);
                await addArtistAliases(pendingAction.id, aliasNames, password);
              }
            }
            
            alert('아티스트가 성공적으로 수정되었습니다.');
          }
          break;
        case 'delete':
          if (pendingAction.id) {
            await deleteArtist(pendingAction.id, password);
            alert('아티스트가 성공적으로 삭제되었습니다.');
          }
          break;
      }
      
      await loadArtists();
      setEditingArtist(null);
      setIsFormOpen(false);
    } catch (error: any) {
      // 서버 에러 응답을 alert로 표시
      let errorMessage = error.message || '알 수 없는 오류가 발생했습니다.';
      console.error('Full API Error:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      
      // 401 에러 감지 (다양한 형태의 401 에러 메시지 처리)
      if (error.message && (
        error.message.includes('401') || 
        error.message.includes('Unauthorized') ||
        error.message.includes('비밀번호') ||
        error.message.includes('password')
      )) {
        errorMessage = '비밀번호를 확인해주세요.';
        alert(`오류: ${errorMessage}`);
        // 401 에러일 때는 모달을 닫지 않음
        return;
      }
      alert(`오류: ${errorMessage}`);
    } finally {
      setIsPasswordModalOpen(false);
      setPendingAction(null);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalOpen(false);
    setPendingAction(null);
  };

  const handleEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setIsFormOpen(true);
  };

  const handleView = (artist: Artist) => {
    setSelectedArtist(artist);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingArtist(null);
  };

  const handleCloseModal = () => {
    setSelectedArtist(null);
  };

  // 이미지 URL 처리 함수
  const getImageUrl = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return null;
    
    // Apple Music URL인 경우 크기 지정
    if (imageUrl.includes('{w}x{h}')) {
      return imageUrl.replace('{w}x{h}', '300x300');
    }
    
    return imageUrl;
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string | null | undefined) => {
    if (!imageUrl) return;
    
    if (imageUrl.includes('{w}x{h}')) {
      setSelectedImage(imageUrl.replace('{w}x{h}', '800x800'));
    } else {
      setSelectedImage(imageUrl);
    }
  };

  const getPasswordModalTitle = () => {
    if (!pendingAction) return '';
    switch (pendingAction.type) {
      case 'create': return '아티스트 추가';
      case 'update': return '아티스트 수정';
      case 'delete': return '아티스트 삭제';
      default: return '관리자 인증';
    }
  };

  const getPasswordModalMessage = () => {
    if (!pendingAction) return '';
    switch (pendingAction.type) {
      case 'create': return '새 아티스트를 추가하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'update': return '아티스트를 수정하기 위해 관리자 비밀번호를 입력해주세요.';
      case 'delete': return '아티스트를 삭제하기 위해 관리자 비밀번호를 입력해주세요.';
      default: return '관리자 비밀번호를 입력해주세요.';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">아티스트 관리</h1>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">아티스트 목록</h2>
            <Button onClick={() => setIsFormOpen(true)}>
              <FiPlus className="mr-2" />
              아티스트 추가
            </Button>
          </div>
          
          {/* 검색창 */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="아티스트 이름, 설명, 별칭으로 검색..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-gray-600 mt-2">
                검색 결과: {filteredArtists.length}개
              </p>
            )}
          </div>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>이미지</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>설명</TableHead>
                  <TableHead>별칭</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtists.map(artist => (
                  <TableRow key={artist.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-600">
                      {artist.id}
                    </TableCell>
                    <TableCell>
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        {artist.imageUrl ? (
                          <img 
                            src={getImageUrl(artist.imageUrl) || ''} 
                            alt={artist.name}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => handleImageClick(artist.imageUrl)}
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRDMCAzNS4wNSA5Ljk1IDQ0IDIxIDQ0QzMzLjA1IDQ0IDQyIDM1LjA1IDQyIDI0QzQyIDEyLjk1IDMzLjA1IDQgMjQgNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDEyQzI3LjMxIDExIDMwIDExIDMwIDE1QzMwIDE5IDI3LjMxIDIwIDI0IDIwQzIwLjY5IDIwIDE4IDE5IDE4IDE1QzE4IDExIDIwLjY5IDEyIDI0IDEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI4QzE5LjU5IDI4IDE2IDMxLjU5IDE2IDM2SDMyQzMyIDMxLjU5IDI4LjQxIDI4IDI0IDI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-lg font-bold">
                            {artist.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-lg">{artist.name}</TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {artist.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {artist.aliases.map(alias => (
                          <span 
                            key={alias.id} 
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                          >
                            {alias.name}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleView(artist)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FiEye className="mr-1" />
                        보기
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(artist)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <FiEdit2 className="mr-1" />
                        수정
                      </Button>
                      <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDeleteArtist(artist.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                        <FiTrash2 className="mr-1" />
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* 아티스트 상세 모달 */}
      {selectedArtist && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">아티스트 상세 정보</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </Button>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-start gap-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    {selectedArtist.imageUrl ? (
                      <img 
                        src={getImageUrl(selectedArtist.imageUrl) || ''} 
                        alt={selectedArtist.name}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(selectedArtist.imageUrl)}
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTI0IDRDMTIuOTUgNCA0IDEyLjk1IDQgMjRDMCAzNS4wNSA5Ljk1IDQ0IDIxIDQ0QzMzLjA1IDQ0IDQyIDM1LjA1IDQyIDI0QzQyIDEyLjk1IDMzLjA1IDQgMjQgNFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTI0IDEyQzI3LjMxIDExIDMwIDExIDMwIDE1QzMwIDE5IDI3LjMxIDIwIDI0IDIwQzIwLjY5IDIwIDE4IDE5IDE4IDE1QzE4IDExIDIwLjY5IDEyIDI0IDEyWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI0IDI4QzE5LjU5IDI4IDE2IDMxLjU5IDE2IDM2SDMyQzMyIDMxLjU5IDI4LjQxIDI4IDI0IDI4WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                        {selectedArtist.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{selectedArtist.name}</h3>
                    <div className="grid grid-cols-1 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">아티스트 ID:</span>
                      <p className="text-gray-900">{selectedArtist.id}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">설명:</span>
                      <p className="text-gray-900">{selectedArtist.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">별칭:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedArtist.aliases.map(alias => (
                          <span 
                            key={alias.id} 
                            className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                          >
                            {alias.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
              <Button variant="outline" onClick={handleCloseModal}>
                닫기
              </Button>
              <Button onClick={() => {
                handleCloseModal();
                handleEdit(selectedArtist);
              }}>
                수정하기
              </Button>
            </div>
          </div>
        </div>
      )}

      <ArtistForm
        isOpen={isFormOpen}
        onSubmit={editingArtist ? handleUpdateArtist : handleCreateArtist}
        onCancel={handleCloseForm}
        initialData={editingArtist || undefined}
      />

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
        title={getPasswordModalTitle()}
        message={getPasswordModalMessage()}
      />

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
              ✕
            </Button>
            <img 
              src={selectedImage} 
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