import { motion } from 'framer-motion';

export const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15, rotateX: -2 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, y: -15, rotateX: 2 }}
      transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
      className="w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
};
