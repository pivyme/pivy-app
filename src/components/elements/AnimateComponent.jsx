import { useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "framer-motion";

/**
 * Gets a random rotation value that's either between -10 to -5 or 5 to 10 degrees
 * @returns {number} Random rotation value
 */
function getRandomRotation() {
  const isNegative = Math.random() < 0.5;
  return isNegative ? -(Math.random() * 5 + 5) : Math.random() * 5 + 5;
}

/**
 * Get animation variants based on the animation type
 * @param {string} type - Animation type
 * @param {number} delay - Delay in seconds
 * @returns {Object} Framer Motion variants
 */
const getAnimationVariants = (type, delay = 0) => {
  const baseTransition = {
    type: "spring",
    bounce: 0.45,
    duration: 0.8,
    delay
  };

  switch (type) {
    case "playful":
      return {
        initial: {
          y: 60,
          rotate: getRandomRotation(),
          scale: 0.8,
          opacity: 0
        },
        animate: {
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
    case "fadeInUp":
      return {
        initial: { y: 50, opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          y: -50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
    case "fadeInDown":
      return {
        initial: { y: -50, opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
    case "fadeInLeft":
      return {
        initial: { x: -50, opacity: 0 },
        animate: {
          x: 0,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          x: -50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
    case "fadeInRight":
      return {
        initial: { x: 50, opacity: 0 },
        animate: {
          x: 0,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          x: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
    default:
      return {
        initial: {
          y: 60,
          rotate: getRandomRotation(),
          scale: 0.8,
          opacity: 0
        },
        animate: {
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1,
          transition: baseTransition
        },
        exit: {
          y: 50,
          opacity: 0,
          transition: { ...baseTransition, duration: 0.4 }
        }
      };
  }
};

/**
 * A component that adds Framer Motion-powered entrance and exit animations to its children
 * @param {Object} props
 * @param {'playful'|'fadeInUp'|'fadeInDown'|'fadeInLeft'|'fadeInRight'} [props.entry='playful'] - Entry animation style
 * @param {number} [props.delay=0] - Animation delay in milliseconds
 * @param {string} [props.className] - Additional CSS classes
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {boolean} [props.onScroll=false] - Whether to trigger animation on scroll
 * @param {number} [props.threshold=0.4] - Intersection observer threshold (0 to 1)
 * @param {boolean} [props.resetOnLeave=false] - Whether to reset animation when element leaves viewport
 * @param {boolean} [props.show] - If provided, controls when the animation starts. Animation won't start until show is true
 * @returns {JSX.Element}
 */
const AnimateComponent = ({
  entry = "playful",
  delay = 0,
  className,
  children,
  onScroll = false,
  threshold = 0.4,
  resetOnLeave = false,
  show,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, {
    once: !resetOnLeave,
    threshold,
    margin: "-25% 0px"
  });
  const controls = useAnimation();

  useEffect(() => {
    const shouldAnimate = show === undefined ? true : show;
    if ((!onScroll || isInView) && shouldAnimate) {
      controls.start("animate");
    } else if ((resetOnLeave && !isInView) || !shouldAnimate) {
      controls.start("initial");
    }
  }, [isInView, controls, onScroll, resetOnLeave, show]);

  const variants = getAnimationVariants(entry, delay / 1000);

  return (
    <motion.div
      ref={ref}
      initial="initial"
      animate={onScroll ? controls : (show === undefined ? "animate" : controls)}
      exit="exit"
      variants={variants}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

export default AnimateComponent;
