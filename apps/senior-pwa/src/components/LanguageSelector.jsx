"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useLocale } from "../contexts/LocaleContext.jsx";
import { t } from "../i18n/index.js";

const VARIANT_STYLES = {
  pill: "flex items-center gap-2 rounded-xl bg-white/80 text-cyan-700 px-3 py-1 text-sm font-medium shadow-sm border border-white/70",
  compact:
    "flex items-center gap-2 rounded-lg border border-white/40 text-white/90 px-2 py-1 text-xs font-medium",
};

export default function LanguageSelector({ variant = "pill", className = "" }) {
  const { locale, availableLocales, setLocale } = useLocale();

  return (
    <label
      className={`${VARIANT_STYLES[variant] ?? VARIANT_STYLES.pill} ${className}`}
    >
      <Globe className="w-4 h-4" />
      <span className="sr-only">{t("layout.languageLabel")}</span>
      <select
        value={locale}
        onChange={(event) => setLocale(event.target.value)}
        className="bg-transparent border-none focus:outline-none text-current"
        aria-label={t("layout.languageLabel")}
      >
        {availableLocales.map((entry) => (
          <option key={entry.code} value={entry.code} className="text-gray-900">
            {entry.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
