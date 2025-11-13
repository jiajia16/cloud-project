"use client";

const messages = {
  en: {
    common: {
      dateTbc: "Date TBC",
      pending: "Pending",
      errors: {
        generic: "Something went wrong. Please try again.",
        organisationsLoad: "Unable to load organisations right now.",
        trailsLoad: "Unable to load your trail information.",
        invitePreview: "Unable to preview invite.",
        invitePreviewRequired: "Preview the invite before joining.",
        inviteJoin: "Unable to join with this invite.",
        inviteGeneric: "We couldn't join you with this invite.",
        joinOrganisation: "Unable to join this organisation right now.",
        rewardsLoad: "Unable to load your rewards at the moment.",
        redeemJoinOrg: "Join an organisation to redeem rewards.",
        redeemFailure: "Unable to redeem this reward right now.",
      },
      success: {
        inviteRegistered: "You're registered for {title}!",
      },
      labels: {
        dateRange: "{start} → {end}",
      },
    },
    home: {
      invite: {
        fallbackTitle: "the activity",
        acceptedGeneric: "Invite accepted! You're all set.",
        processError: "We couldn't process your invite.",
        scannedError: "We couldn't process the invite you scanned earlier.",
        alreadyRegisteredWithTitle: "You're already registered for {title}.",
        alreadyRegisteredGeneric: "You're already registered for this activity.",
      },
      sections: {
        highlightsTitle: "Community Highlights",
      },
      highlights: {
        taiChi: {
          title: "Seniors Tai Chi",
          subtitle: "Morning Tai Chi",
          description: "Join Uncle Lim and friends every Tuesday",
        },
        cooking: {
          title: "Cooking Class",
          subtitle: "Cooking Workshop",
          description: "Learn traditional recipes together",
        },
        garden: {
          title: "Garden Club",
          subtitle: "Garden Club",
          description: "Grow herbs and vegetables together",
        },
      },
    },
    rewards: {
      sections: {
        redeemable: "Redeemable Rewards",
        history: "Redemption history",
        pointsHistory: "Points history",
      },
      success: {
        voucher: "{name} redeemed successfully!",
      },
      labels: {
        voucherFallback: "Voucher",
        loading: "Loading rewards…",
        noVouchers: "No rewards available right now. Check back later!",
        lastUpdated: "Last updated {datetime}",
        redeemedAt: "Redeemed at {datetime}",
        noHistory: "You haven't redeemed any rewards yet.",
        redeeming: "Redeeming...",
        redeem: "Redeem",
        qtyClaimed: "{count}/{total} claimed",
      },
    },
  },
};

const localeMap = {
  en: "en-SG",
};

let currentLocale = "en";

function resolveMessage(key, locale = currentLocale) {
  const parts = key.split(".");
  let pointer = messages[locale] || messages.en;
  for (const part of parts) {
    if (pointer && typeof pointer === "object" && part in pointer) {
      pointer = pointer[part];
    } else {
      return undefined;
    }
  }
  return pointer;
}

function formatTemplate(template, replacements = {}) {
  if (typeof template !== "string") {
    return template;
  }
  return template.replace(/\{(\w+)\}/g, (_, token) => {
    if (token in replacements) {
      return replacements[token];
    }
    return `{${token}}`;
  });
}

export function setLocale(locale) {
  if (messages[locale]) {
    currentLocale = locale;
  }
}

export function getLocale() {
  return currentLocale;
}

export function t(key, replacements = {}, options = {}) {
  const locale = options.locale ?? currentLocale;
  const template = resolveMessage(key, locale) ?? resolveMessage(key, "en") ?? key;
  if (typeof template === "string") {
    return formatTemplate(template, replacements);
  }
  return template;
}

function formatWithIntl(value, formatterOptions, fallbackKey) {
  if (!value) {
    return fallbackKey ? t(fallbackKey) : "";
  }
  try {
    const localeTag = localeMap[currentLocale] ?? currentLocale;
    const formatter = new Intl.DateTimeFormat(localeTag, formatterOptions);
    return formatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

export function formatDate(value, options = {}) {
  const { fallbackKey = "common.dateTbc", ...fmtOptions } = options;
  return formatWithIntl(value, { dateStyle: "medium", ...fmtOptions }, fallbackKey);
}

export function formatDateTime(value, options = {}) {
  const { fallbackKey = "common.dateTbc", ...fmtOptions } = options;
  return formatWithIntl(
    value,
    { dateStyle: "medium", timeStyle: "short", ...fmtOptions },
    fallbackKey,
  );
}
