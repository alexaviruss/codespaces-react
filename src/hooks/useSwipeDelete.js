import { useRef, useState } from "react";

export const useSwipeDelete = (onDelete) => {
  const [swipedId, setSwipedId] = useState(null);
  const swipeStartXRef = useRef(0);
  const swipeCurrentXRef = useRef(0);

  const handleTouchStart = (e, id) => {
    swipeStartXRef.current = e.touches[0].clientX;
    swipeCurrentXRef.current = swipeStartXRef.current;
  };

  const handleTouchMove = (e, id) => {
    swipeCurrentXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e, id) => {
    const swipeDelta = swipeStartXRef.current - swipeCurrentXRef.current;

    // Swiped left more than 100px
    if (swipeDelta > 100) {
      setSwipedId(id);
    }
    // Swiped right or not enough
    else if (swipeDelta < -50) {
      setSwipedId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      await onDelete(id);
      setSwipedId(null);
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handleCancel = () => {
    setSwipedId(null);
  };

  return {
    swipedId,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleDelete,
    handleCancel,
  };
};
