"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronRight, Star, Bell, Palette } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target?: string; // CSS selector for element to highlight
}

const steps: OnboardingStep[] = [
  {
    id: "watchlist",
    title: "Welcome to Trading Dashboard!",
    description: "Let's get you started. Click the star icon on any chart to add it to your watchlist.",
    icon: <Star className="w-6 h-6" />,
  },
  {
    id: "notifications",
    title: "Stay Informed",
    description: "Enable notifications to get alerts on price movements and trading signals.",
    icon: <Bell className="w-6 h-6" />,
  },
  {
    id: "theme",
    title: "Customize Your Experience",
    description: "Toggle dark mode or enable high contrast from the settings. We've got you covered.",
    icon: <Palette className="w-6 h-6" />,
  },
];

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if onboarding was already completed
    const completed = localStorage.getItem("onboardingComplete");
    if (!completed) {
      // Show onboarding after a short delay
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const complete = useCallback(() => {
    localStorage.setItem("onboardingComplete", "true");
    setShow(false);
  }, []);

  const next = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      complete();
    }
  };

  const prev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const skip = () => {
    complete();
  };

  return (
    <>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) skip();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-blue-600 to-emerald-600">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      {steps[currentStep].icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">{steps[currentStep].title}</h2>
                      <p className="text-blue-100 text-sm">{`Step ${currentStep + 1} of ${steps.length}`}</p>
                    </div>
                  </div>
                  <button
                    onClick={skip}
                    className="text-white/80 hover:text-white p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 py-4 bg-gray-50 dark:bg-gray-900">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentStep(i)}
                    className={`w-2 h-2 rounded-full transition ${
                      i === currentStep
                        ? "bg-primary w-4"
                        : i < currentStep
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {steps[currentStep].description}
                </p>

                <div className="flex justify-between items-center">
                  <button
                    onClick={prev}
                    disabled={currentStep === 0}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={next}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
                  >
                    {currentStep === steps.length - 1 ? (
                      "Get Started"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
