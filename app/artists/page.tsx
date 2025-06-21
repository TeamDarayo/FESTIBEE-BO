'use client';

import { useEffect, useState } from 'react';
import { Artist, fetchArtists, deleteArtist, createArtist, updateArtist } from '@/lib/api';
import ArtistForm from './components/ArtistForm';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import React from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiEye } from 'react-icons/fi';

export default function ArtistsPage() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  useEffect(() => {
    loadArtists();
  }, []);

  const loadArtists = async () => {
    try {
      const data = await fetchArtists();
      setArtists(data);
      setError(null);
    } catch (err) {
      setError('Failed to load artists');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (artistId: string) => {
    if (window.confirm('정말로 이 아티스트를 삭제하시겠습니까?')) {
      try {
        await deleteArtist(artistId);
        await loadArtists();
      } catch (error) {
        console.error('Error deleting artist:', error);
      }
    }
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

  const handleSubmit = async (data: Omit<Artist, 'artistId' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingArtist) {
        await updateArtist(editingArtist.artistId, data);
      } else {
        await createArtist(data);
      }
      await loadArtists();
      handleCloseForm();
    } catch (error) {
      console.error('Error saving artist:', error);
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
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>포스터</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>수정일</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {artists.map(artist => (
                  <TableRow key={artist.artistId} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="relative w-16 h-16">
                        <Image 
                          src={artist.image} 
                          alt={artist.name} 
                          fill
                          className="rounded-md object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium text-lg">{artist.name}</TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(artist.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(artist.updatedAt).toLocaleDateString('ko-KR')}
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
                        onClick={() => handleDelete(artist.artistId)}
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
              <div className="flex items-start space-x-6">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <Image 
                    src={selectedArtist.image} 
                    alt={selectedArtist.name} 
                    fill
                    className="rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/128x128?text=No+Image';
                    }}
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedArtist.name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">아티스트 ID:</span>
                        <p className="text-gray-900">{selectedArtist.artistId}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">생성일:</span>
                        <p className="text-gray-900">
                          {new Date(selectedArtist.createdAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">수정일:</span>
                        <p className="text-gray-900">
                          {new Date(selectedArtist.updatedAt).toLocaleString('ko-KR')}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">이미지 URL:</span>
                    <p className="text-blue-600 hover:text-blue-700 break-all">
                      <a href={selectedArtist.image} target="_blank" rel="noopener noreferrer">
                        {selectedArtist.image}
                      </a>
                    </p>
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
        onSubmit={handleSubmit}
        onCancel={handleCloseForm}
        initialData={editingArtist || undefined}
      />
    </div>
  );
} 