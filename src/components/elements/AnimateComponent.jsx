import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

/**
 * Gets a random rotation value that's either between -10 to -5 or 5 to 10 degrees
 * @returns {number} Random rotation value
 */
function getRandomRotation() {
  // Randomly choose negative or positive range
  const isNegative = Math.random() < 0.5;
  if (isNegative) {
    return -(Math.random() * 5 + 5); // -10 to -5
  }
  return Math.random() * 5 + 5; // 5 to 10
}

/**
 * A component that adds GSAP-powered entrance and exit animations to its children
 * @param {Object} props
 * @param {'playful'|'fadeInUp'|'fadeInDown'|'fadeInLeft'|'fadeInRight'} [props.entry='playful'] - Entry animation style
 * @param {'fadeOutUp'|'fadeOutDown'|'fadeOutLeft'|'fadeOutRight'} [props.exit='fadeOutDown'] - Exit animation style
 * @param {string} [props.ease='elastic.out(1, 0.3)'] - GSAP easing function
 * @param {number} [props.duration=1200] - Animation duration in milliseconds
 * @param {number} [props.delay=0] - Animation delay in milliseconds
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {boolean} [props.onScroll=false] - Whether to trigger animation on scroll
 * @param {number} [props.threshold=0.4] - Intersection observer threshold (0 to 1)
 * @param {string} [props.rootMargin='-25%'] - Intersection observer root margin
 * @param {boolean} [props.resetOnLeave=false] - Whether to reset animation when element leaves viewport
 * @returns {JSX.Element}
 */
const AnimateComponent = ({
  entry = "playful",
  exit = "fadeOutDown",
  ease = "elastic.out(0.95, 0.32)",
  duration = 1400,
  delay = 0,
  className,
  children,
  onScroll = false,
  threshold = 0.4,
  rootMargin = "-25%",
  resetOnLeave = false,
}) => {
  const containerRef = useRef(null);
  const [isInView, setIsInView] = useState(!onScroll);
  const hasAnimated = useRef(false);

  // Convert ms to s for GSAP
  const durationInSec = duration / 1000;
  const delayInSec = delay / 1000;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Immediately hide the element before it paints
    gsap.set(el, { autoAlpha: 0 });

    if (onScroll) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated.current) {
              setIsInView(true);
              if (!resetOnLeave) {
                hasAnimated.current = true;
              }
            } else if (!entry.isIntersecting && resetOnLeave) {
              setIsInView(false);
              hasAnimated.current = false;
            }
          });
        },
        {
          threshold,
          rootMargin,
        }
      );

      observer.observe(el);
      return () => observer.disconnect();
    }

    return undefined;
  }, [onScroll, threshold, rootMargin, resetOnLeave]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !isInView) return;

    // Animate entry
    const [fromVars, toVars] = getEntryGSAPVars(entry);
    const tl = gsap.timeline();

    tl.fromTo(
      el,
      { ...fromVars, autoAlpha: 0 },
      {
        ...toVars,
        autoAlpha: 1,
        ease,
        duration: durationInSec,
        delay: delayInSec,
      }
    );

    // Cleanup animation on unmount
    return () => {
      if (onScroll && !resetOnLeave) return; // Don't animate exit if scroll-triggered and not resetting

      const exitVars = getExitGSAPVars(exit);
      gsap.to(el, {
        ...exitVars,
        ease,
        duration: durationInSec,
        delay: delayInSec,
      });
    };
  }, [
    isInView,
    entry,
    exit,
    ease,
    durationInSec,
    delayInSec,
    onScroll,
    resetOnLeave,
  ]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

/**
 * Gets the GSAP variables for entry animations
 * @param {'playful'|'fadeInUp'|'fadeInDown'|'fadeInLeft'|'fadeInRight'} animation
 * @returns {[Object, Object]} Array containing [fromVars, toVars]
 */
function getEntryGSAPVars(animation) {
  switch (animation) {
    case "playful":
      return [
        { 
          y: 60, 
          rotation: getRandomRotation(), 
          scale: 0.8, 
          opacity: 0 
        },
        { 
          y: 0, 
          rotation: 0, 
          scale: 1, 
          opacity: 1 
        }
      ];
    case "fadeInUp":
      return [
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1 },
      ];
    case "fadeInDown":
      return [
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1 },
      ];
    case "fadeInLeft":
      return [
        { x: -50, opacity: 0 },
        { x: 0, opacity: 1 },
      ];
    case "fadeInRight":
      return [
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1 },
      ];
    default:
      return [
        { 
          y: 60, 
          rotation: getRandomRotation(), 
          scale: 0.8, 
          opacity: 0 
        },
        { 
          y: 0, 
          rotation: 0, 
          scale: 1, 
          opacity: 1 
        }
      ];
  }
}

/**
 * Gets the GSAP variables for exit animations
 * @param {'fadeOutUp'|'fadeOutDown'|'fadeOutLeft'|'fadeOutRight'} animation
 * @returns {Object} GSAP variables for the exit animation
 */
function getExitGSAPVars(animation) {
  switch (animation) {
    case "fadeOutUp":
      return { y: -50, opacity: 0 };
    case "fadeOutDown":
      return { y: 50, opacity: 0 };
    case "fadeOutLeft":
      return { x: -50, opacity: 0 };
    case "fadeOutRight":
      return { x: 50, opacity: 0 };
    default:
      return { y: 50, opacity: 0 };
  }
}

export default AnimateComponent;
