import { useState, useEffect } from 'react';
import { Artist } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';

interface ArtistFormProps {
  onSubmit: (data: Omit<Artist, 'artistId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
  initialData?: Artist;
  isOpen: boolean;
}

export default function ArtistForm({ onSubmit, onCancel, initialData, isOpen }: ArtistFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    image: initialData?.image || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  // initialData가 변경될 때 formData 업데이트
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        image: initialData.image,
      });
    } else {
      setFormData({
        name: '',
        image: '',
      });
    }
    setImageError(false);
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  const handleImageError = () => {
    setImageError(true);
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">아티스트 이름</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="아티스트 이름을 입력하세요"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium text-gray-700">이미지 URL</Label>
                <Input
                  id="image"
                  type="url"
                  required
                  value={formData.image}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, image: e.target.value }));
                    setImageError(false);
                  }}
                  className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="이미지 URL을 입력하세요"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-700">이미지 미리보기</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex items-center justify-center min-h-[200px]">
                {formData.image && !imageError ? (
                  <div className="relative w-full h-48">
                    <Image 
                      src={formData.image} 
                      alt="미리보기"
                      fill
                      className="rounded-lg object-cover"
                      onError={handleImageError}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    {imageError ? (
                      <div>
                        <p className="text-red-500 mb-2">이미지를 불러올 수 없습니다</p>
                        <p className="text-sm">올바른 이미지 URL을 입력해주세요</p>
                      </div>
                    ) : (
                      <div>
                        <p>이미지 URL을 입력하면</p>
                        <p>미리보기가 표시됩니다</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
              disabled={isSubmitting || !formData.name || !formData.image}
            >
              {isSubmitting ? '저장 중...' : (initialData ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 