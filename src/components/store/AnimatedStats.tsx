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
    <span ref={ref} className="text-3xl md:text-4xl font-bold text-gradient">
      {count}{suffix}
    </span>
  );
};

const StatItem = ({ value, label, icon, suffix = '', delay = 0 }: StatItemProps) => {
  return (
    <motion.div
      className="relative group"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="bg-card/60 backdrop-blur-sm rounded-2xl p-4 md:p-5 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative flex flex-col items-center text-center gap-2">
          {/* Animated Icon */}
          <motion.div
            className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
          
          {/* Counter or Static Value */}
          {typeof value === 'number' ? (
            <AnimatedCounter target={value} suffix={suffix} />
          ) : (
            <span className="text-3xl md:text-4xl font-bold text-gradient">{value}</span>
          )}
          
          {/* Label */}
          <p className="text-xs md:text-sm text-muted-foreground font-medium">{label}</p>
        </div>
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
  );
};
