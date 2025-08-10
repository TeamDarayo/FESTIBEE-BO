import { useState, useEffect } from 'react';
import { Place, PlaceRequestBody, Hall } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import React from 'react';
import { FiPlus, FiX, FiEdit2 } from 'react-icons/fi';

interface PlaceFormProps {
  onSubmit: (data: PlaceRequestBody, hallChanges?: { edits: Array<{id: number, name: string}>, adds: string[] }) => Promise<void>;
  onCancel: () => void;
  onEditHall?: (hallId: number, newName: string) => void;
  onAddHalls?: (placeId: number, hallNames: string[]) => void;
  initialData?: Place;
  isOpen: boolean;
  isReadOnly?: boolean;
}

// 초기 폼 데이터 생성 함수
const getInitialFormData = (initialData?: Place): PlaceRequestBody => {
  if (initialData) {
    return {
      placeName: initialData.placeName,
      address: initialData.address,
      placeHalls: initialData.halls.map(hall => hall.name),
    };
  }
  return {
    placeName: '',
    address: '',
    placeHalls: [''],
  };
};

export default function PlaceForm({ onSubmit, onCancel, onEditHall, onAddHalls, initialData, isOpen, isReadOnly }: PlaceFormProps) {
  const [formData, setFormData] = useState<PlaceRequestBody>(() => getInitialFormData(initialData));

  // initialData가 변경될 때 폼 데이터 업데이트
  useEffect(() => {
    setFormData(getInitialFormData(initialData));
  }, [initialData]);

  // 폼이 닫힐 때 데이터 초기화
  useEffect(() => {
    if (!isOpen) {
      setFormData(getInitialFormData());
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.placeName.trim()) {
      alert('장소명을 입력해주세요.');
      return;
    }
    
    if (!formData.address.trim()) {
      alert('주소를 입력해주세요.');
      return;
    }
    
    // 빈 홀 이름 필터링
    let validHalls = formData.placeHalls.filter(hall => hall.trim() !== '');
    
    // 홀이 없으면 장소명과 동일한 이름으로 설정
    if (validHalls.length === 0) {
      validHalls = [formData.placeName];
    }

    try {
      // 기존 장소 수정 시 홀 변경사항 수집
      let hallChanges = undefined;
      if (initialData) {
        console.log('기존 장소 수정:', initialData);
        console.log('폼 데이터:', validHalls);
        
        const originalHalls = initialData.halls;
        const originalHallNames = originalHalls.map(hall => hall.name);
        
        // 1. 이름이 변경된 기존 홀 수집
        const edits: Array<{id: number, name: string}> = [];
        for (let i = 0; i < Math.min(originalHalls.length, validHalls.length); i++) {
          const orig = originalHalls[i];
          const newName = validHalls[i];
          if (newName && newName !== orig.name) {
            console.log(`홀 수정: ${orig.name} -> ${newName}`);
            edits.push({ id: orig.id, name: newName });
          }
        }
        
        // 2. 기존에 없던 이름만 수집
        const adds = validHalls.filter(hallName => !originalHallNames.includes(hallName));
        if (adds.length > 0) {
          console.log('새 홀 추가:', adds);
        }
        
        if (edits.length > 0 || adds.length > 0) {
          hallChanges = { edits, adds };
        }
      }
      
      // 장소 정보와 홀 변경사항을 함께 제출
      await onSubmit({
        ...formData,
        placeHalls: validHalls,
      }, hallChanges);
      
    } catch (error) {
      console.error('Place form submission error:', error);
    }
  };

  const handleInputChange = (field: keyof PlaceRequestBody, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleHallChange = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      placeHalls: prev.placeHalls.map((hall, i) => i === index ? value : hall),
    }));
  };

  const addHall = () => {
    setFormData(prev => ({
      ...prev,
      placeHalls: [...prev.placeHalls, ''],
    }));
  };

  const removeHall = (index: number) => {
    if (formData.placeHalls.length <= 1) {
      alert('최소 하나의 홀은 필요합니다.');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      placeHalls: prev.placeHalls.filter((_, i) => i !== index),
    }));
  };

  const handleEditHall = async (originalHall: Hall, newName: string) => {
    if (!newName.trim()) {
      alert('홀 이름을 입력해주세요.');
      return;
    }
    
    if (originalHall.name === newName) {
      alert('변경된 내용이 없습니다.');
      return;
    }
    
    if (onEditHall) {
      onEditHall(originalHall.id, newName);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {initialData ? '장소 수정' : '새 장소 추가'}
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
          {/* 장소명 */}
          <div className="space-y-2">
            <Label htmlFor="placeName" className="text-sm font-medium text-gray-700">
              장소명 *
            </Label>
            <Input
              id="placeName"
              type="text"
              value={formData.placeName}
              onChange={(e) => handleInputChange('placeName', e.target.value)}
              placeholder="장소명을 입력하세요"
              disabled={isReadOnly}
              className="w-full"
            />
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">
              주소 *
            </Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="주소를 입력하세요"
              disabled={isReadOnly}
              className="w-full"
              rows={3}
            />
          </div>

          {/* 홀 목록 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                홀 목록 *
              </Label>
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addHall}
                  className="flex items-center gap-1"
                >
                  <FiPlus className="w-4 h-4" />
                  홀 추가
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {formData.placeHalls.map((hall, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    type="text"
                    value={hall}
                    onChange={(e) => handleHallChange(index, e.target.value)}
                    placeholder={`홀 ${index + 1} 이름`}
                    disabled={isReadOnly}
                    className="flex-1"
                  />
                  {!isReadOnly && initialData && initialData.halls[index] && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditHall(initialData.halls[index], hall)}
                      className="text-blue-600 hover:text-blue-700"
                      title="홀 수정"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </Button>
                  )}
                  {!isReadOnly && formData.placeHalls.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeHall(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <FiX className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 버튼 */}
          {!isReadOnly && (
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onCancel}>
                취소
              </Button>
              <Button type="submit">
                {initialData ? '수정' : '추가'}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 