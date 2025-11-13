import React, { useMemo } from "react";
import { BottomNav } from "../../../../packages/ui/lib/BottomNav";
import LanguageSelector from "./LanguageSelector.jsx";
import { t } from "../i18n/index.js";
import { useLocale } from "../contexts/LocaleContext.jsx";

export default function Layout({ children, title }) {
    const { locale } = useLocale();
    const resolvedTitle = title ?? t("common.appName");

    const navLabels = useMemo(
        () => ({
            home: t("nav.home"),
            myTrails: t("nav.myTrails"),
            scan: t("nav.scan"),
            leaderboard: t("nav.leaderboard"),
            rewards: t("nav.rewards"),
            community: t("nav.community"),
        }),
        [locale],
    );

    return (
        <div className="min-h-[100svh] bg-gray-50 pb-20">
            <header className="sticky top-0 z-40 bg-gradient-to-r from-teal-400 to-cyan-400 text-white p-4">
                <div className="max-w-screen-sm mx-auto flex items-center justify-between gap-3">
                    <h1 className="text-2xl font-bold">{resolvedTitle}</h1>
                    <LanguageSelector variant="compact" />
                </div>
            </header>

            <main className="max-w-screen-sm mx-auto p-4">{children}</main>

            <BottomNav labels={navLabels} />
        </div>
    );
}
