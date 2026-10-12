import React from 'react';
import {
  Utensils,
  Zap,
  GraduationCap,
  Home,
  HeartPulse,
  ShoppingBag,
  AlertCircle,
  Compass,
  Wallet,
  TrendingUp,
  Coins,
  Tag,
  Coffee,
  Car,
  Gift,
  Tv,
  Baby,
  Smile,
  Plane,
  Briefcase,
  Layers,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

const iconMap: Record<string, React.FC<LucideProps>> = {
  Utensils,
  Zap,
  GraduationCap,
  Home,
  HeartPulse,
  ShoppingBag,
  AlertCircle,
  Compass,
  Wallet,
  TrendingUp,
  Coins,
  Tag,
  Coffee,
  Car,
  Gift,
  Tv,
  Baby,
  Smile,
  Plane,
  Briefcase,
  Layers,
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name] || Tag;
  return <IconComponent {...props} />;
};

export const AVAILABLE_ICONS = [
  { name: 'Utensils', label: 'Ăn uống' },
  { name: 'Coffee', label: 'Cà phê' },
  { name: 'Zap', label: 'Điện / Năng lượng' },
  { name: 'GraduationCap', label: 'Học tập' },
  { name: 'Home', label: 'Nhà ở' },
  { name: 'Car', label: 'Xe cộ' },
  { name: 'HeartPulse', label: 'Sức khỏe' },
  { name: 'ShoppingBag', label: 'Mua sắm' },
  { name: 'AlertCircle', label: 'Phát sinh' },
  { name: 'Compass', label: 'Du lịch' },
  { name: 'Wallet', label: 'Ví tiền / Lương' },
  { name: 'TrendingUp', label: 'Đầu tư' },
  { name: 'Coins', label: 'Tiết kiệm / Khác' },
  { name: 'Gift', label: 'Quà biếu' },
  { name: 'Tv', label: 'Giải trí' },
  { name: 'Baby', label: 'Con cái' },
  { name: 'Briefcase', label: 'Công việc' },
];
