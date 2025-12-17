import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface SpotlightOverlayProps {
  targetSelector?: string;
  targetRef?: React.RefObject<HTMLElement>;
  title: string;
  content: string;
  stepNumber: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  showPrev: boolean;
  showSkip: boolean;
  nextLabel: string;
  prevLabel: string;
  skipLabel: string;
  isModal?: boolean;
  gatingAction?: string;
  isGatingSatisfied?: boolean;
}

export function SpotlightOverlay({
  targetSelector,
  targetRef,
  title,
  content,
  stepNumber,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  showPrev,
  showSkip,
  nextLabel,
  prevLabel,
  skipLabel,
  isModal = false,
  gatingAction,
  isGatingSatisfied = true,
}: SpotlightOverlayProps) {
  const [position, setPosition] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ top: number; left: number; placement: 'top' | 'bottom' | 'left' | 'right' }>({ top: 0, left: 0, placement: 'bottom' });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const updatePosition = () => {
      let element: HTMLElement | null = null;
      
      if (targetRef?.current) {
        element = targetRef.current;
      } else if (targetSelector) {
        element = document.querySelector(targetSelector);
      }
      
      if (element && !isModal) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setPosition({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        const tooltipWidth = 360;
        const tooltipHeight = 200;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let placement: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
        let top = rect.bottom + padding + 16;
        let left = rect.left + rect.width / 2 - tooltipWidth / 2;

        if (top + tooltipHeight > viewportHeight - 20) {
          placement = 'top';
          top = rect.top - padding - tooltipHeight - 16;
        }

        if (top < 20) {
          placement = 'right';
          top = rect.top + rect.height / 2 - tooltipHeight / 2;
          left = rect.right + padding + 16;
        }

        if (left + tooltipWidth > viewportWidth - 20) {
          left = viewportWidth - tooltipWidth - 20;
        }
        if (left < 20) {
          left = 20;
        }

        setTooltipPosition({ top, left, placement });
      } else {
        setPosition(null);
        setTooltipPosition({
          top: window.innerHeight / 2 - 150,
          left: window.innerWidth / 2 - 180,
          placement: 'bottom',
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      observer.disconnect();
    };
  }, [targetSelector, targetRef, isModal]);

  const animationProps = prefersReducedMotion.current
    ? {}
    : {
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 },
        transition: { duration: 0.2 },
      };

  const overlayContent = (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[9999]" 
        aria-modal="true" 
        role="dialog"
        aria-labelledby="spotlight-title"
        aria-describedby="spotlight-content"
      >
        <svg 
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {position && (
                <rect
                  x={position.left}
                  y={position.top}
                  width={position.width}
                  height={position.height}
                  rx="8"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.75)"
            mask="url(#spotlight-mask)"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          />
        </svg>

        {position && (
          <div
            className="pointer-events-none absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent"
            style={{
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
            }}
          />
        )}

        <motion.div
          ref={tooltipRef}
          className="absolute z-[10000] w-[360px] max-w-[calc(100vw-40px)] rounded-lg border bg-card p-5 shadow-xl"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          {...animationProps}
          data-testid="onboarding-tooltip"
        >
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {stepNumber} / {totalSteps}
            </span>
            {showSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="h-6 px-2 text-xs text-muted-foreground"
                data-testid="button-onboarding-skip"
              >
                <X className="mr-1 h-3 w-3" />
                {skipLabel}
              </Button>
            )}
          </div>

          <h3 
            id="spotlight-title" 
            className="mb-2 text-lg font-semibold leading-tight"
          >
            {title}
          </h3>
          
          <p 
            id="spotlight-content" 
            className="mb-4 text-sm leading-relaxed text-muted-foreground"
          >
            {content}
          </p>

          {gatingAction && !isGatingSatisfied && (
            <p className="mb-4 text-xs font-medium text-primary">
              {gatingAction}
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            {showPrev ? (
              <Button
                variant="outline"
                size="sm"
                onClick={onPrev}
                data-testid="button-onboarding-prev"
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                {prevLabel}
              </Button>
            ) : (
              <div />
            )}
            
            <Button
              size="sm"
              onClick={onNext}
              disabled={gatingAction ? !isGatingSatisfied : false}
              data-testid="button-onboarding-next"
            >
              {nextLabel}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(overlayContent, document.body);
}
