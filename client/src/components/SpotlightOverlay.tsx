import { useCallback, useEffect, useState, useRef } from "react";
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

function clampPosition(value: number, min: number, max: number) {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

function getOverlapArea(
  first: { top: number; left: number; width: number; height: number },
  second: { top: number; left: number; width: number; height: number },
) {
  const left = Math.max(first.left, second.left);
  const right = Math.min(first.left + first.width, second.left + second.width);
  const top = Math.max(first.top, second.top);
  const bottom = Math.min(first.top + first.height, second.top + second.height);

  if (right <= left || bottom <= top) return 0;
  return (right - left) * (bottom - top);
}

interface SpotlightOverlayProps {
  targetSelector?: string;
  compactTargetSelector?: string;
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
  compactTargetSelector,
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
  const [tooltipPosition, setTooltipPosition] = useState<{
    top: number;
    left: number;
    placement: "top" | "bottom" | "left" | "right";
  }>({ top: 0, left: 0, placement: "bottom" });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useRef(
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const resolveTarget = useCallback(() => {
    if (targetRef?.current) {
      return targetRef.current;
    }
    const selector =
      window.innerHeight <= 600 ? (compactTargetSelector ?? targetSelector) : targetSelector;
    if (selector) {
      return document.querySelector(selector);
    }
    return null;
  }, [targetRef, targetSelector, compactTargetSelector]);
  const revealTarget = useCallback(() => {
    if (isModal || typeof window === "undefined") return;

    const element = resolveTarget();
    if (!element) return;

    const behavior = prefersReducedMotion.current ? "auto" : "smooth";
    let current = element.parentElement;

    while (current) {
      const styles = window.getComputedStyle(current);
      const canScrollY =
        /(auto|scroll)/.test(styles.overflowY) && current.scrollHeight > current.clientHeight;
      const canScrollX =
        /(auto|scroll)/.test(styles.overflowX) && current.scrollWidth > current.clientWidth;

      if (canScrollY || canScrollX) {
        const elementRect = element.getBoundingClientRect();
        const containerRect = current.getBoundingClientRect();

        if (canScrollY) {
          const targetTop =
            current.scrollTop +
            (elementRect.top - containerRect.top) -
            current.clientHeight / 2 +
            elementRect.height / 2;
          current.scrollTo({ top: Math.max(0, targetTop), behavior });
        }

        if (canScrollX) {
          const targetLeft =
            current.scrollLeft +
            (elementRect.left - containerRect.left) -
            current.clientWidth / 2 +
            elementRect.width / 2;
          current.scrollTo({ left: Math.max(0, targetLeft), behavior });
        }
      }

      current = current.parentElement;
    }

    const rect = element.getBoundingClientRect();
    const buffer = 24;
    const tooltipHeight = tooltipRef.current?.offsetHeight ?? 224;
    const roomAbove = rect.top - buffer;
    const roomBelow = window.innerHeight - rect.bottom - buffer;
    const needsTooltipRoom = Math.max(roomAbove, roomBelow) < tooltipHeight + 16;
    const isOffscreen =
      rect.top < buffer ||
      rect.bottom > window.innerHeight - buffer ||
      rect.left < buffer ||
      rect.right > window.innerWidth - buffer;

    if (isOffscreen || needsTooltipRoom) {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const topAlignedScroll = clampPosition(window.scrollY + rect.top - buffer, 0, maxScroll);
      const bottomAfterScroll = window.scrollY + rect.bottom - topAlignedScroll;
      const canPlaceBelow = bottomAfterScroll + buffer + tooltipHeight + 16 <= window.innerHeight;
      window.scrollTo({
        top: canPlaceBelow
          ? topAlignedScroll
          : clampPosition(window.scrollY + rect.bottom - window.innerHeight + buffer, 0, maxScroll),
        behavior,
      });
    }
  }, [isModal, resolveTarget]);

  useEffect(() => {
    if (isModal || typeof window === "undefined") return;

    let frameId = 0;
    let timeoutId = 0;

    frameId = window.requestAnimationFrame(() => {
      revealTarget();
      frameId = window.requestAnimationFrame(revealTarget);
    });

    timeoutId = window.setTimeout(revealTarget, 250);
    window.addEventListener("resize", revealTarget);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
      window.removeEventListener("resize", revealTarget);
    };
  }, [isModal, revealTarget, stepNumber]);

  useEffect(() => {
    const updatePosition = () => {
      const element = resolveTarget();

      if (element && !isModal) {
        const rect = element.getBoundingClientRect();
        const padding = 8;
        setPosition({
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });

        const tooltipWidth = tooltipRef.current?.offsetWidth || 360;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 224;
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const targetRect = {
          top: rect.top - padding,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        };
        const candidates: Array<{
          placement: "top" | "bottom" | "left" | "right";
          top: number;
          left: number;
          score: number;
        }> = (["bottom", "top", "right", "left"] as const).map((placement) => {
          const rawTop =
            placement === "bottom"
              ? rect.bottom + padding + 16
              : placement === "top"
                ? rect.top - padding - tooltipHeight - 16
                : rect.top + rect.height / 2 - tooltipHeight / 2;
          const rawLeft =
            placement === "right"
              ? rect.right + padding + 16
              : placement === "left"
                ? rect.left - padding - tooltipWidth - 16
                : rect.left + rect.width / 2 - tooltipWidth / 2;
          const top = clampPosition(rawTop, 20, viewportHeight - tooltipHeight - 20);
          const left = clampPosition(rawLeft, 20, viewportWidth - tooltipWidth - 20);
          const overlapArea = getOverlapArea(
            { top, left, width: tooltipWidth, height: tooltipHeight },
            targetRect,
          );
          const clampPenalty = Math.abs(rawTop - top) + Math.abs(rawLeft - left);

          return {
            placement,
            top,
            left,
            score: overlapArea * 10 + clampPenalty,
          };
        });
        const bestCandidate = candidates.sort((a, b) => a.score - b.score)[0];

        setTooltipPosition({
          top: bestCandidate.top,
          left: bestCandidate.left,
          placement: bestCandidate.placement,
        });
      } else {
        setPosition(null);
        const width = tooltipRef.current?.offsetWidth || Math.min(360, window.innerWidth - 40);
        const height = tooltipRef.current?.offsetHeight || 300;
        setTooltipPosition({
          top: Math.max(16, (window.innerHeight - height) / 2),
          left: Math.max(10, (window.innerWidth - width) / 2),
          placement: "bottom",
        });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const observer = new MutationObserver(updatePosition);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      observer.disconnect();
    };
  }, [isModal, resolveTarget, stepNumber]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus({ preventScroll: true });
      }
    };
  }, []);

  useEffect(() => {
    if (!tooltipRef.current) return;
    tooltipRef.current.focus({ preventScroll: true });
  }, [stepNumber, title]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onSkip();
        return;
      }
      if (!isModal || event.key !== "Tab" || !tooltipRef.current) return;
      const buttons =
        tooltipRef.current.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (!first || !last) return;
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === tooltipRef.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isModal, onSkip]);

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
        className={`${isModal ? "pointer-events-auto" : "pointer-events-none"} fixed inset-0 z-[9999]`}
        aria-modal={isModal ? true : undefined}
        role="dialog"
        aria-labelledby="spotlight-title"
        aria-describedby="spotlight-content"
      >
        <svg className="pointer-events-none absolute inset-0 h-full w-full">
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
          className="pointer-events-auto absolute z-[10000] max-h-[calc(100dvh-2rem)] w-[calc(100vw-20px)] max-w-[350px] overflow-y-auto rounded-lg border bg-card p-4 shadow-xl sm:w-[360px] sm:max-w-[calc(100vw-40px)] sm:p-5"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          tabIndex={-1}
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
            className="mb-2 text-base font-semibold leading-tight sm:text-lg"
          >
            {title}
          </h3>

          <p
            id="spotlight-content"
            className={`mb-3 text-sm leading-relaxed text-muted-foreground sm:mb-4 ${
              gatingAction ? "[@media(max-height:600px)]:sr-only" : ""
            }`}
          >
            {content}
          </p>

          {gatingAction && !isGatingSatisfied && (
            <p className="mb-3 text-xs font-medium text-primary sm:mb-4">{gatingAction}</p>
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
