import { useState, useEffect, useCallback } from "react";

interface useSliderProps {
    count: number;
    interval?: number;
}

export function useSlider({ count, interval = 6000 }: useSliderProps) {
    const [current, setCurrent] = useState(0);

    const nextSlide = useCallback(() => {
        if (count > 0) {
            setCurrent((prev) => (prev + 1) % count);
        }
    }, [count]);

    const prevSlide = useCallback(() => {
        if (count > 0) {
            setCurrent((prev) => (prev - 1 + count) % count);
        }
    }, [count]);

    const goToSlide = useCallback((index: number) => {
        setCurrent(index);
    }, []);

    useEffect(() => {
        if (count > 0) {
            const timer = setInterval(nextSlide, interval);
            return () => clearInterval(timer);
        }
    }, [nextSlide, count, interval]);

    return {
        current,
        nextSlide,
        prevSlide,
        goToSlide,
    };
}
