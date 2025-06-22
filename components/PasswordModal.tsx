import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PasswordModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  title: string;
  message: string;
}

export default function PasswordModal({ isOpen, onConfirm, onCancel, title, message }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await onConfirm(password);
      setPassword('');
    } catch (error) {
      console.error('Password confirmation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-gray-600 mb-4">{message}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">관리자 비밀번호</Label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="비밀번호를 입력하세요"
              autoFocus
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
            >
              취소
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting || !password.trim()}
            >
              {isSubmitting ? '확인 중...' : '확인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 