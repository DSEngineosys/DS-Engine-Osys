import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Users, Package, TrendingUp } from "lucide-react";

const slides = [
  {
    id: "slide-1",
    title: "Employee Analysis Phase",
    description: "Monitor department performance, track individual efficiency, and manage tasks with precise metrics.",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    id: "slide-2",
    title: "Product Analysis Phase",
    description: "Leverage machine learning to rank products, predict market demand, and apply targeted offers.",
    icon: Package,
    color: "text-secondary-foreground",
    bg: "bg-secondary",
  },
  {
    id: "slide-3",
    title: "Data-Driven Decisions",
    description: "Turn raw business data into actionable intelligence with our integrated command center.",
    icon: TrendingUp,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
  }
];

export default function Onboarding() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const t = setInterval(() => {
      setCurrentSlide((s) => (s + 1) % slides.length);
    }, 3500);
    return () => clearInterval(t);
  }, [autoPlay]);

  const nextSlide = () => {
    setAutoPlay(false);
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const isLastSlide = currentSlide === slides.length - 1;

  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border p-8 flex flex-col items-center text-center overflow-hidden">
        
        <div className="h-64 flex items-center justify-center w-full mb-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex flex-col items-center justify-center"
            >
              <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${slides[currentSlide].bg}`}>
                {(() => {
                  const Icon = slides[currentSlide].icon;
                  return <Icon className={`w-16 h-16 ${slides[currentSlide].color}`} />;
                })()}
              </div>
              <h2 className="text-2xl font-bold mb-3">{slides[currentSlide].title}</h2>
              <p className="text-muted-foreground">{slides[currentSlide].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2 rounded-full transition-all duration-300 ${idx === currentSlide ? "w-8 bg-primary" : "w-2 bg-slate-200"}`}
            />
          ))}
        </div>

        <div className="flex w-full gap-4">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={prevSlide}
            disabled={currentSlide === 0}
            data-testid="button-prev-slide"
          >
            Back
          </Button>
          
          {isLastSlide ? (
            <Link href="/home" className="flex-1">
              <Button className="w-full" data-testid="button-finish-onboarding">
                Get Started
              </Button>
            </Link>
          ) : (
            <Button className="flex-1" onClick={nextSlide} data-testid="button-next-slide">
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
