import React from 'react';

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon, color }) => {
  return (
    <div className={`card-stats border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold mt-0.5">{value}</p>
        </div>
        <div className={`text-${color.replace('border-', '')} h-10 w-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
