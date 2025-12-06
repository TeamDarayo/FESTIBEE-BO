'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FiLock, FiLogOut, FiCheckCircle } from 'react-icons/fi';

export default function AdminLoginForm() {
  const { password, isAuthenticated, setPassword, logout } = useAuth();
  const [inputPassword, setInputPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPassword.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      setPassword(inputPassword);
      setInputPassword('');
    } catch (error) {
      console.error('Login error:', error);
      alert('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    if (confirm('로그아웃 하시겠습니까?')) {
      logout();
    }
  };

  if (isAuthenticated) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-green-700">
          <FiCheckCircle className="text-xl" />
          <span className="font-medium">로그인됨</span>
        </div>
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full flex items-center gap-2 text-gray-700 hover:text-red-600 hover:border-red-300"
        >
          <FiLogOut className="text-lg" />
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <form onSubmit={handleLogin} className="space-y-3">
        <div className="flex items-center gap-2 text-blue-700 mb-2">
          <FiLock className="text-xl" />
          <span className="font-medium text-sm">관리자 인증</span>
        </div>
        <Input
          type="password"
          value={inputPassword}
          onChange={(e) => setInputPassword(e.target.value)}
          placeholder="비밀번호 입력"
          className="w-full text-sm"
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          size="sm"
          className="w-full"
          disabled={isSubmitting || !inputPassword.trim()}
        >
          {isSubmitting ? '로그인 중...' : '로그인'}
        </Button>
        <p className="text-xs text-gray-500 text-center">
          세션 종료 시까지 유지됩니다
        </p>
      </form>
    </div>
  );
}
