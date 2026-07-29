import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const tourSteps = [
  {
    target: '[data-tour="sidebar"]',
    title: 'Workspace Navigation',
    description: 'This is your command center. Access the Dashboard overview, check Live pools, register for Upcoming whitelist launches, review your Portfolio allocations, and study in the Educational Academy.',
    placement: 'right'
  },
  {
    target: '[data-tour="search"]',
    title: 'Search Terminal',
    description: 'Instantly find projects, search smart money records, or look up news announcements on the go.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="theme"]',
    title: 'Theme Customization',
    description: 'Toggle between custom cyber-dark space views and high-contrast daylight mode depending on your trading environment.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="tour-btn"]',
    title: 'Interactive Helper',
    description: 'Click this help button at any time to restart this onboarding walkthrough.',
    placement: 'bottom'
  },
  {
    target: '[data-tour="profile"]',
    title: 'Trading Profile',
    description: 'Monitor your account details, copy your wallet index, or verify if your Premium Tier is active.',
    placement: 'left'
  },
  {
    target: '[data-tour="main-content"]',
    title: 'Launch Board',
    description: 'Here you will see live active pools, upcoming token tickers, and historical launch archive records.',
    placement: 'center'
  }
];

export default function TourGuide() {
  const [isActive, setIsActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [coords, setCoords] = useState(null);

  // 1. Listen for manual launch trigger and auto-trigger on first login
  useEffect(() => {
    const tourCompleted = window.localStorage.getItem('tradepad-tour-completed');
    if (tourCompleted !== 'true') {
      // Small timeout to let page render first
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    }

    const handleLaunch = () => {
      setStepIndex(0);
      setIsActive(true);
    };

    window.addEventListener('launch-tradepad-tour', handleLaunch);
    return () => window.removeEventListener('launch-tradepad-tour', handleLaunch);
  }, []);

  // 2. Track target element coordinates dynamically
  useEffect(() => {
    if (!isActive) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const step = tourSteps[stepIndex];
      if (!step) return;

      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
          rawTop: rect.top,
          rawLeft: rect.left
        });

        // Scroll element into view if needed
        if (stepIndex !== 0) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setCoords(null);
      }
    };

    updateCoords();
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    const timer = setTimeout(updateCoords, 200);

    return () => {
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
      clearTimeout(timer);
    };
  }, [isActive, stepIndex]);

  const handleNext = () => {
    if (stepIndex < tourSteps.length - 1) {
      setStepIndex(current => current + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(current => current - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    window.localStorage.setItem('tradepad-tour-completed', 'true');
    setIsActive(false);
  };

  if (!isActive) return null;

  const activeStep = tourSteps[stepIndex];
  
  const getTooltipStyles = () => {
    const tooltipWidth = 340;
    if (!coords) {
      return {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const offset = 14;
    const { rawLeft, rawTop, width, height } = coords;

    if (activeStep.placement === 'right') {
      const clampedTop = Math.max(
        100,
        Math.min(window.innerHeight - 200, rawTop + height / 2)
      );
      return {
        position: 'fixed',
        left: `${rawLeft + width + offset}px`,
        top: `${clampedTop}px`,
        transform: 'translateY(-50%)',
      };
    }

    if (activeStep.placement === 'left') {
      const clampedTop = Math.max(
        100,
        Math.min(window.innerHeight - 200, rawTop + height / 2)
      );
      return {
        position: 'fixed',
        left: `${rawLeft - tooltipWidth - offset}px`,
        top: `${clampedTop}px`,
        transform: 'translateY(-50%)',
      };
    }

    if (activeStep.placement === 'bottom') {
      const center = rawLeft + width / 2;
      const margin = 20;
      const clampedLeft = Math.max(
        tooltipWidth / 2 + margin,
        Math.min(window.innerWidth - tooltipWidth / 2 - margin, center)
      );
      return {
        position: 'fixed',
        left: `${clampedLeft}px`,
        top: `${rawTop + height + offset}px`,
        transform: 'translateX(-50%)',
      };
    }

    return {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-none">
        
        {/* Dark Backdrop Spotlight Overlay */}
        <div className="absolute inset-0 bg-black/60 pointer-events-auto" style={{ zIndex: 40 }}>
          {coords && (
            <div 
              className="absolute bg-transparent pointer-events-none transition-all duration-300 rounded-2xl"
              style={{
                top: `${coords.rawTop - 6}px`,
                left: `${coords.rawLeft - 6}px`,
                width: `${coords.width + 12}px`,
                height: `${coords.height + 12}px`,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.75)',
                border: '2px solid var(--color-primary)',
              }}
            />
          )}
        </div>

        {/* Step Card Overlay */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          style={{ ...getTooltipStyles(), zIndex: 50 }}
          className="glass-card p-6 rounded-3xl border-primary/20 bg-surface/90 shadow-2xl w-[320px] sm:w-[360px] pointer-events-auto select-none"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant pb-3">
              <span className="font-mono text-[10px] font-bold text-primary uppercase tracking-widest">
                Onboarding Step {stepIndex + 1} of {tourSteps.length}
              </span>
              <button 
                onClick={handleSkip} 
                className="text-on-surface-variant hover:text-on-surface text-xs font-mono"
              >
                Skip
              </button>
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold font-display text-on-surface">
                {activeStep.title}
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {activeStep.description}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrev}
                disabled={stepIndex === 0}
                className={`secondary-button text-xs py-1.5 px-3 min-h-0 ${stepIndex === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                Back
              </button>

              <button
                onClick={handleNext}
                className="primary-button text-xs py-1.5 px-4 min-h-0"
              >
                {stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
}
