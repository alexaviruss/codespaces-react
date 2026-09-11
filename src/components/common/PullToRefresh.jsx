import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const PullToRefresh = ({ onRefresh, children }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startYRef = useRef(0);
  const isScrolledToTopRef = useRef(false);

  const handleTouchStart = (e) => {
    startYRef.current = e.touches[0].clientY;
    isScrolledToTopRef.current = window.scrollY === 0;
  };

  const handleTouchMove = (e) => {
    if (!isScrolledToTopRef.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startYRef.current);

    setPullDistance(Math.min(distance, 120));
  };

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 60 && isScrolledToTopRef.current && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, onRefresh, isRefreshing]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchmove", handleTouchMove);
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchEnd]);

  return (
    <div ref={containerRef} className="relative">
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ height: `${pullDistance}px` }}
      >
        <div className="flex items-center justify-center h-full">
          <RefreshCw
            size={20}
            className={`text-teal-500 transition-transform duration-300 ${
              isRefreshing ? "animate-spin" : ""
            }`}
            style={{
              transform: `rotate(${(pullDistance / 120) * 360}deg)`,
            }}
          />
        </div>
      </div>
      <div className={isRefreshing ? "opacity-60" : ""}>{children}</div>
    </div>
  );
};

export default PullToRefresh;
