import { TrendingUp, TrendingDown } from 'lucide-react';

export function StatsGrid() {
  const stats = [
    {
      label: "Today's Bookings",
      value: '$53,000',
      change: '+55%',
      isPositive: true,
      icon: '💰',
      gradient: 'from-green-500 to-teal-500',
    },
    {
      label: 'New Clinics',
      value: '3,462',
      change: '+3%',
      isPositive: true,
      icon: '🏥',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: "Today's Patients",
      value: '2,300',
      change: '+5%',
      isPositive: true,
      icon: '👥',
      gradient: 'from-blue-500 to-purple-500',
    },
    {
      label: 'Total Revenue',
      value: '$103,430',
      change: '+1%',
      isPositive: true,
      icon: '📈',
      gradient: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="relative bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] rounded-2xl p-6 border border-[#2d4a7c] hover:border-blue-500/50 transition-all group"
        >
          {/* Icon */}
          <div className="absolute top-4 right-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <span className="text-2xl">{stat.icon}</span>
            </div>
          </div>

          {/* Content */}
          <div className="mb-3">
            <div className="text-[#a3aed0] text-sm mb-2">{stat.label}</div>
            <div className="text-white text-2xl mb-2">{stat.value}</div>
            <div className="flex items-center gap-1">
              {stat.isPositive ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm ${stat.isPositive ? 'text-green-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

