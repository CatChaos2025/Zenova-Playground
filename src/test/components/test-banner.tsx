import { useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useDebugInfo } from "../api/useDebugInfo";
import "./test-banner.css";

// ============================================
// ICONOS SVG DE MATERIAL SYMBOLS
// ============================================
const Icons = {
  bug: (
    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
      <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41l-1.41-1.41l-2.12 2.12c-.91-.37-1.91-.57-2.96-.57s-2.04.2-2.95.57L5.41 3L4 4.41l1.62 1.63C4.87 6.55 4.26 7.22 3.81 8H1v2h2.09c-.05.33-.09.66-.09 1v1H1v2h2v1c0 .34.04.67.09 1H1v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H21v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H21V8zm-6 8h-4v-2h4v2zm0-4h-4v-2h4v2z" />
    </svg>
  ),
  timer: (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
      <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61 1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
    </svg>
  ),
  palette: (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
      <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  ),
  memory: (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
      <path d="M2 7v2h2v2H2v2h2v2H2v2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v2h2v-2h2v-2h-2v-2h2v-2h-2V9h2V7h-2V5h-2v2h-2V5h-2v2h-2V5H9v2H7V5H5v2H2zm4 4h12v6H6v-6z" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  ),
  check: (
    <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  ),
  close: (
    <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 0 24 24" width="16" fill="currentColor">
      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
    </svg>
  ),
};

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ============================================
// VARIANTS
// ============================================
const containerVariants = {
  collapsed: {
    maxWidth: "420px",
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  expanded: {
    maxWidth: "520px",
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
} satisfies Variants;

// ✅ Strings consistentes para border-radius
const surfaceVariants = {
  collapsed: {
    borderRadius: "999px",
    borderBottomWidth: 1,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
  expanded: {
    borderRadius: "20px 20px 0px 0px",
    borderBottomWidth: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 25 },
  },
} satisfies Variants;

// ✅ Wrapper que anima altura (sin distorsionar contenido)
const expandedWrapperVariants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: "auto",
    opacity: 1,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      opacity: { duration: 0.2 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      opacity: { duration: 0.15 },
    },
  },
} satisfies Variants;

const metricVariants = {
  initial: { opacity: 0, y: -8, scale: 0.96 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 25,
      delay: i * 0.04,
    },
  }),
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.12 },
  },
} satisfies Variants;

const errorsVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
      delay: 0.12,
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: { duration: 0.12 },
  },
} satisfies Variants;

interface MetricData {
  label: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  accent: string;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const TestBanner = () => {
  const [expanded, setExpanded] = useState(false);
  const debug = useDebugInfo();

  const handleToggle = () => setExpanded((prev) => !prev);

  const metrics: MetricData[] = [
    {
      label: "Uptime",
      value: formatUptime(debug.uptime),
      icon: Icons.timer,
      accent: "uptime",
    },
    {
      label: "Renders",
      value: debug.renderCount.toLocaleString(),
      icon: Icons.palette,
      accent: "renders",
    },
    {
      label: "RAM",
      value: debug.memoryUsed !== null ? `${debug.memoryUsed} MB` : "N/D",
      subtitle:
        debug.memoryPercent !== null
          ? `${debug.memoryPercent}% de ${debug.memoryTotal} MB`
          : undefined,
      icon: Icons.memory,
      accent: "memory",
    },
    {
      label: "Errores",
      value: debug.errors.length.toString(),
      icon: Icons.error,
      accent: debug.errors.length > 0 ? "error" : "ok",
    },
  ];

  return (
    <motion.header
      className="test-banner"
      variants={containerVariants}
      initial="collapsed"
      animate={expanded ? "expanded" : "collapsed"}
    >
      {/* HEADER / SUPERFICIE */}
      <motion.div
        className="test-banner__surface"
        variants={surfaceVariants}
        initial="collapsed"
        data-expanded={expanded}
        animate={expanded ? "expanded" : "collapsed"}
        onClick={handleToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
          }
        }}
        whileHover={!expanded ? { scale: 0.98 } : {}}
        whileTap={!expanded ? { scale: 0.95 } : {}}
      >
        <motion.span
          className="test-banner__icon"
          aria-hidden="true"
          animate={{ rotate: expanded ? 360 : 0 }}
          transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
        >
          {Icons.bug}
        </motion.span>

        <motion.span
          className="test-banner__text"
          key={expanded ? "expanded-text" : "collapsed-text"}
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {expanded ? "Panel de depuración" : "Modo desarrollador activo"}
        </motion.span>

        <motion.span
          className="test-banner__chip"
          layout
          animate={{
            backgroundColor: expanded
              ? "rgba(186, 26, 26, 0.6)"
              : "rgba(232, 222, 248, 0.85)",
            color: expanded ? "#ffdad6" : "#1d192b",
          }}
          transition={{ type: "spring" as const, stiffness: 300, damping: 25 }}
        >
          {expanded ? Icons.close : "DEV"}
        </motion.span>
      </motion.div>

      {/* CONTENIDO EXPANDIDO */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="test-banner__expanded-wrapper"
            variants={expandedWrapperVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ overflow: "hidden" }}
          >
            <div className="test-banner__expanded">
              {/* Métricas */}
              <div className="test-banner__metrics">
                {metrics.map((metric, i) => (
                  <motion.div
                    key={metric.label}
                    className={`test-banner__metric test-banner__metric--${metric.accent}`}
                    variants={metricVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    custom={i}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                  >
                    <span className="test-banner__metric-icon">
                      {metric.icon}
                    </span>
                    <div className="test-banner__metric-content">
                      <span className="test-banner__metric-label">
                        {metric.label}
                      </span>
                      <span className="test-banner__metric-value">
                        {metric.value}
                      </span>
                      {metric.subtitle && (
                        <span className="test-banner__metric-subtitle">
                          {metric.subtitle}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Lista de errores */}
              <motion.div
                className="test-banner__errors"
                variants={errorsVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <h4 className="test-banner__errors-title">
                  Registro de errores
                </h4>
                {debug.errors.length === 0 ? (
                  <p className="test-banner__no-errors">
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      {Icons.check} Sin errores detectados
                    </span>
                  </p>
                ) : (
                  <ul className="test-banner__error-list">
                    {debug.errors.map((err) => (
                      <motion.li
                        key={err.id}
                        className={`test-banner__error-item test-banner__error-item--${err.type}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          type: "spring" as const,
                          stiffness: 300,
                          damping: 25,
                        }}
                      >
                        <span className="test-banner__error-type">
                          {err.type === "error" ? "ERR" : "PROM"}
                        </span>
                        <span className="test-banner__error-msg">
                          {err.message}
                        </span>
                        {err.source && (
                          <span className="test-banner__error-source">
                            {err.source}
                          </span>
                        )}
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};