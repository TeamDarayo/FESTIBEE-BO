import { useState } from 'react';
import { PlaceRequestBody } from '@/types/place';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

interface PlaceFormProps {
  isOpen: boolean;
  onCancel: () => void;
  onSubmit: (data: PlaceRequestBody) => Promise<void>;
}

export default function PlaceForm({ isOpen, onCancel, onSubmit }: PlaceFormProps) {
  const [placeName, setPlaceName] = useState('');
  const [address, setAddress] = useState('');
  const [halls, setHalls] = useState<string[]>(['']);
  
  const handleHallChange = (index: number, value: string) => {
    const newHalls = [...halls];
    newHalls[index] = value;
    setHalls(newHalls);
  };

  const addHallInput = () => {
    setHalls([...halls, '']);
  };

  const removeHallInput = (index: number) => {
    if (halls.length > 1) {
      const newHalls = halls.filter((_, i) => i !== index);
      setHalls(newHalls);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const placeData: PlaceRequestBody = {
      placeName,
      address,
      placeHalls: halls.filter(h => h.trim() !== ''),
    };
    onSubmit(placeData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">새 장소 추가</h2>
          <Button variant="ghost" size="sm" onClick={onCancel}>✕</Button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="placeName">장소명</Label>
            <Input id="placeName" value={placeName} onChange={e => setPlaceName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">주소</Label>
            <Input id="address" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>홀(공연장) 목록</Label>
            {halls.map((hall, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={hall}
                  onChange={e => handleHallChange(index, e.target.value)}
                  placeholder={`홀 ${index + 1} 이름`}
                />
                <Button type="button" variant="outline" size="icon" onClick={() => removeHallInput(index)} disabled={halls.length <= 1}>
                  <FiTrash2 />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addHallInput} className="mt-2">
              <FiPlus className="mr-2" /> 홀 추가
            </Button>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onCancel}>취소</Button>
            <Button type="submit">저장</Button>
          </div>
        </form>
      </div>
    </div>
  );
} 