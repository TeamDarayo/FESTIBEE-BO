import Link from 'next/link';
import { FiCalendar, FiUsers, FiMapPin, FiBell } from 'react-icons/fi';

export default function Home() {
  const menuItems = [
    {
      title: 'Festivals',
      description: '페스티벌 및 공연 정보 관리',
      href: '/festivals',
      icon: <FiCalendar className="text-4xl text-blue-500" />,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Artists',
      description: '아티스트 정보 및 별명 관리',
      href: '/artists',
      icon: <FiUsers className="text-4xl text-green-500" />,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Places',
      description: '공연장 및 홀 정보 관리',
      href: '/places',
      icon: <FiMapPin className="text-4xl text-purple-500" />,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Alarm Tests',
      description: '알람 테스트 발송 관리',
      href: '/alarms',
      icon: <FiBell className="text-4xl text-orange-500" />,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-8">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Festibee Dashboard</h1>
        <p className="text-xl text-gray-600">페스티벌 관리 시스템에 오신 것을 환영합니다</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {menuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`block p-6 rounded-xl border-2 transition-all duration-200 ${item.color}`}
          >
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                {item.icon}
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">시스템 정보</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong>Festivals:</strong> 페스티벌 정보, 타임테이블, 예매 정보 관리
          </div>
          <div>
            <strong>Artists:</strong> 아티스트 정보, 별명, 공연 참여 관리
          </div>
          <div>
            <strong>Places:</strong> 공연장, 홀, 위치 정보 관리
          </div>
        </div>
      </div>
    </div>
  );
} 