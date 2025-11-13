import React, { useCallback, useMemo } from "react";
import Layout from "../components/Layout.jsx";
import { Card, Button, SectionTitle } from "@silvertrails/ui";
import { useLocale } from "../contexts/LocaleContext.jsx";
import { t } from "../i18n/index.js";

export default function Social() {
    const { locale } = useLocale();

    const inviteMessages = useMemo(
        () => ({
            title: t("social.invite.title", {}, { locale }),
            subtitle: t("social.invite.subtitle", {}, { locale }),
            cta: t("social.invite.cta", {}, { locale }),
        }),
        [locale]
    );

    const groupEntries = useMemo(() => t("social.group.entries", {}, { locale }), [locale]);
    const groupTitle = useMemo(() => t("social.group.title", {}, { locale }), [locale]);

    const messageBoard = useMemo(
        () => ({
            title: t("social.messageBoard.title", {}, { locale }),
            cta: t("social.messageBoard.cta", {}, { locale }),
            entries: t("social.messageBoard.entries", {}, { locale }),
        }),
        [locale]
    );

    const handleInvite = useCallback(async () => {
        const link = `${window.location.origin}/login?ref=friend`;
        try {
            if (navigator?.clipboard?.writeText) {
                await navigator.clipboard.writeText(link);
                alert(t("social.invite.copied", {}, { locale }));
            } else {
                throw new Error("clipboard_unavailable");
            }
        } catch (err) {
            alert(t("social.invite.copyFallback", { link }, { locale }));
        }
    }, [locale]);

    return (
        <Layout title={t("social.pageTitle")}>
            <Card className="mb-4">
                <SectionTitle title={inviteMessages.title} subtitle={inviteMessages.subtitle} />
                <Button onClick={handleInvite}>{inviteMessages.cta}</Button>
            </Card>

            <SectionTitle title={groupTitle} />
            <Card className="mb-4">
                <ul className="space-y-2">
                    {Array.isArray(groupEntries) &&
                        groupEntries.map((entry) => (
                            <li key={entry.name} className="flex items-center justify-between">
                                <span className="font-medium">{entry.name}</span>
                                <span className="text-sm text-teal-700 font-semibold">{entry.points}</span>
                            </li>
                        ))}
                </ul>
            </Card>

            <SectionTitle title={messageBoard.title} />

            <Card className="p-4">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">{messageBoard.title}</h3>
                    <button className="bg-teal-400 hover:bg-cyan-400 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition">
                        💬 {messageBoard.cta}
                    </button>
                </div>

                <div className="space-y-3">
                    {Array.isArray(messageBoard.entries) &&
                        messageBoard.entries.map((message, index) => (
                            <div
                                key={`${message.name}-${index}`}
                                className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl shadow-sm"
                            >
                                <div className="text-3xl">{message.avatar}</div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-gray-800">{message.name}</span>
                                        <span className="text-gray-500 text-sm">{message.time}</span>
                                    </div>
                                    <p className="text-gray-700 mt-1">{message.message}</p>
                                </div>
                            </div>
                        ))}
                </div>
            </Card>
        </Layout>
    );
}
