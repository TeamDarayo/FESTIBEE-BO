import { useState, useEffect } from 'react';
import { Artist, ArtistAlias } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
    aliases: initialData?.aliases || [],
  });

  const [newAlias, setNewAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        description: initialData.description,
        aliases: initialData.aliases,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        aliases: [],
      });
    }
    setNewAlias('');
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

  const handleAddAlias = () => {
    if (newAlias.trim() && !formData.aliases.some(alias => alias.name === newAlias.trim())) {
      const newAliasObj: ArtistAlias = {
        id: Date.now(),
        name: newAlias.trim()
      };
      setFormData(prev => ({
        ...prev,
        aliases: [...prev.aliases, newAliasObj]
      }));
      setNewAlias('');
    }
  };

  const handleRemoveAlias = (aliasId: number) => {
    setFormData(prev => ({
      ...prev,
      aliases: prev.aliases.filter(alias => alias.id !== aliasId)
    }));
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
              <Label className="text-sm font-medium text-gray-700">별칭</Label>
              <div className="flex gap-2">
                <Input
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAlias())}
                  className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="별칭을 입력하고 Enter를 누르세요"
                />
                <Button
                  type="button"
                  onClick={handleAddAlias}
                  disabled={!newAlias.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  추가
                </Button>
              </div>
              
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
              disabled={isSubmitting || !formData.name || !formData.description}
            >
              {isSubmitting ? '저장 중...' : (initialData ? '수정' : '추가')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 