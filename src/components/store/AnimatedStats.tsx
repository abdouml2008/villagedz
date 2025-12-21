import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Truck, Package, Headphones, Star } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

interface StatItemProps {
  value: number | string;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
  delay?: number;
}

const AnimatedCounter = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;
    
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [target, isInView]);

  return (
    <span ref={ref} className="text-2xl md:text-3xl font-bold text-primary">
      {count}{suffix}
    </span>
  );
};

const StatItem = ({ value, label, icon, suffix = '', delay = 0 }: StatItemProps) => {
  return (
    <motion.div
      className="flex items-center gap-3 md:gap-4"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      {/* Icon */}
      <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/15 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      
      {/* Content */}
      <div className="flex flex-col">
        {typeof value === 'number' ? (
          <AnimatedCounter target={value} suffix={suffix} />
        ) : (
          <span className="text-2xl md:text-3xl font-bold text-primary">{value}</span>
        )}
        <span className="text-xs md:text-sm text-muted-foreground">{label}</span>
      </div>
    </motion.div>
  );
};

interface AnimatedStatsProps {
  totalProducts: number;
}

export const AnimatedStats = ({ totalProducts }: AnimatedStatsProps) => {
  const { t } = useTranslation();

  const stats = [
    {
      value: 69 as number,
      label: t.home.deliveryStates,
      icon: <Truck className="w-6 h-6" />,
      suffix: '',
    },
    {
      value: totalProducts,
      label: t.home.productsAvailable,
      icon: <Package className="w-6 h-6" />,
      suffix: '+',
    },
    {
      value: '24/7',
      label: t.home.customerSupport,
      icon: <Headphones className="w-6 h-6" />,
    },
    {
      value: 5,
      label: 'تقييم العملاء',
      icon: <Star className="w-6 h-6 fill-current" />,
      suffix: '★',
    },
  ];

  return (
    <div className="bg-card/80 backdrop-blur-md rounded-2xl p-6 md:p-8 border border-border/50 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
        {stats.map((stat, index) => (
          <StatItem
            key={index}
            value={stat.value}
            label={stat.label}
            icon={stat.icon}
            suffix={stat.suffix}
            delay={index * 0.1}
          />
        ))}
      </div>
    </div>
  );
};
