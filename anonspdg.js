/* ==========================================
   MODAL SEKIRITE PLEIN ÉCRAN (OVERLAY)
   ========================================== */

@keyframes securityFloatIn {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes shieldPulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(0, 230, 118, 0.35);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 22px 4px rgba(0, 230, 118, 0.18);
  }
}

/* Overlay plen ekran */
#floating-security-tip.security-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 8, 18, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  z-index: 9999;
}

/* Kat sekirite a */
#floating-security-tip .security-card {
  width: 100%;
  max-width: 390px;
  background: linear-gradient(165deg, #121b2b 0%, #090e18 100%);
  border: 1px solid rgba(0, 230, 118, 0.3);
  border-radius: 22px;
  padding: 24px 20px;
  text-align: center;
  color: #f8fafc;
  box-shadow:
    0 22px 48px rgba(0, 0, 0, 0.7),
    0 0 30px rgba(0, 230, 118, 0.1);
  animation: securityFloatIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}

/* Ikon plak sekirite a */
#floating-security-tip .sec-icon-shield {
  width: 60px;
  height: 60px;
  margin: 0 auto 14px auto;
  border-radius: 50%;
  background: rgba(0, 230, 118, 0.14);
  border: 1px solid rgba(0, 230, 118, 0.45);
  color: #00e676;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: shieldPulse 2.4s ease-in-out infinite;
}

/* Tit */
#floating-security-tip .security-card h3 {
  margin: 0 0 10px 0;
  font-size: 18px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: 0.2px;
}

/* Tèks konsèy la */
#floating-security-tip .security-card p {
  margin: 0 0 20px 0;
  font-size: 13px;
  line-height: 1.6;
  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 14px;
  padding: 12px 14px;
}

#floating-security-tip .security-card p b {
  color: #fbbf24;
}

/* Bouton D'accord (OK) */
#floating-security-tip .ok-tip-btn {
  width: 100%;
  background: linear-gradient(135deg, #00e676 0%, #00b85c 100%);
  color: #04120b;
  border: none;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 0.3px;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 230, 118, 0.28);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

#floating-security-tip .ok-tip-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(0, 230, 118, 0.4);
  filter: brightness(1.05);
}

#floating-security-tip .ok-tip-btn:active {
  transform: translateY(0);
}

@media (prefers-reduced-motion: reduce) {
  #floating-security-tip .security-card,
  #floating-security-tip .sec-icon-shield,
  #floating-security-tip .ok-tip-btn {
    animation: none !important;
    transition: none !important;
  }
}
