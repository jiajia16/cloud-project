"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  AVAILABLE_LOCALES,
  initLocale,
  setLocale as setI18nLocale,
} from "../i18n/index.js";

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => initLocale());

  const updateLocale = useCallback((nextLocale) => {
    setI18nLocale(nextLocale);
    setLocale(nextLocale);
  }, []);

  const value = useMemo(
    () => ({
      locale,
      availableLocales: AVAILABLE_LOCALES,
      setLocale: updateLocale,
    }),
    [locale, updateLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
