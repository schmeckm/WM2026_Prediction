<template>
  <div class="team-pitch-referee-wrap" aria-hidden="true">
    <svg
      class="team-pitch-referee"
      viewBox="0 0 160 220"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <ellipse class="ref-shadow" cx="80" cy="208" rx="36" ry="7" fill="currentColor" opacity="0.14" />

      <g class="ref-body">
        <!-- shoes -->
        <path d="M58 188 L52 204 L68 204 L70 188 Z" fill="#111827" />
        <path d="M90 188 L88 204 L104 204 L98 188 Z" fill="#111827" />
        <rect x="50" y="200" width="20" height="6" rx="2" fill="#0f172a" />
        <rect x="86" y="200" width="20" height="6" rx="2" fill="#0f172a" />

        <!-- socks -->
        <path d="M58 168 L56 188 L70 188 L72 168 Z" fill="#f8fafc" />
        <path d="M88 168 L86 188 L100 188 L102 168 Z" fill="#f8fafc" />
        <rect x="56" y="166" width="16" height="5" rx="1" fill="#fbbf24" />
        <rect x="86" y="166" width="16" height="5" rx="1" fill="#fbbf24" />

        <!-- shorts -->
        <path d="M54 142 Q80 152 106 142 L110 168 L50 168 Z" fill="#111827" />

        <!-- shirt -->
        <path d="M48 88 Q80 80 112 88 L116 142 L44 142 Z" fill="#111827" />
        <rect x="44" y="98" width="72" height="7" rx="1" fill="#fbbf24" />
        <rect x="44" y="118" width="72" height="7" rx="1" fill="#fbbf24" />

        <!-- RTE badge -->
        <rect x="62" y="106" width="36" height="18" rx="4" fill="#00ff7f" />
        <text
          x="80"
          y="119"
          text-anchor="middle"
          font-family="system-ui, Segoe UI, sans-serif"
          font-size="11"
          font-weight="800"
          fill="#0a0a0a"
          letter-spacing="0.8"
        >RTE</text>

        <!-- card in pocket -->
        <rect x="102" y="128" width="10" height="14" rx="1.5" fill="#ef4444" opacity="0.9" />
        <rect x="104" y="130" width="10" height="14" rx="1.5" fill="#fbbf24" opacity="0.85" transform="rotate(-8 104 130)" />

        <!-- left arm + flag -->
        <g class="ref-arm ref-arm--flag">
          <path d="M48 92 Q28 78 22 52 Q20 46 26 44 Q32 50 38 68 Q42 82 48 92" fill="#fcd9b6" stroke="#1e293b" stroke-width="1.5" />
          <line x1="24" y1="48" x2="24" y2="88" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" />
          <path d="M24 48 L24 88 L8 72 Z" fill="#00ff7f" opacity="0.95" />
          <path d="M24 48 L24 88 L40 72 Z" fill="#fbbf24" opacity="0.95" />
        </g>

        <!-- right arm + whistle -->
        <g class="ref-arm ref-arm--whistle">
          <path d="M112 92 Q132 78 138 58 Q140 50 134 48 Q128 54 122 72 Q116 86 112 92" fill="#fcd9b6" stroke="#1e293b" stroke-width="1.5" />
          <circle cx="136" cy="56" r="5" fill="#e2e8f0" stroke="#64748b" stroke-width="1.2" />
          <path d="M136 61 L136 68" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
          <path d="M134 68 Q136 74 140 76" stroke="#64748b" stroke-width="1.5" fill="none" />
        </g>

        <!-- neck -->
        <rect x="72" y="72" width="16" height="14" rx="4" fill="#fcd9b6" />

        <!-- head -->
        <circle cx="80" cy="54" r="22" fill="#fcd9b6" />
        <path d="M58 48 Q62 28 80 24 Q98 28 102 48 Q94 36 80 32 Q66 36 58 48" fill="#1e293b" />

        <!-- ref cap -->
        <path d="M58 38 Q80 28 102 38 L104 44 Q80 36 56 44 Z" fill="#111827" />
        <path d="M54 44 Q80 48 106 44 L108 48 Q80 52 52 48 Z" fill="#111827" />

        <!-- face -->
        <circle cx="72" cy="54" r="2.8" fill="#1e293b" />
        <circle cx="88" cy="54" r="2.8" fill="#1e293b" />
        <path d="M73 62 Q80 67 87 62" stroke="#1e293b" stroke-width="2" fill="none" stroke-linecap="round" />

        <!-- whistle in mouth area hint -->
        <ellipse cx="92" cy="60" rx="4" ry="2.5" fill="#cbd5e1" stroke="#64748b" stroke-width="0.8" />
      </g>
    </svg>
  </div>
</template>

<style scoped>
.team-pitch-referee-wrap {
  flex-shrink: 0;
  transform-origin: center bottom;
  animation: ref-dance 2.8s ease-in-out infinite;
}

.team-pitch-referee {
  display: block;
  width: 118px;
  height: auto;
  color: var(--color-text);
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.28));
}

.ref-arm--flag {
  transform-origin: 48px 92px;
  animation: ref-flag-wave 1.6s ease-in-out infinite;
}

.ref-arm--whistle {
  transform-origin: 112px 92px;
  animation: ref-whistle-tap 2.8s ease-in-out infinite;
}

@keyframes ref-dance {
  0%, 100% { transform: translateY(0) rotate(-1.5deg); }
  25% { transform: translateY(-6px) rotate(2deg); }
  50% { transform: translateY(-3px) rotate(-0.5deg); }
  75% { transform: translateY(-7px) rotate(2.5deg); }
}

@keyframes ref-flag-wave {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-8deg); }
}

@keyframes ref-whistle-tap {
  0%, 70%, 100% { transform: rotate(0deg); }
  80% { transform: rotate(6deg); }
  90% { transform: rotate(-2deg); }
}

@media (max-width: 480px) {
  .team-pitch-referee {
    width: 88px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-pitch-referee-wrap,
  .ref-arm--flag,
  .ref-arm--whistle {
    animation: none;
  }
}
</style>
