"use client";

const LOCALE_STORAGE_KEY = "silvertrails:locale";
const DEFAULT_LOCALE = "en";

export const AVAILABLE_LOCALES = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ms", label: "Malay", nativeLabel: "Bahasa Melayu" },
  { code: "ta", label: "Tamil", nativeLabel: "தமிழ்" },
];

const localeMap = {
  en: "en-SG",
  zh: "zh-SG",
  ms: "ms-SG",
  ta: "ta-SG",
};

const enMessages = {
  common: {
    appName: "SilverTrails",
    friend: "Friend",
    dateTbc: "Date TBC",
    pending: "Pending",
    actions: {
      logout: "Log out",
      back: "Back",
      refresh: "Refresh",
    },
    labels: {
      dateRange: "{start} → {end}",
      locationTbc: "Location TBC",
      toBeConfirmed: "To be confirmed",
    },
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
      inviteSignIn: "Sign in to use an invite code.",
      inviteRequired: "Enter an invite code first.",
      selectOrganisation: "Select an organisation first.",
      reauth: "Sign in again to continue.",
    },
    success: {
      inviteRegistered: "You're registered for {title}!",
    },
  },
  layout: {
    languageLabel: "Language",
  },
  nav: {
    home: "Home",
    myTrails: "My Trails",
    scan: "Scan",
    leaderboard: "Leaderboard",
    rewards: "Rewards",
    community: "Community",
  },
  home: {
    profile: {
      comingSoon: "Profile screen coming soon!",
    },
    pendingOrg: {
      title: "Almost there!",
      description:
        "You haven't joined an organisation yet. Pick one below to start registering for activities immediately, or ask an organiser to send you an invite.",
      selectLabel: "Choose organisation",
      selectPlaceholder: "Select organisation",
      cta: "Join organisation",
      joining: "Joining...",
      success: "Joined successfully! Updating your dashboard.",
    },
    hero: {
      title: "Welcome back, {name}!",
      subtitle: "Ready for another wonderful day of activities?",
    },
    progress: {
      title: "Your Progress",
      summary: "{confirmed} / {total} activities confirmed",
      note: "Includes activities you have registered for.",
    },
    links: {
      myTrails: {
        title: "My Trails",
        description: "Continue your learning journey",
      },
      leaderboard: {
        title: "Leaderboard",
        description: "See how you rank with friends",
      },
      rewards: {
        title: "Rewards",
        description: "Claim your earned rewards",
      },
      upcoming: {
        title: "Upcoming Events",
        description: "Join community activities",
      },
      upcomingComingSoon: "This feature is coming soon!",
    },
    invite: {
      fallbackTitle: "the activity",
      acceptedGeneric: "Invite accepted! You're all set.",
      processError: "We couldn't process your invite.",
      scannedError: "We couldn't process the invite you scanned earlier.",
      alreadyRegisteredWithTitle: "You're already registered for {title}.",
      alreadyRegisteredGeneric: "You're already registered for this activity.",
      sectionTitle: "Have an invite code?",
      sectionSubtitle: "Enter the code your organiser shared to join an activity instantly.",
      placeholder: "Enter invite code",
      previewLoading: "Checking...",
      previewCta: "Preview",
      joining: "Joining...",
      joinCta: "Join",
      descriptionFallback: "Join this community activity.",
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
    upcoming: {
      title: "Upcoming Trails",
      loading: "Loading upcoming activities...",
      empty: "You are all caught up. New activities will appear here once available.",
      descriptionFallback: "Join this community activity.",
      viewDetails: "View details →",
    },
    daily: {
      title: "Daily Motivation",
      body: "Keep moving! Confirmed activities count towards your community leaderboard.",
      cta: "Learn More",
    },
  },
  join: {
    back: {
      dashboard: "Back to dashboard",
      login: "Back to login",
    },
    heading: {
      title: "Scan invite QR",
      subtitle:
        "Use your camera to join an activity instantly. We'll remember the invite if you need to sign in first.",
    },
    cameraNotice: "We only access your camera to read QR codes. No photos are stored.",
    manual: {
      label: "Invite link or code",
      placeholder: "Scan or paste the invite link",
      submit: "Preview invite",
      checking: "Checking invite...",
    },
    errors: {
      unreadable: "We couldn't read the invite. Please try again.",
      invalid:
        "That code isn't a valid invite. If you're trying to check in, open the Scan page instead.",
      authRequired: "Sign in first so we can add you to the activity.",
      previewRequired: "Scan an invite and preview it before joining.",
      joinFailure: "We couldn't join you with this invite.",
      inviteMissing: "Scan or enter an invite code first.",
    },
    success: {
      joined: "You're in! We'll update your trails shortly.",
      viewTrails: "View my trails",
      goDashboard: "Go to dashboard",
    },
    details: {
      starts: "Starts",
      ends: "Ends",
      location: "Location",
    },
    actions: {
      join: "Join this activity",
      joining: "Joining...",
      signup: "Sign up to join",
      login: "Log in to join",
    },
    remember: "We'll remember this invite and finish registration after you sign in.",
  },
  scan: {
    pendingOrg: {
      title: "Join an organisation first",
      description:
        "Join an organisation before scanning check-in codes. Enter an invite or pick one from your dashboard.",
    },
    actions: {
      enterInvite: "Enter invite code",
      backHome: "Back to dashboard",
      viewTrails: "View my trails",
      scanAgain: "Scan another code",
      scanAgainShort: "Scan again",
      history: "View recent history",
      redeem: "Check rewards",
      chooseImage: "Choose image",
      submitCode: "Submit code",
    },
    errors: {
      history: "Unable to load your recent check-ins.",
      readFailed: "We couldn't read that code. Please try again.",
      requireSignInInvite: "Sign in to accept this invite.",
      inviteProcess: "We couldn't process this invite.",
      requireSignInScan: "Sign in before checking in.",
      requireOrg: "Join an organisation to check in.",
      checkinFailed: "We couldn't record this check-in.",
      noTokenImage: "We couldn't find a QR code in that image.",
      imageDecode: "We couldn't read that image. Try a clearer photo.",
      manualInvalid: "That doesn't look like a valid code.",
    },
    invite: {
      acceptedTitle: "Invite accepted!",
      alreadyTitle: "You're already registered",
      schedule: "Schedule",
      successDescription: "You're all set. We'll update your activities shortly.",
      alreadyDescription: "Looks like you're already registered. Enjoy the activity!",
    },
    success: {
      title: "Check-in successful!",
    },
    details: {
      activityLabel: "Activity",
      activityStep: "Step {order}",
      trailLabel: "Trail",
      orgLabel: "Organisation",
      methodLabel: "Method",
    },
    status: {
      repeat: "You've already checked in for this activity.",
      pointsAwarded: "Points added to your total.",
      pending: "We'll confirm your points soon.",
      recorded: "Check-in recorded successfully.",
    },
    points: {
      label: "Points earned",
      instant: "Points added instantly",
      already: "Already collected",
      none: "No points this time",
      pending: "Pending confirmation",
    },
    scanner: {
      title: "Scan QR to mark activity",
      description:
        "Hold your device steady and position the QR code inside the frame. We'll record your check-in automatically.",
      uploadTitle: "Upload a QR code image",
      uploadDescription:
        "PNG or JPG works best. We'll read the code and submit automatically.",
      processing: "Processing your code...",
      manualTitle: "Enter code manually",
      manualDescription: "Paste the token or QR link if your camera is unavailable.",
      manualPlaceholder: "e.g. /checkin/scan?token=...",
    },
    history: {
      title: "Recent check-ins",
      empty: "You have not checked in to any trails yet. Scan a QR code to get started!",
      trailLabel: "Trail {id}",
    },
  },
  leaderboard: {
    pageTitle: "Leaderboard",
    signInPrompt: "Sign in to view leaderboards.",
    tabs: {
      system: "Community",
      org: "My Organisation",
    },
    entries: {
      you: "You",
      participantLabel: "Participant {id}",
    },
    org: {
      unknown: "Organisation",
      label: "Org {id}",
      noOrgMessage: "Join an organisation to view its leaderboard.",
      currentLabel: "Current organisation",
      switchLabel: "Switch organisation",
    },
    blocks: {
      title: "Top 50",
      loading: "Loading leaderboard...",
      rank: "Rank #{rank}",
      refreshing: "Refreshing...",
      refresh: "Refresh",
      keepGoing: "Keep going! You're currently ranked #{rank}.",
      emptyOrg: "No leaderboard entries for this organisation yet.",
      emptySystem: "No community leaderboard entries yet.",
    },
    errors: {
      systemLoad: "Unable to load community leaderboard.",
      orgLoad: "Unable to load organisation leaderboard.",
    },
  },
  social: {
    pageTitle: "Community",
    invite: {
      title: "Invite a Friend",
      subtitle: "Join activities together for bonus points",
      cta: "Share Invite Link",
      copied: "Invite link copied! Share it with family or friends.",
      copyFallback: "Unable to copy automatically. Share this link manually: {link}",
    },
    group: {
      title: "My Group",
      entries: [
        { name: "Auntie Mei", points: "+10 pts today" },
        { name: "Uncle Lim", points: "+8 pts today" },
        { name: "Mdm Tan", points: "+6 pts today" },
      ],
    },
    messageBoard: {
      title: "Message Board",
      cta: "Send Message",
      entries: [
        {
          name: "Uncle Lim",
          time: "2 hours ago",
          message: "Great job on the Tai Chi class! 👍",
          avatar: "🧓",
        },
        {
          name: "Auntie Chen",
          time: "1 day ago",
          message: "Keep it up everyone! 🖤",
          avatar: "👩‍🦳",
        },
        {
          name: "David (Son)",
          time: "2 days ago",
          message: "So proud of you Mom! 🎉",
          avatar: "👨‍🦱",
        },
      ],
    },
  },
  rewards: {
    pageTitle: "Rewards",
    onboarding: {
      title: "Complete onboarding to unlock rewards",
      description:
        "Rewards, vouchers, and point balances become available once your organiser assigns you to an organisation. Use the invite code they share with you or ask them to add you from the organiser dashboard.",
    },
    actions: {
      enterInvite: "Enter invite code",
      backHome: "Back to Home",
    },
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
      loading: "Loading rewards...",
      noVouchers: "No rewards available right now. Check back later!",
      lastUpdated: "Last updated {datetime}",
      redeemedAt: "Redeemed at {datetime}",
      noHistory: "No point activity recorded for this organisation yet.",
      redeeming: "Redeeming...",
      redeem: "Redeem",
      qtyClaimed: "{count}/{total} claimed",
      availablePoints: "Available points",
      organisation: "Organisation",
      pendingAssignment:
        "You have not been added to an organisation yet. Ask your organiser for an invite or use the Join page to enter a code so you can start collecting rewards.",
      loadingHistory: "Loading your points history...",
      loadingRedemptions: "Loading your redemptions...",
      noRedemptions: "You haven't redeemed any rewards yet.",
    },
    messages: {
      presentCode: "Present this code to the organiser:",
      contextWithDate: "{context} - {date}",
    },
    vouchers: {
      cost: "Cost: {points}",
      status: {
        active: "Available",
        inactive: "Inactive",
        expired: "Expired",
        scheduled: "Scheduled",
        outOfStock: "Out of stock",
        unknown: "{status}",
      },
    },
    history: {
      reason: {
        activityCheckin: "Activity Check-In",
        trailCheckin: "Trail Check-In",
        manualBonus: "Manual Bonus",
        voucherRedeem: "Voucher Redemption",
      },
      note: {
        qr: "QR",
      },
    },
    redemptions: {
      pointsUsed: "Points used: {points}",
      code: "Code: {code}",
      status: {
        pending: "Pending",
        completed: "Completed",
        redeemed: "Redeemed",
        fulfilled: "Fulfilled",
        cancelled: "Cancelled",
        rejected: "Rejected",
        approved: "Approved",
        generic: "{status}",
      },
      voucherFallback: "Voucher {code}",
      voucherIdFallback: "Voucher {id}",
    },
  },
  myTrails: {
    pageTitle: "My Trails",
    hero: {
      title: "My Trails",
      description: "Track your upcoming activities and view your progress.",
      progressSummary: "{confirmed} of {total} activities confirmed ({percent}%)",
    },
    actions: {
      scan: "Scan QR to mark activity done",
      viewDetails: "View details",
      details: "Details",
      join: "Join trail",
      joining: "Joining...",
    },
    sections: {
      registered: "Registered Activities",
      attendance: "Attendance History",
      available: "Available Trails to Join",
      confirmed: "Confirmed Trails",
    },
    status: {
      pending: "Pending approval",
      approved: "Approved",
      confirmed: "Confirmed",
      rejected: "Rejected",
      cancelled: "Cancelled",
      waitlisted: "Waitlisted",
    },
    errors: {
      load: "Failed to load your trails.",
      register: "Unable to join trail. Please try again.",
    },
    messages: {
      loadingRegistered: "Loading your activities...",
      noRegistrations: "You have not joined any trails yet. Explore the available activities below!",
      trailDescriptionFallback: "Stay tuned for more details.",
      registrationNote: "Your note: {note}",
      loadingAttendance: "Loading your attendance...",
      noAttendance: "No organiser-confirmed attendance recorded yet. Scan a QR code and check back!",
      loadingAvailable: "Loading available trails...",
      noAvailable: "No new trails at the moment - check back soon!",
      availableDescription: "Discover a new activity with friends.",
    },
    labels: {
      trailFallback: "Trail",
      trailWithIdFallback: "Trail {id}",
    },
    attendance: {
      orgLabel: "Org {org}",
    },
    available: {
      capacityStatus: "Capacity: {capacity} | Status: {status}",
      capacityUnknown: "TBC",
      status: {
        open: "Open",
        active: "Active",
        closed: "Closed",
        cancelled: "Cancelled",
        draft: "Draft",
        full: "Full",
        upcoming: "Upcoming",
        unknown: "{status}",
      },
    },
    detail: {
      title: "Trail Details",
      back: "Back to My Trails",
      loading: "Loading trail details...",
      errors: {
        load: "Unable to load trail information.",
      },
      info: {
        capacity: "Capacity: {capacity}",
        status: "Status: {status}",
      },
      registration: {
        heading: "Registration status:",
        cancel: "Cancel registration",
        cancelling: "Cancelling...",
        cancelError: "Unable to cancel this registration. Please try again.",
        noCancel: "This registration can no longer be cancelled.",
        descriptions: {
          pending: "Your spot is awaiting organiser approval.",
          approved: "Approved - organiser still needs to confirm your slot.",
          confirmed: "You are confirmed. Remember to attend on time.",
          rejected: "Unfortunately this registration was rejected.",
          cancelled: "You have cancelled this registration.",
          waitlisted: "Currently waitlisted - you will be moved up when slots free up.",
          generic: "We will notify you when there is an update.",
        },
      },
      callToAction: {
        prompt: "You have not joined this trail yet. Secure your spot now.",
        join: "Join this trail",
        joining: "Joining...",
      },
    },
  },
  "Please enter your NRIC and 8-digit passcode.": "Please enter your NRIC and 8-digit passcode.",
  "Unable to log in. Please try again.": "Unable to log in. Please try again.",
  "Welcome to SilverTrails": "Welcome to SilverTrails",
  "NRIC / Identifier": "NRIC / Identifier",
  "e.g. S1234567A": "e.g. S1234567A",
  "Passcode (8-digit)": "Passcode (8-digit)",
  DDMMYYYY: "DDMMYYYY",
  "Signing in...": "Signing in...",
  Login: "Login",
  "Not a member?": "Not a member?",
  "Sign up": "Sign up",
  "Have a QR invite?": "Have a QR invite?",
  "Scan to join": "Scan to join",
  "Please enter your full name.": "Please enter your full name.",
  "Please enter your NRIC.": "Please enter your NRIC.",
  "Passcode must be 8 digits (DDMMYYYY).": "Passcode must be 8 digits (DDMMYYYY).",
  "Passcodes do not match.": "Passcodes do not match.",
  "Unable to sign up. Please try again.": "Unable to sign up. Please try again.",
  "Welcome aboard!": "Welcome aboard!",
  "{name}, your SilverTrails account was created successfully.":
    "{name}, your SilverTrails account was created successfully.",
  "Your SilverTrails account was created successfully.":
    "Your SilverTrails account was created successfully.",
  "You can now explore your trails, scan QR codes for activities, and collect rewards.":
    "You can now explore your trails, scan QR codes for activities, and collect rewards.",
  "Go to my dashboard": "Go to my dashboard",
  "Create your account": "Create your account",
  "Full name": "Full name",
  "e.g. Auntie Mei": "e.g. Auntie Mei",
  "Confirm passcode": "Confirm passcode",
  "Re-enter passcode": "Re-enter passcode",
  "We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.":
    "We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.",
  "Creating account...": "Creating account...",
  "Already have an account?": "Already have an account?",
  "Log in": "Log in",
  "Received an invite QR?": "Received an invite QR?",
  "Scan to join first": "Scan to join first",
};

const zhMessages = {
  common: {
    appName: "SilverTrails",
    friend: "朋友",
    dateTbc: "日期待定",
    pending: "待处理",
    actions: {
      logout: "登出",
      back: "返回",
      refresh: "刷新",
    },
    labels: {
      dateRange: "{start} 至 {end}",
      locationTbc: "地点待定",
      toBeConfirmed: "待确认",
    },
    errors: {
      generic: "出了点问题，请稍后再试。",
      organisationsLoad: "目前无法载入机构资讯。",
      trailsLoad: "目前无法载入您的活动资料。",
      invitePreview: "无法预览邀请码。",
      invitePreviewRequired: "加入前请先预览邀请码。",
      inviteJoin: "目前无法使用此邀请码加入。",
      inviteGeneric: "我们无法用此邀请码为您报名。",
      joinOrganisation: "目前无法加入该组织。",
      rewardsLoad: "暂时无法载入您的奖励。",
      redeemJoinOrg: "加入组织后即可兑换奖励。",
      redeemFailure: "暂时无法兑换此奖励。",
      inviteSignIn: "请先登入再使用邀请码。",
      inviteRequired: "请先输入邀请码。",
      selectOrganisation: "请先选择组织。",
      reauth: "请重新登入后再试。",
    },
    success: {
      inviteRegistered: "您已成功报名 {title}！",
    },
  },
  layout: {
    languageLabel: "语言",
  },
  nav: {
    home: "首页",
    myTrails: "我的行程",
    scan: "扫描",
    leaderboard: "排行榜",
    rewards: "奖励",
    community: "社区",
  },
  home: {
    profile: {
      comingSoon: "个人资料页即将推出！",
    },
    pendingOrg: {
      title: "只差一步！",
      description:
        "您尚未加入任何组织。请选择下方的组织即可马上报名活动，或请主办单位把邀请传给您。",
      selectLabel: "选择组织",
      selectPlaceholder: "请选择组织",
      cta: "加入组织",
      joining: "正在加入...",
      success: "加入成功！我们正在更新您的面板。",
    },
    hero: {
      title: "欢迎回来，{name}！",
      subtitle: "准备好迎接美好的一天了吗？",
    },
    progress: {
      title: "您的进度",
      summary: "{confirmed}/{total} 个活动已确认",
      note: "包含您已报名的所有活动。",
    },
    links: {
      myTrails: {
        title: "我的行程",
        description: "继续您的学习旅程",
      },
      leaderboard: {
        title: "排行榜",
        description: "看看自己在朋友中的排名",
      },
      rewards: {
        title: "奖励",
        description: "兑换您累积的奖励",
      },
      upcoming: {
        title: "即将到来的活动",
        description: "参与社区活动",
      },
      upcomingComingSoon: "此功能即将推出！",
    },
    invite: {
      fallbackTitle: "该活动",
      acceptedGeneric: "邀请码已接受！一切就绪。",
      processError: "邀请码处理失败。",
      scannedError: "我们无法处理您稍早扫描的邀请码。",
      alreadyRegisteredWithTitle: "您已经报名 {title}。",
      alreadyRegisteredGeneric: "您已经报名此活动。",
      sectionTitle: "有邀请码吗？",
      sectionSubtitle: "输入主办单位提供的邀请码即可马上报名。",
      placeholder: "输入邀请码",
      previewLoading: "正在检查...",
      previewCta: "预览",
      joining: "正在加入...",
      joinCta: "加入",
      descriptionFallback: "加入这个社区活动。",
    },
    sections: {
      highlightsTitle: "社区亮点",
    },
    highlights: {
      taiChi: {
        title: "乐龄太极",
        subtitle: "清晨太极",
        description: "每周二与林叔叔和朋友们一起练太极",
      },
      cooking: {
        title: "烹饪班",
        subtitle: "烹饪工作坊",
        description: "一起学习传统菜谱",
      },
      garden: {
        title: "园艺社",
        subtitle: "园艺社",
        description: "一起种植香草与蔬菜",
      },
    },
    upcoming: {
      title: "即将开始的活动",
      loading: "正在载入活动...",
      empty: "目前没有新的活动，一旦有新的活动会出现在这里。",
      descriptionFallback: "加入这个社区活动。",
      viewDetails: "查看详情 →",
    },
    daily: {
      title: "每日鼓励",
      body: "持续动起来！已确认的活动会计入社区排行榜。",
      cta: "了解更多",
    },
  },
  join: {
    back: {
      dashboard: "返回仪表板",
      login: "返回登入",
    },
    heading: {
      title: "扫描邀请二维码",
      subtitle: "使用相机立即加入活动。如果需要先登入，我们会记住这张邀请。",
    },
    cameraNotice: "我们只使用您的相机读取二维码，不会保存任何照片。",
    manual: {
      label: "邀请链接或代码",
      placeholder: "扫描或贴上邀请链接",
      submit: "预览邀请",
      checking: "正在检查邀请...",
    },
    errors: {
      unreadable: "无法读取邀请，请再试一次。",
      invalid: "此代码不是有效的邀请。如果要签到，请改用“扫描”页面。",
      authRequired: "请先登入，我们才能为您加入活动。",
      previewRequired: "加入前请先扫描并预览邀请。",
      joinFailure: "无法使用此邀请为您报名。",
      inviteMissing: "请先扫描或输入邀请代码。",
    },
    success: {
      joined: "加入成功！我们会马上更新您的行程。",
      viewTrails: "查看我的行程",
      goDashboard: "返回仪表板",
    },
    details: {
      starts: "开始",
      ends: "结束",
      location: "地点",
    },
    actions: {
      join: "加入此活动",
      joining: "正在加入...",
      signup: "注册后加入",
      login: "登入后加入",
    },
    remember: "我们会记住这张邀请，等您登入后继续完成。",
  },
  join: {
    back: {
      dashboard: "Kembali ke papan pemuka",
      login: "Kembali ke log masuk",
    },
    heading: {
      title: "Imbas QR jemputan",
      subtitle:
        "Gunakan kamera anda untuk sertai aktiviti serta-merta. Kami akan ingat jemputan ini jika anda perlu log masuk dahulu.",
    },
    cameraNotice: "Kami hanya menggunakan kamera anda untuk membaca kod QR. Tiada foto disimpan.",
    manual: {
      label: "Pautan atau kod jemputan",
      placeholder: "Imbas atau tampal pautan jemputan",
      submit: "Pratonton jemputan",
      checking: "Sedang menyemak jemputan...",
    },
    errors: {
      unreadable: "Kami tidak dapat membaca jemputan. Sila cuba lagi.",
      invalid: "Kod ini bukan jemputan yang sah. Jika ingin daftar masuk, buka halaman Imbas.",
      authRequired: "Sila log masuk dahulu supaya kami boleh menambah anda ke aktiviti.",
      previewRequired: "Imbas dan pratonton jemputan sebelum menyertai.",
      joinFailure: "Kami tidak dapat menyertakan anda dengan jemputan ini.",
      inviteMissing: "Sila imbas atau masukkan kod jemputan terlebih dahulu.",
    },
    success: {
      joined: "Berjaya! Kami akan mengemas kini jejak anda sebentar lagi.",
      viewTrails: "Lihat jejak saya",
      goDashboard: "Pergi ke papan pemuka",
    },
    details: {
      starts: "Mula",
      ends: "Tamat",
      location: "Lokasi",
    },
    actions: {
      join: "Sertai aktiviti ini",
      joining: "Sedang sertai...",
      signup: "Daftar untuk sertai",
      login: "Log masuk untuk sertai",
    },
    remember: "Kami akan mengingati jemputan ini dan meneruskan pendaftaran selepas anda log masuk.",
  },
  join: {
    back: {
      dashboard: "டாஷ்போர்டுக்கு திரும்ப",
      login: "உள்நுழைவு பக்கத்திற்கு திரும்ப",
    },
    heading: {
      title: "அழைப்புக் QR-ஐ ஸ்கேன் செய்யவும்",
      subtitle:
        "கேமராவை பயன்படுத்தி உடனே செயல்பாட்டில் சேரலாம். முதலில் உள் நுழைய வேண்டுமெனில் நாங்கள் அழைப்பை நினைவில் வைத்துக்கொள்வோம்.",
    },
    cameraNotice: "QR குறியீடுகளை வாசிக்க மட்டுமே கேமராவைப் பயன்படுத்துகிறோம். புகைப்படங்கள் சேமிக்கப்படுவதில்லை.",
    manual: {
      label: "அழைப்பு இணைப்பு அல்லது குறியீடு",
      placeholder: "அழைப்பு இணைப்பை ஸ்கேன் செய்யவும் அல்லது ஒட்டவும்",
      submit: "அழைப்பை முன்னோட்டமாக காண்க",
      checking: "அழைப்பைச் சரிபார்க்கிறது...",
    },
    errors: {
      unreadable: "அழைப்பை வாசிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
      invalid: "இந்த குறியீடு செல்லுபடி அழைப்பு அல்ல. செக்-இன் செய்ய வேண்டுமெனில் 'ஸ்கேன்' பக்கத்தைத் திறக்கவும்.",
      authRequired: "செயல்பாட்டில் சேர நாம் உங்களை உள்நுழையச் செய்ய வேண்டும்.",
      previewRequired: "சேர்வதற்கு முன் அழைப்பை ஸ்கேன் செய்து முன்னோட்டம் பார்க்கவும்.",
      joinFailure: "இந்த அழைப்புடன் உங்களை சேர்க்க முடியவில்லை.",
      inviteMissing: "முதலில் அழைப்பு குறியீட்டை ஸ்கேன் செய்யவோ உள்ளிடவோ செய்யவும்.",
    },
    success: {
      joined: "நீங்கள் இணைந்துவிட்டீர்கள்! உங்கள் செயல்பாடுகளை உடனே புதுப்பிப்போம்.",
      viewTrails: "என் செயல்பாடுகளைப் பார்க்க",
      goDashboard: "டாஷ்போர்டுக்கு செல்ல",
    },
    details: {
      starts: "தொடக்கம்",
      ends: "முடிவு",
      location: "இடம்",
    },
    actions: {
      join: "இந்த செயல்பாட்டில் சேரவும்",
      joining: "சேரப்படுகிறது...",
      signup: "சேர பதிவு செய்யவும்",
      login: "சேர உள் நுழையவும்",
    },
    remember: "நீங்கள் உள்நுழைந்த பின் இந்த அழைப்பை நினைவில் வைத்துக் கொண்டு பதிவு முடிப்போம்.",
  },
  scan: {
    pendingOrg: {
      title: "请先加入组织",
      description:
        "加入组织后才能扫描签到二维码。请输入邀请码或回到首页选择组织。",
    },
    actions: {
      enterInvite: "输入邀请码",
      backHome: "返回仪表板",
      viewTrails: "查看我的行程",
      scanAgain: "再扫描一次",
      scanAgainShort: "重新扫描",
      history: "查看签到记录",
      redeem: "查看奖励",
      chooseImage: "选择图片",
      submitCode: "提交代码",
    },
    errors: {
      history: "目前无法载入您的签到记录。",
      readFailed: "无法读取此二维码，请再试一次。",
      requireSignInInvite: "请先登入才能接受邀请。",
      inviteProcess: "我们无法处理此邀请码。",
      requireSignInScan: "签到前请先登入。",
      requireOrg: "请先加入组织再进行签到。",
      checkinFailed: "我们无法记录这次签到。",
      noTokenImage: "在这张图片中找不到二维码。",
      imageDecode: "无法辨识这张图片，请使用更清晰的照片。",
      manualInvalid: "这似乎不是有效的代码。",
    },
    invite: {
      acceptedTitle: "邀请已接受！",
      alreadyTitle: "您已经完成报名",
      schedule: "时间",
      successDescription: "一切就绪，我们会马上更新您的活动。",
      alreadyDescription: "看起来您已经报名过了，祝您玩得开心！",
    },
    success: {
      title: "签到成功！",
    },
    details: {
      activityLabel: "活动",
      activityStep: "第 {order} 步",
      trailLabel: "行程",
      orgLabel: "组织",
      methodLabel: "方式",
    },
    status: {
      repeat: "您已经为此活动签到过了。",
      pointsAwarded: "积分已加入您的总积分。",
      pending: "积分稍后确认，请耐心等候。",
      recorded: "签到已成功记录。",
    },
    points: {
      label: "获得积分",
      instant: "积分已即时加入",
      already: "积分已领取",
      none: "这次没有积分",
      pending: "积分待确认",
    },
    scanner: {
      title: "扫描二维码签到",
      description:
        "请保持手机稳定，将二维码放入框内，我们会自动记录您的签到。",
      uploadTitle: "上传二维码图片",
      uploadDescription:
        "建议使用 PNG 或 JPG。我们会读取并自动提交。",
      processing: "正在处理您的代码...",
      manualTitle: "手动输入代码",
      manualDescription: "若无法使用相机，可贴上签到代码或链接。",
      manualPlaceholder: "例如：/checkin/scan?token=...",
    },
    history: {
      title: "最近签到",
      empty: "您尚未签到任何行程，请扫描二维码开始吧！",
      trailLabel: "行程 {id}",
    },
  },
  leaderboard: {
    pageTitle: "排行榜",
    signInPrompt: "登入后查看排行榜。",
    tabs: {
      system: "社区榜",
      org: "我的组织",
    },
    entries: {
      you: "你",
      participantLabel: "参与者 {id}",
    },
    org: {
      unknown: "组织",
      label: "组织 {id}",
      noOrgMessage: "加入组织后即可查看该组织的排行榜。",
      currentLabel: "当前组织",
      switchLabel: "切换组织",
    },
    blocks: {
      title: "前 50 名",
      loading: "正在载入排行榜...",
      rank: "第 {rank} 名",
      refreshing: "正在刷新...",
      refresh: "刷新",
      keepGoing: "继续加油！你目前排名第 {rank}。",
      emptyOrg: "该组织暂时没有排行榜记录。",
      emptySystem: "社区排行榜尚无记录。",
    },
    errors: {
      systemLoad: "无法载入社区排行榜。",
      orgLoad: "无法载入组织排行榜。",
    },
  },
  social: {
    pageTitle: "社区",
    invite: {
      title: "邀请朋友",
      subtitle: "一起参加活动可获得额外积分",
      cta: "分享邀请链接",
      copied: "邀请链接已复制！分享给家人或朋友吧。",
      copyFallback: "无法自动复制，请手动分享此链接：{link}",
    },
    group: {
      title: "我的小组",
      entries: [
        { name: "梅姨", points: "今日 +10 分" },
        { name: "林叔", points: "今日 +8 分" },
        { name: "陈太太", points: "今日 +6 分" },
      ],
    },
    messageBoard: {
      title: "留言板",
      cta: "发送讯息",
      entries: [
        {
          name: "林叔",
          time: "2 小时前",
          message: "太极课真棒！👍",
          avatar: "🧓",
        },
        {
          name: "陈姨",
          time: "1 天前",
          message: "大家继续加油！🖤",
          avatar: "👩‍🦳",
        },
        {
          name: "David（儿子）",
          time: "2 天前",
          message: "妈妈我为你感到骄傲！🎉",
          avatar: "👨‍🦱",
        },
      ],
    },
  },
  myTrails: {
    pageTitle: "我的行程",
    hero: {
      title: "我的行程",
      description: "追踪即将到来的活动并查看您的进度。",
      progressSummary: "{confirmed}/{total} 个活动已确认（{percent}%）",
    },
    actions: {
      scan: "扫描二维码标记完成",
      viewDetails: "查看详情",
      details: "详情",
      join: "报名活动",
      joining: "正在报名...",
    },
    sections: {
      registered: "已报名的活动",
      attendance: "出席记录",
      available: "可报名的活动",
      confirmed: "已确认的活动",
    },
    status: {
      pending: "待审批",
      approved: "已批准",
      confirmed: "已确认",
      rejected: "已拒绝",
      cancelled: "已取消",
      waitlisted: "候补中",
    },
    errors: {
      load: "无法载入您的行程。",
      register: "无法报名此活动，请稍后再试。",
    },
    messages: {
      loadingRegistered: "正在载入您的活动...",
      noRegistrations: "您尚未报名任何行程。请看看下方的活动！",
      trailDescriptionFallback: "更多详情即将公布。",
      registrationNote: "您的备注：{note}",
      loadingAttendance: "正在载入您的出席记录...",
      noAttendance: "尚未有主办单位确认的出席。扫描二维码后再来查看！",
      loadingAvailable: "正在载入可报名的活动...",
      noAvailable: "目前没有新的活动，请稍后再查看！",
      availableDescription: "与朋友一起探索新的活动。",
    },
    labels: {
      trailFallback: "行程",
      trailWithIdFallback: "行程 {id}",
    },
    attendance: {
      orgLabel: "组织 {org}",
    },
    available: {
      capacityStatus: "容量：{capacity} | 状态：{status}",
      capacityUnknown: "待定",
      status: {
        open: "开放",
        active: "进行中",
        closed: "已结束",
        cancelled: "已取消",
        draft: "草稿",
        full: "名额已满",
        upcoming: "即将开始",
        unknown: "{status}",
      },
    },
    detail: {
      title: "行程详情",
      back: "返回我的行程",
      loading: "正在载入行程详情...",
      errors: {
        load: "无法载入行程资讯。",
      },
      info: {
        capacity: "容量：{capacity}",
        status: "状态：{status}",
      },
      registration: {
        heading: "报名状态：",
        cancel: "取消报名",
        cancelling: "正在取消...",
        cancelError: "无法取消此报名，请稍后再试。",
        noCancel: "此报名已无法取消。",
        descriptions: {
          pending: "您的名额等待主办单位审核。",
          approved: "已批准——主办单位仍需确认名额。",
          confirmed: "您已确认，请记得准时参加。",
          rejected: "很遗憾，此报名未被通过。",
          cancelled: "您已取消此报名。",
          waitlisted: "目前在候补名单，有空位时会自动补上。",
          generic: "有最新进展时我们会通知您。",
        },
      },
      callToAction: {
        prompt: "您尚未报名此行程，现在就抢下名额吧。",
        join: "报名此行程",
        joining: "报名中...",
      },
    },
  },
  rewards: {
    pageTitle: "奖励",
    onboarding: {
      title: "完成引导以解锁奖励",
      description:
        "当主办单位将您加入组织后，奖励、礼券和积分余额才会开放。使用他们分享的邀请码或请他们在主办方后台添加您。",
    },
    actions: {
      enterInvite: "输入邀请码",
      backHome: "返回首页",
    },
    sections: {
      redeemable: "可兑换奖励",
      history: "兑换记录",
      pointsHistory: "积分记录",
    },
    success: {
      voucher: "{name} 兑换成功！",
    },
    labels: {
      voucherFallback: "礼券",
      loading: "正在载入奖励...",
      noVouchers: "目前没有可兑换的奖励，请稍后再来！",
      lastUpdated: "最后更新 {datetime}",
      redeemedAt: "兑换时间 {datetime}",
      noHistory: "该组织尚无积分记录。",
      redeeming: "正在兑换...",
      redeem: "兑换",
      qtyClaimed: "已领取 {count}/{total}",
      availablePoints: "可用积分",
      organisation: "组织",
      pendingAssignment:
        "您尚未被加入任何组织。请向主办单位索取邀请码或使用“加入”页面输入代码，开始累积奖励。",
      loadingHistory: "正在载入您的积分记录...",
      loadingRedemptions: "正在载入您的兑换记录...",
      noRedemptions: "您还没有兑换过任何奖励。",
    },
    messages: {
      presentCode: "向主办单位出示此代码：",
      contextWithDate: "{context} - {date}",
    },
    vouchers: {
      cost: "所需积分：{points}",
      status: {
        active: "可兑换",
        inactive: "已停用",
        expired: "已过期",
        scheduled: "即将上线",
        outOfStock: "已兑完",
        unknown: "{status}",
      },
    },
    history: {
      reason: {
        activityCheckin: "活动签到",
        trailCheckin: "行程签到",
        manualBonus: "手动奖励",
        voucherRedeem: "礼券兑换",
      },
      note: {
        qr: "二维码",
      },
    },
    redemptions: {
      pointsUsed: "使用积分：{points}",
      code: "兑换码：{code}",
      status: {
        pending: "待处理",
        completed: "已完成",
        redeemed: "已兑换",
        fulfilled: "已履行",
        cancelled: "已取消",
        rejected: "已拒绝",
        approved: "已批准",
        generic: "{status}",
      },
      voucherFallback: "礼券 {code}",
      voucherIdFallback: "礼券 {id}",
    },
  },
  "Please enter your NRIC and 8-digit passcode.": "请输入 NRIC 以及 8 位数通行码。",
  "Unable to log in. Please try again.": "无法登入，请稍后再试。",
  "Welcome to SilverTrails": "欢迎来到 SilverTrails",
  "NRIC / Identifier": "NRIC / 身份编号",
  "e.g. S1234567A": "例如 S1234567A",
  "Passcode (8-digit)": "通行码（8 位数）",
  DDMMYYYY: "DDMMYYYY",
  "Signing in...": "正在登入...",
  Login: "登入",
  "Not a member?": "还不是会员？",
  "Sign up": "注册",
  "Have a QR invite?": "有 QR 邀请吗？",
  "Scan to join": "扫一扫立即加入",
  "Please enter your full name.": "请输入您的全名。",
  "Please enter your NRIC.": "请输入您的 NRIC。",
  "Passcode must be 8 digits (DDMMYYYY).": "通行码必须是 8 位数（DDMMYYYY）。",
  "Passcodes do not match.": "两次输入的通行码不相同。",
  "Unable to sign up. Please try again.": "无法注册，请稍后再试。",
  "Welcome aboard!": "欢迎加入！",
  "{name}, your SilverTrails account was created successfully.": "{name}，您的 SilverTrails 帐号已建立。",
  "Your SilverTrails account was created successfully.": "您的 SilverTrails 帐号已建立。",
  "You can now explore your trails, scan QR codes for activities, and collect rewards.":
    "您现在可以浏览行程、扫描活动 QR 码并累积奖励。",
  "Go to my dashboard": "前往我的面板",
  "Create your account": "建立您的帐号",
  "Full name": "全名",
  "e.g. Auntie Mei": "例如 Auntie Mei",
  "Confirm passcode": "确认通行码",
  "Re-enter passcode": "再次输入通行码",
  "We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.":
    "我们使用 8 位数通行码（DDMMYYYY）让长者更容易登入。",
  "Creating account...": "正在建立帐号...",
  "Already have an account?": "已经有帐号了吗？",
  "Log in": "登入",
  "Received an invite QR?": "收到邀请 QR 吗？",
  "Scan to join first": "先扫描再加入",
};

const msMessages = {
  common: {
    appName: "SilverTrails",
    friend: "Rakan",
    dateTbc: "Tarikh akan ditetapkan",
    pending: "Sedang diproses",
    actions: {
      logout: "Log keluar",
      back: "Kembali",
      refresh: "Segar semula",
    },
    labels: {
      dateRange: "{start} hingga {end}",
      locationTbc: "Lokasi akan dimaklumkan",
      toBeConfirmed: "Untuk disahkan",
    },
    errors: {
      generic: "Ada masalah. Sila cuba lagi.",
      organisationsLoad: "Tidak dapat memuatkan senarai organisasi.",
      trailsLoad: "Tidak dapat memuatkan maklumat aktiviti anda.",
      invitePreview: "Tidak dapat pratonton jemputan.",
      invitePreviewRequired: "Pratonton jemputan sebelum menyertai.",
      inviteJoin: "Tidak dapat menyertai dengan jemputan ini.",
      inviteGeneric: "Kami tidak dapat mendaftarkan anda dengan jemputan ini.",
      joinOrganisation: "Tidak dapat menyertai organisasi ini sekarang.",
      rewardsLoad: "Tidak dapat memuatkan ganjaran anda.",
      redeemJoinOrg: "Sertai organisasi untuk menebus ganjaran.",
      redeemFailure: "Tidak dapat menebus ganjaran ini sekarang.",
      inviteSignIn: "Sila log masuk untuk menggunakan jemputan.",
      inviteRequired: "Masukkan kod jemputan terlebih dahulu.",
      selectOrganisation: "Pilih organisasi terlebih dahulu.",
      reauth: "Sila log masuk semula untuk meneruskan.",
    },
    success: {
      inviteRegistered: "Anda berjaya didaftarkan untuk {title}!",
    },
  },
  layout: {
    languageLabel: "Bahasa",
  },
  nav: {
    home: "Utama",
    myTrails: "Jejak Saya",
    scan: "Imbas",
    leaderboard: "Papan pendahulu",
    rewards: "Ganjaran",
    community: "Komuniti",
  },
  home: {
    profile: {
      comingSoon: "Profil akan datang!",
    },
    pendingOrg: {
      title: "Hampir siap!",
      description:
        "Anda belum menyertai mana-mana organisasi. Pilih satu di bawah untuk mula mendaftar aktiviti atau minta penganjur menghantar jemputan.",
      selectLabel: "Pilih organisasi",
      selectPlaceholder: "Pilih organisasi",
      cta: "Sertai organisasi",
      joining: "Sedang menyertai...",
      success: "Berjaya disertai! Papan pemuka anda sedang dikemas kini.",
    },
    hero: {
      title: "Selamat kembali, {name}!",
      subtitle: "Sedia untuk hari yang hebat?",
    },
    progress: {
      title: "Kemajuan anda",
      summary: "{confirmed}/{total} aktiviti disahkan",
      note: "Termasuk semua aktiviti yang anda daftar.",
    },
    links: {
      myTrails: {
        title: "Jejak saya",
        description: "Teruskan perjalanan pembelajaran anda",
      },
      leaderboard: {
        title: "Papan pendahulu",
        description: "Lihat kedudukan anda dengan rakan-rakan",
      },
      rewards: {
        title: "Ganjaran",
        description: "Tebus ganjaran yang anda kumpul",
      },
      upcoming: {
        title: "Aktiviti akan datang",
        description: "Sertai aktiviti komuniti",
      },
      upcomingComingSoon: "Ciri ini akan datang!",
    },
    invite: {
      fallbackTitle: "aktiviti ini",
      acceptedGeneric: "Jemputan diterima! Anda sudah bersedia.",
      processError: "Kami tidak dapat memproses jemputan anda.",
      scannedError: "Kami tidak dapat memproses jemputan yang anda imbas tadi.",
      alreadyRegisteredWithTitle: "Anda sudah berdaftar untuk {title}.",
      alreadyRegisteredGeneric: "Anda sudah berdaftar untuk aktiviti ini.",
      sectionTitle: "Ada kod jemputan?",
      sectionSubtitle: "Masukkan kod yang dikongsi penganjur untuk sertai serta-merta.",
      placeholder: "Masukkan kod jemputan",
      previewLoading: "Sedang semak...",
      previewCta: "Pratonton",
      joining: "Sedang sertai...",
      joinCta: "Sertai",
      descriptionFallback: "Sertai aktiviti komuniti ini.",
    },
    sections: {
      highlightsTitle: "Sorotan Komuniti",
    },
    highlights: {
      taiChi: {
        title: "Tai Chi Warga Emas",
        subtitle: "Tai Chi pagi",
        description: "Bersama Pak Cik Lim dan rakan-rakan setiap hari Selasa",
      },
      cooking: {
        title: "Kelas Memasak",
        subtitle: "Bengkel memasak",
        description: "Pelajari resipi tradisional bersama",
      },
      garden: {
        title: "Kelab Kebun",
        subtitle: "Kelab Kebun",
        description: "Tanam herba dan sayur bersama",
      },
    },
    upcoming: {
      title: "Aktiviti bakal berlangsung",
      loading: "Sedang memuatkan aktiviti...",
      empty: "Anda sudah mengikuti semuanya. Aktiviti baru akan dipaparkan di sini.",
      descriptionFallback: "Sertai aktiviti komuniti ini.",
      viewDetails: "Lihat butiran →",
    },
    daily: {
      title: "Motivasi harian",
      body: "Terus bergerak! Aktiviti yang disahkan dikira dalam papan pendahulu komuniti anda.",
      cta: "Ketahui lagi",
    },
  },
  scan: {
    pendingOrg: {
      title: "Sertai organisasi dahulu",
      description:
        "Sertai organisasi sebelum mengimbas kod daftar masuk. Masukkan jemputan atau pilih dari papan pemuka anda.",
    },
    actions: {
      enterInvite: "Masukkan kod jemputan",
      backHome: "Kembali ke papan pemuka",
      viewTrails: "Lihat jejak saya",
      scanAgain: "Imbas kod lain",
      scanAgainShort: "Imbas lagi",
      history: "Lihat sejarah terbaru",
      redeem: "Semak ganjaran",
      chooseImage: "Pilih imej",
      submitCode: "Hantar kod",
    },
    errors: {
      history: "Tidak dapat memuatkan sejarah daftar masuk anda.",
      readFailed: "Kami tidak dapat membaca kod itu. Cuba lagi.",
      requireSignInInvite: "Log masuk untuk menerima jemputan ini.",
      inviteProcess: "Kami tidak dapat memproses jemputan ini.",
      requireSignInScan: "Log masuk sebelum daftar masuk.",
      requireOrg: "Sertai organisasi untuk daftar masuk.",
      checkinFailed: "Kami tidak dapat merekodkan daftar masuk ini.",
      noTokenImage: "Kami tidak menemui kod QR dalam imej itu.",
      imageDecode: "Kami tidak dapat membaca imej itu. Cuba gambar yang lebih jelas.",
      manualInvalid: "Kod itu tidak kelihatan sah.",
    },
    invite: {
      acceptedTitle: "Jemputan diterima!",
      alreadyTitle: "Anda sudah berdaftar",
      schedule: "Jadual",
      successDescription: "Semua siap. Kami akan mengemas kini aktiviti anda seketika lagi.",
      alreadyDescription: "Nampaknya anda sudah berdaftar. Selamat menikmati aktiviti!",
    },
    success: {
      title: "Daftar masuk berjaya!",
    },
    details: {
      activityLabel: "Aktiviti",
      activityStep: "Langkah {order}",
      trailLabel: "Jejak",
      orgLabel: "Organisasi",
      methodLabel: "Cara",
    },
    status: {
      repeat: "Anda sudah daftar masuk untuk aktiviti ini.",
      pointsAwarded: "Mata telah ditambah ke jumlah anda.",
      pending: "Kami akan mengesahkan mata anda sebentar lagi.",
      recorded: "Daftar masuk direkodkan.",
    },
    points: {
      label: "Mata diperoleh",
      instant: "Mata ditambah serta-merta",
      already: "Mata sudah dikreditkan",
      none: "Tiada mata kali ini",
      pending: "Mata menunggu pengesahan",
    },
    scanner: {
      title: "Imbas QR untuk tandakan aktiviti",
      description:
        "Pegang peranti stabil dan letakkan kod QR dalam bingkai. Kami akan merekod daftar masuk anda secara automatik.",
      uploadTitle: "Muat naik imej kod QR",
      uploadDescription:
        "PNG atau JPG paling sesuai. Kami akan baca dan hantar secara automatik.",
      processing: "Sedang memproses kod anda...",
      manualTitle: "Masukkan kod secara manual",
      manualDescription: "Tampal token atau pautan QR jika kamera tidak tersedia.",
      manualPlaceholder: "cth. /checkin/scan?token=...",
    },
    history: {
      title: "Daftar masuk terkini",
      empty: "Anda belum daftar masuk mana-mana jejak. Imbas kod QR untuk bermula!",
      trailLabel: "Jejak {id}",
    },
  },
  leaderboard: {
    pageTitle: "Papan pendahulu",
    signInPrompt: "Log masuk untuk melihat papan pendahulu.",
    tabs: {
      system: "Komuniti",
      org: "Organisasi Saya",
    },
    entries: {
      you: "Anda",
      participantLabel: "Peserta {id}",
    },
    org: {
      unknown: "Organisasi",
      label: "Organisasi {id}",
      noOrgMessage: "Sertai organisasi untuk melihat papan pendahulunya.",
      currentLabel: "Organisasi semasa",
      switchLabel: "Tukar organisasi",
    },
    blocks: {
      title: "50 Teratas",
      loading: "Sedang memuatkan papan pendahulu...",
      rank: "Kedudukan #{rank}",
      refreshing: "Sedang menyegar...",
      refresh: "Segar semula",
      keepGoing: "Teruskan! Anda kini di kedudukan #{rank}.",
      emptyOrg: "Belum ada catatan untuk organisasi ini.",
      emptySystem: "Belum ada catatan komuniti setakat ini.",
    },
    errors: {
      systemLoad: "Tidak dapat memuatkan papan pendahulu komuniti.",
      orgLoad: "Tidak dapat memuatkan papan pendahulu organisasi.",
    },
  },
  social: {
    pageTitle: "Komuniti",
    invite: {
      title: "Jemput Rakan",
      subtitle: "Sertai aktiviti bersama untuk mata bonus",
      cta: "Kongsi pautan jemputan",
      copied: "Pautan jemputan disalin! Kongsi dengan keluarga atau rakan.",
      copyFallback:
        "Tidak dapat salin secara automatik. Kongsi pautan ini secara manual: {link}",
    },
    group: {
      title: "Kumpulan Saya",
      entries: [
        { name: "Auntie Mei", points: "+10 mata hari ini" },
        { name: "Uncle Lim", points: "+8 mata hari ini" },
        { name: "Mdm Tan", points: "+6 mata hari ini" },
      ],
    },
    messageBoard: {
      title: "Papan mesej",
      cta: "Hantar mesej",
      entries: [
        {
          name: "Uncle Lim",
          time: "2 jam lalu",
          message: "Kelas Tai Chi tadi hebat! 👍",
          avatar: "🧓",
        },
        {
          name: "Auntie Chen",
          time: "1 hari lalu",
          message: "Teruskan semua! 🖤",
          avatar: "👩‍🦳",
        },
        {
          name: "David (Anak)",
          time: "2 hari lalu",
          message: "Saya bangga dengan ibu! 🎉",
          avatar: "👨‍🦱",
        },
      ],
    },
  },
  myTrails: {
    pageTitle: "Jejak Saya",
    hero: {
      title: "Jejak Saya",
      description: "Pantau aktiviti akan datang dan lihat kemajuan anda.",
      progressSummary: "{confirmed} daripada {total} aktiviti disahkan ({percent}%)",
    },
    actions: {
      scan: "Imbas QR untuk tanda siap",
      viewDetails: "Lihat butiran",
      details: "Butiran",
      join: "Sertai jejak",
      joining: "Sedang menyertai...",
    },
    sections: {
      registered: "Aktiviti Didaftar",
      attendance: "Sejarah Kehadiran",
      available: "Jejak Untuk Disertai",
      confirmed: "Jejak Disahkan",
    },
    status: {
      pending: "Menunggu kelulusan",
      approved: "Diluluskan",
      confirmed: "Disahkan",
      rejected: "Ditolak",
      cancelled: "Dibatalkan",
      waitlisted: "Senarai menunggu",
    },
    errors: {
      load: "Gagal memuatkan jejak anda.",
      register: "Tidak dapat menyertai jejak ini. Cuba lagi.",
    },
    messages: {
      loadingRegistered: "Sedang memuatkan aktiviti anda...",
      noRegistrations: "Anda belum menyertai sebarang jejak. Teroka aktiviti di bawah!",
      trailDescriptionFallback: "Butiran lanjut akan tersedia tidak lama lagi.",
      registrationNote: "Nota anda: {note}",
      loadingAttendance: "Sedang memuatkan rekod kehadiran...",
      noAttendance: "Tiada kehadiran disahkan oleh penganjur lagi. Imbas kod QR dan datang semula!",
      loadingAvailable: "Sedang memuatkan jejak yang tersedia...",
      noAvailable: "Tiada jejak baru sekarang - datang semula kemudian!",
      availableDescription: "Temui aktiviti baharu bersama rakan.",
    },
    labels: {
      trailFallback: "Jejak",
      trailWithIdFallback: "Jejak {id}",
    },
    attendance: {
      orgLabel: "Organisasi {org}",
    },
    available: {
      capacityStatus: "Kapasiti: {capacity} | Status: {status}",
      capacityUnknown: "Akan dimaklumkan",
      status: {
        open: "Dibuka",
        active: "Aktif",
        closed: "Ditutup",
        cancelled: "Dibatalkan",
        draft: "Draf",
        full: "Penuh",
        upcoming: "Akan datang",
        unknown: "{status}",
      },
    },
    detail: {
      title: "Butiran Jejak",
      back: "Kembali ke Jejak Saya",
      loading: "Sedang memuatkan butiran jejak...",
      errors: {
        load: "Tidak dapat memuatkan maklumat jejak.",
      },
      info: {
        capacity: "Kapasiti: {capacity}",
        status: "Status: {status}",
      },
      registration: {
        heading: "Status pendaftaran:",
        cancel: "Batalkan pendaftaran",
        cancelling: "Sedang membatalkan...",
        cancelError: "Tidak dapat membatalkan pendaftaran ini. Cuba lagi.",
        noCancel: "Pendaftaran ini tidak boleh dibatalkan lagi.",
        descriptions: {
          pending: "Tempat anda menunggu kelulusan penganjur.",
          approved: "Diluluskan - penganjur masih perlu mengesahkan tempat anda.",
          confirmed: "Anda telah disahkan. Pastikan hadir tepat pada masanya.",
          rejected: "Maaf, pendaftaran ini telah ditolak.",
          cancelled: "Anda telah membatalkan pendaftaran ini.",
          waitlisted: "Anda dalam senarai menunggu - akan dinaikkan bila ada kekosongan.",
          generic: "Kami akan memaklumkan apabila ada perkembangan baharu.",
        },
      },
      callToAction: {
        prompt: "Anda belum menyertai jejak ini. Tempah tempat anda sekarang.",
        join: "Sertai jejak ini",
        joining: "Sedang sertai...",
      },
    },
  },
  rewards: {
    pageTitle: "Ganjaran",
    onboarding: {
      title: "Lengkapkan onboarding untuk membuka ganjaran",
      description:
        "Ganjaran, baucar dan baki mata akan tersedia selepas penganjur menambah anda ke organisasi. Gunakan kod jemputan yang dikongsi atau minta mereka menambah anda melalui papan pemuka penganjur.",
    },
    actions: {
      enterInvite: "Masukkan kod jemputan",
      backHome: "Kembali ke Laman Utama",
    },
    sections: {
      redeemable: "Ganjaran Boleh Tebus",
      history: "Sejarah penebusan",
      pointsHistory: "Sejarah mata",
    },
    success: {
      voucher: "{name} berjaya ditebus!",
    },
    labels: {
      voucherFallback: "Baucar",
      loading: "Sedang memuatkan ganjaran...",
      noVouchers: "Tiada ganjaran buat masa ini. Sila semak semula nanti!",
      lastUpdated: "Kemaskini terakhir {datetime}",
      redeemedAt: "Ditebus pada {datetime}",
      noHistory: "Tiada aktiviti mata untuk organisasi ini lagi.",
      redeeming: "Sedang menebus...",
      redeem: "Tebus",
      qtyClaimed: "{count}/{total} ditebus",
      availablePoints: "Mata tersedia",
      organisation: "Organisasi",
      pendingAssignment:
        "Anda belum ditambah ke organisasi. Minta kod jemputan daripada penganjur atau gunakan halaman Sertai untuk mula mengumpul ganjaran.",
      loadingHistory: "Sedang memuatkan sejarah mata anda...",
      loadingRedemptions: "Sedang memuatkan sejarah penebusan...",
      noRedemptions: "Anda belum menebus sebarang ganjaran.",
    },
    messages: {
      presentCode: "Tunjukkan kod ini kepada penganjur:",
      contextWithDate: "{context} - {date}",
    },
    vouchers: {
      cost: "Kos: {points}",
      status: {
        active: "Tersedia",
        inactive: "Tidak aktif",
        expired: "Tamat tempoh",
        scheduled: "Dijadualkan",
        outOfStock: "Habis ditebus",
        unknown: "{status}",
      },
    },
    history: {
      reason: {
        activityCheckin: "Daftar Masuk Aktiviti",
        trailCheckin: "Daftar Masuk Jejak",
        manualBonus: "Bonus Manual",
        voucherRedeem: "Penebusan Baucar",
      },
      note: {
        qr: "QR",
      },
    },
    redemptions: {
      pointsUsed: "Mata digunakan: {points}",
      code: "Kod: {code}",
      status: {
        pending: "Menunggu",
        completed: "Selesai",
        redeemed: "Ditebus",
        fulfilled: "Dipenuhi",
        cancelled: "Dibatalkan",
        rejected: "Ditolak",
        approved: "Diluluskan",
        generic: "{status}",
      },
      voucherFallback: "Baucar {code}",
      voucherIdFallback: "Baucar {id}",
    },
  },
  "Please enter your NRIC and 8-digit passcode.": "Sila masukkan NRIC dan kata laluan 8 digit anda.",
  "Unable to log in. Please try again.": "Tidak dapat log masuk. Sila cuba lagi.",
  "Welcome to SilverTrails": "Selamat datang ke SilverTrails",
  "NRIC / Identifier": "NRIC / Pengenal",
  "e.g. S1234567A": "cth. S1234567A",
  "Passcode (8-digit)": "Kata laluan (8 digit)",
  DDMMYYYY: "DDMMYYYY",
  "Signing in...": "Sedang log masuk...",
  Login: "Log masuk",
  "Not a member?": "Belum menjadi ahli?",
  "Sign up": "Daftar",
  "Have a QR invite?": "Ada jemputan QR?",
  "Scan to join": "Imbas untuk sertai",
  "Please enter your full name.": "Sila masukkan nama penuh anda.",
  "Please enter your NRIC.": "Sila masukkan NRIC anda.",
  "Passcode must be 8 digits (DDMMYYYY).": "Kata laluan mestilah 8 digit (DDMMYYYY).",
  "Passcodes do not match.": "Kata laluan tidak sepadan.",
  "Unable to sign up. Please try again.": "Tidak dapat mendaftar. Sila cuba lagi.",
  "Welcome aboard!": "Selamat datang!",
  "{name}, your SilverTrails account was created successfully.":
    "{name}, akaun SilverTrails anda telah berjaya dibuat.",
  "Your SilverTrails account was created successfully.":
    "Akaun SilverTrails anda telah berjaya dibuat.",
  "You can now explore your trails, scan QR codes for activities, and collect rewards.":
    "Anda kini boleh meneroka jejak, mengimbas kod QR aktiviti dan kumpul ganjaran.",
  "Go to my dashboard": "Pergi ke papan pemuka saya",
  "Create your account": "Cipta akaun anda",
  "Full name": "Nama penuh",
  "e.g. Auntie Mei": "cth. Auntie Mei",
  "Confirm passcode": "Sahkan kata laluan",
  "Re-enter passcode": "Masukkan semula kata laluan",
  "We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.":
    "Kami menggunakan kata laluan 8 digit (DDMMYYYY) supaya warga emas mudah log masuk.",
  "Creating account...": "Sedang mencipta akaun...",
  "Already have an account?": "Sudah ada akaun?",
  "Log in": "Log masuk",
  "Received an invite QR?": "Terima jemputan QR?",
  "Scan to join first": "Imbas untuk sertai dahulu",
};

const taMessages = {
  common: {
    appName: "SilverTrails",
    friend: "நண்பர்",
    dateTbc: "தேதி பின்னர் அறிவிக்கப்படும்",
    pending: "நிலுவையில்",
    actions: {
      logout: "வெளியேறு",
      back: "திரும்ப",
      refresh: "புதுப்பி",
    },
    labels: {
      dateRange: "{start} முதல் {end}",
      locationTbc: "இடம் பின்னர் அறிவிக்கப்படும்",
      toBeConfirmed: "உறுதிப்படுத்தப்பட வேண்டும்",
    },
    errors: {
      generic: "சற்று சிக்கல் ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.",
      organisationsLoad: "அமைப்புகளை தற்போது ஏற்ற முடியவில்லை.",
      trailsLoad: "உங்கள் செயல்பாட்டு தகவலை ஏற்ற முடியவில்லை.",
      invitePreview: "அழைப்பை முன்னோட்டம் பார்க்க முடியவில்லை.",
      invitePreviewRequired: "சேர்வதற்கு முன் அழைப்பை பாருங்கள்.",
      inviteJoin: "இந்த அழைப்புடன் சேர முடியவில்லை.",
      inviteGeneric: "இந்த அழைப்பை பயன்படுத்தி உங்களை சேர்க்க முடியவில்லை.",
      joinOrganisation: "இந்த அமைப்பில் இப்போது சேர முடியவில்லை.",
      rewardsLoad: "உங்கள் பரிசுகளை ஏற்ற முடியவில்லை.",
      redeemJoinOrg: "பரிசுகளை பெற அமைப்பில் சேரவும்.",
      redeemFailure: "இந்த பரிசை இப்போது பெற முடியவில்லை.",
      inviteSignIn: "அழைப்பை பயன்படுத்த உள் நுழையவும்.",
      inviteRequired: "முதலில் அழைப்புக் குறியீட்டை உள்ளிடவும்.",
      selectOrganisation: "முதலில் ஒரு அமைப்பைத் தேர்ந்தெடுக்கவும்.",
      reauth: "தொடர இப்போது மீண்டும் உள் நுழையவும்.",
    },
    success: {
      inviteRegistered: "நீங்கள் {title} பயன்முறையில் பதிவு செய்யப்பட்டுள்ளீர்கள்!",
    },
  },
  layout: {
    languageLabel: "மொழி",
  },
  nav: {
    home: "முகப்பு",
    myTrails: "என் செயல்பாடுகள்",
    scan: "ஸ்கேன்",
    leaderboard: "முன்னணி",
    rewards: "பரிசுகள்",
    community: "சமூகம்",
  },
  home: {
    profile: {
      comingSoon: "சுயவிவரப் பக்கம் விரைவில் வருகிறது!",
    },
    pendingOrg: {
      title: "இன்னும் ஒரு படி!",
      description:
        "நீங்கள் இன்னும் எந்த அமைப்பிலும் சேரவில்லை. கீழே ஒரு அமைப்பைத் தேர்ந்தெடுத்து உடனே செயல்பாடுகளில் பதிவு செய்யவோ அல்லது அழைப்பை பங்கிட்டுக்கொள்ளச் சொல்லவோலாம்.",
      selectLabel: "அமைப்பைத் தேர்ந்தெடுக்கவும்",
      selectPlaceholder: "அமைப்பைத் தேர்ந்தெடுக்கவும்",
      cta: "அமைப்பில் சேர",
      joining: "சேருகிறது...",
      success: "வெற்றி! உங்கள் டாஷ்போர்டு புதுப்பிக்கப்பட்டுக் கொண்டிருக்கிறது.",
    },
    hero: {
      title: "மீண்டும் வரவேற்கிறோம், {name}!",
      subtitle: "ஒரு அற்புதமான நாளுக்குத் தயாரா?",
    },
    progress: {
      title: "உங்கள் முன்னேற்றம்",
      summary: "{confirmed}/{total} செயல்பாடுகள் உறுதிசெய்யப்பட்டன",
      note: "நீங்கள் பதிவு செய்த அனைத்து செயல்பாடுகளும் அடங்கும்.",
    },
    links: {
      myTrails: {
        title: "என் செயல்பாடுகள்",
        description: "உங்கள் கற்றல் பயணத்தைத் தொடருங்கள்",
      },
      leaderboard: {
        title: "முன்னணிப் பட்டியல்",
        description: "நண்பர்களுடன் உங்கள் நிலையை பாருங்கள்",
      },
      rewards: {
        title: "பரிசுகள்",
        description: "நீங்கள் சம்பாதித்த பரிசுகளைப் பெறுங்கள்",
      },
      upcoming: {
        title: "வரவிருக்கும் நிகழ்வுகள்",
        description: "சமூக நிகழ்வுகளில் சேருங்கள்",
      },
      upcomingComingSoon: "இந்த வசதி விரைவில் வருகிறது!",
    },
    invite: {
      fallbackTitle: "இந்த செயல்பாடு",
      acceptedGeneric: "அழைப்பு ஏற்கப்பட்டது! நீங்கள் தயாராக உள்ளீர்கள்.",
      processError: "அழைப்பை செயலாக்க முடியவில்லை.",
      scannedError: "நீங்கள் ஸ்கேன் செய்த அழைப்பை செயலாக்க முடியவில்லை.",
      alreadyRegisteredWithTitle: "நீங்கள் ஏற்கனவே {title} க்கு பதிவு செய்யப்பட்டுள்ளீர்கள்.",
      alreadyRegisteredGeneric: "நீங்கள் இந்த செயல்பாட்டில் ஏற்கனவே பதிவு செய்துள்ளீர்கள்.",
      sectionTitle: "அழைப்புக் குறியீடு உள்ளதா?",
      sectionSubtitle: "நிகழ்ச்சி ஏற்பாட்டாளர் பகிர்ந்த குறியீட்டை உள்ளிட்டு உடனே சேரவும்.",
      placeholder: "அழைப்புக் குறியீட்டை உள்ளிடவும்",
      previewLoading: "சரிபார்க்கிறது...",
      previewCta: "முன்னோட்டம்",
      joining: "சேருகிறது...",
      joinCta: "சேர",
      descriptionFallback: "இந்த சமூக செயல்பாட்டில் சேருங்கள்.",
    },
    sections: {
      highlightsTitle: "சமூக சிறப்பம்சங்கள்",
    },
    highlights: {
      taiChi: {
        title: "மூத்தோர் தாய் சி",
        subtitle: "காலை தாய் சி",
        description: "ஒவ்வொரு செவ்வாய்க்கிழமையும் லிம் அய்யாவுடன் சேருங்கள்",
      },
      cooking: {
        title: "சமையல் வகுப்பு",
        subtitle: "சமையல் பணிமனை",
        description: "பாரம்பரிய சமையல் முறைகளை சேர்ந்து கற்போம்",
      },
      garden: {
        title: "தோட்டக் கழகம்",
        subtitle: "தோட்டக் கழகம்",
        description: "க்களையும் காய்கறிகளையும் ஒன்றாக வளர்ப்போம்",
      },
    },
    upcoming: {
      title: "வரவிருக்கும் செயல்பாடுகள்",
      loading: "செயல்பாடுகள் ஏற்றப்படுகிறது...",
      empty: "நீங்கள் அனைத்தையும் முடித்துவிட்டீர்கள். புதிய செயல்பாடுகள் இங்கே தோன்றும்.",
      descriptionFallback: "இந்த சமூக செயல்பாட்டில் சேருங்கள்.",
      viewDetails: "விவரங்களைப் பார்க்க →",
    },
    daily: {
      title: "நாளாந்த ஊக்கம்",
      body: "நடவடிக்கையில் இருங்கள்! உறுதிசெய்யப்பட்ட செயல்பாடுகள் உங்கள் சமூக முன்னணியில் சேர்க்கப்படும்.",
      cta: "மேலும் அறிய",
    },
  },
  scan: {
    pendingOrg: {
      title: "முதலில் அமைப்பில் சேரவும்",
      description:
        "செக்-இன் QR குறியீடுகளை ஸ்கேன் செய்ய அமைப்பில் சேர வேண்டும். அழைப்புக் குறியீட்டை உள்ளிடவோ அல்லது டாஷ்போர்டில் ஒன்றைத் தேர்ந்தெடுக்கவோ செய்யுங்கள்.",
    },
    actions: {
      enterInvite: "அழைப்புக் குறியீட்டை உள்ளிடவும்",
      backHome: "டாஷ்போர்டுக்கு திரும்ப",
      viewTrails: "என் செயல்பாடுகளைப் பார்க்க",
      scanAgain: "மற்றொரு குறியீட்டை ஸ்கேன் செய்யவும்",
      scanAgainShort: "மீண்டும் ஸ்கேன்",
      history: "சமீபத்திய வரலாற்றைப் பார்க்க",
      redeem: "பரிசுகளைப் பார்க்க",
      chooseImage: "படத்தைத் தேர்வு செய்யவும்",
      submitCode: "குறியீட்டை சமர்ப்பிக்கவும்",
    },
    errors: {
      history: "உங்கள் செக்-இன் வரலாற்றை ஏற்ற முடியவில்லை.",
      readFailed: "இந்தக் குறியீட்டை வாசிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
      requireSignInInvite: "இந்த அழைப்பை ஏற்க உள் நுழையவும்.",
      inviteProcess: "இந்த அழைப்பை செயல்படுத்த முடியவில்லை.",
      requireSignInScan: "செக்-இன் செய்வதற்கு முன் உள் நுழையவும்.",
      requireOrg: "செக்-இன் செய்ய அமைப்பில் சேரவும்.",
      checkinFailed: "இந்த செக்-இனை பதிவு செய்ய முடியவில்லை.",
      noTokenImage: "அந்த படத்தில் QR குறியீடு இல்லை.",
      imageDecode: "அந்த படத்தை வாசிக்க முடியவில்லை. தெளிவான படத்தை முயற்சிக்கவும்.",
      manualInvalid: "இது செல்லுபடியாகும் குறியீடாகத் தெரியவில்லை.",
    },
    invite: {
      acceptedTitle: "அழைப்பு ஏற்றுக்கொள்ளப்பட்டது!",
      alreadyTitle: "நீங்கள் ஏற்கனவே பதிவு செய்துள்ளீர்கள்",
      schedule: "அட்டவணை",
      successDescription: "எல்லாம் தயார். உங்கள் செயல்பாடுகளை உடனே புதுப்பிப்போம்.",
      alreadyDescription: "நீங்கள் ஏற்கனவே பதிவு செய்துள்ளீர்கள் போலிருக்கிறது. செயல்பாட்டை அனுபவிக்கவும்!",
    },
    success: {
      title: "செக்-இன் வெற்றிகரமாக முடிந்தது!",
    },
    details: {
      activityLabel: "செயல்பாடு",
      activityStep: "{order}ஆம் படி",
      trailLabel: "டிரெயில்",
      orgLabel: "அமைப்பு",
      methodLabel: "முறை",
    },
    status: {
      repeat: "இந்த செயல்பாட்டுக்கு நீங்கள் ஏற்கனவே செக்-இன் செய்துள்ளீர்கள்.",
      pointsAwarded: "பாயிண்ட்கள் உங்கள் மொத்தத்தில் சேர்க்கப்பட்டுள்ளது.",
      pending: "உங்கள் பாயிண்ட்களை விரைவில் உறுதிசெய்வோம்.",
      recorded: "செக்-இன் வெற்றிகரமாக பதிவு செய்யப்பட்டது.",
    },
    points: {
      label: "பெற்ற பாயிண்ட்கள்",
      instant: "பாயிண்ட்கள் உடனடியாக சேர்க்கப்பட்டது",
      already: "பாயிண்ட்கள் ஏற்கனவே கிடைத்தது",
      none: "இந்த முறை பாயிண்ட்கள் இல்லை",
      pending: "பாயிண்ட்கள் உறுதிப்படுத்தப்படுகின்றன",
    },
    scanner: {
      title: "செயல்பாட்டை குறிக்க QR ஐ ஸ்கேன் செய்யவும்",
      description:
        "உங்கள் சாதனத்தை நிலையாக பிடித்து QR குறியீட்டை சதுரத்தின் உள்ளே வைத்தால், நாங்கள் தானாகவே செக்-இனை பதிவு செய்கிறோம்.",
      uploadTitle: "QR குறியீட்டு படத்தைப் பதிவேற்றவும்",
      uploadDescription:
        "PNG அல்லது JPG சிறப்பாக செயல்படும். நாங்கள் குறியீட்டை வாசித்து தானாக சமர்ப்பிப்போம்.",
      processing: "உங்கள் குறியீடு செயலாக்கப்படுகிறது...",
      manualTitle: "குறியீட்டை கையால் உள்ளிடவும்",
      manualDescription: "கேமரா இல்லையெனில் டோக்கன் அல்லது QR இணைப்பை ஒட்டவும்.",
      manualPlaceholder: "உ.தா. /checkin/scan?token=...",
    },
    history: {
      title: "சமீபத்திய செக்-இன்கள்",
      empty: "நீங்கள் இன்னும் எந்த டிரெயிலும் செக்-இன் செய்யவில்லை. தொடங்க QR குறியீட்டை ஸ்கேன் செய்யவும்!",
      trailLabel: "டிரெயில் {id}",
    },
  },
  leaderboard: {
    pageTitle: "முன்னணிப் பட்டியல்",
    signInPrompt: "முன்னணிப் பட்டியலைப் பார்க்க உள்நுழையவும்.",
    tabs: {
      system: "சமூக முன்னணி",
      org: "என் அமைப்பு",
    },
    entries: {
      you: "நீங்கள்",
      participantLabel: "பங்கேற்பாளர் {id}",
    },
    org: {
      unknown: "அமைப்பு",
      label: "அமைப்பு {id}",
      noOrgMessage: "ஒரு அமைப்பில் சேர்ந்து அதன் முன்னணியைப் பார்க்கவும்.",
      currentLabel: "தற்போதைய அமைப்பு",
      switchLabel: "அமைப்பை மாற்றவும்",
    },
    blocks: {
      title: "சிறந்த 50",
      loading: "முன்னணிப் பட்டியல் ஏற்றப்படுகிறது...",
      rank: "{rank} ஆம் இடம்",
      refreshing: "புதுப்பிக்கிறது...",
      refresh: "புதுப்பி",
      keepGoing: "தொடருங்கள்! நீங்கள் தற்போது {rank}வது இடத்தில் உள்ளீர்கள்.",
      emptyOrg: "இந்த அமைப்பிற்கு இன்னும் பதிவுகள் இல்லை.",
      emptySystem: "சமூக முன்னணிப் பட்டியலில் இன்னும் பதிவுகள் இல்லை.",
    },
    errors: {
      systemLoad: "சமூக முன்னணியை ஏற்ற முடியவில்லை.",
      orgLoad: "அமைப்புக் முன்னணியை ஏற்ற முடியவில்லை.",
    },
  },
  social: {
    pageTitle: "சமூகம்",
    invite: {
      title: "ஒரு நண்பரை அழைக்கவும்",
      subtitle: "செயல்பாடுகளில் ஒன்றாக கலந்து கூடுதல் பாயிண்ட்கள் பெறுங்கள்",
      cta: "அழைப்புக் இணைப்பை பகிரவும்",
      copied:
        "அழைப்புக் இணைப்பு நகலெடுக்கப்பட்டது! குடும்பத்தினருக்கும் நண்பர்களுக்கும் பகிருங்கள்.",
      copyFallback:
        "தானாக நகலெடுக்க முடியவில்லை. இந்த இணைப்பைப் கைமுறையாக பகிரவும்: {link}",
    },
    group: {
      title: "என் குழு",
      entries: [
        { name: "அண்டி மேய்", points: "இன்று +10 பாயிண்ட்கள்" },
        { name: "அங்கிள் லிம்", points: "இன்று +8 பாயிண்ட்கள்" },
        { name: "மடம் டான்", points: "இன்று +6 பாயிண்ட்கள்" },
      ],
    },
    messageBoard: {
      title: "செய்திப் பலகை",
      cta: "செய்தி அனுப்பவும்",
      entries: [
        {
          name: "அங்கிள் லிம்",
          time: "2 மணி நேரம் முன்",
          message: "தாய் சி வகுப்பு அருமை! 👍",
          avatar: "🧓",
        },
        {
          name: "அண்டி சென்",
          time: "1 நாள் முன்",
          message: "அனைவரும் தொடர்ந்து முயற்சியுங்கள்! 🖤",
          avatar: "👩‍🦳",
        },
        {
          name: "David (மகன்)",
          time: "2 நாட்கள் முன்",
          message: "அம்மா, உங்களைப் பற்றி பெருமை! 🎉",
          avatar: "👨‍🦱",
        },
      ],
    },
  },
  myTrails: {
    pageTitle: "என் செயல்பாடுகள்",
    hero: {
      title: "என் செயல்பாடுகள்",
      description: "உங்கள் வரவிருக்கும் செயல்பாடுகளை கண்காணித்து முன்னேற்றத்தை பாருங்கள்.",
      progressSummary: "{confirmed} / {total} செயல்பாடுகள் உறுதிசெய்யப்பட்டது ({percent}%)",
    },
    actions: {
      scan: "QR குறியீட்டை ஸ்கேன் செய்து நிறைவு குறிக்கவும்",
      viewDetails: "விவரங்களைப் பார்க்க",
      details: "விவரங்கள்",
      join: "செயல்பாட்டில் சேர",
      joining: "சேரப்படுகிறது...",
    },
    sections: {
      registered: "பதிவு செய்த செயல்பாடுகள்",
      attendance: "வருகை வரலாறு",
      available: "சேரக்கூடிய செயல்பாடுகள்",
      confirmed: "உறுதி செய்யப்பட்ட செயல்பாடுகள்",
    },
    status: {
      pending: "அனுமதிக்க காத்திருக்கிறது",
      approved: "அனுமதிக்கப்பட்டது",
      confirmed: "உறுதிசெய்யப்பட்டது",
      rejected: "நிராகரிக்கப்பட்டது",
      cancelled: "ரத்து செய்யப்பட்டது",
      waitlisted: "காத்திருப்பு பட்டியல்",
    },
    errors: {
      load: "உங்கள் செயல்பாடுகளை ஏற்ற முடியவில்லை.",
      register: "இந்த செயல்பாட்டில் சேர முடியவில்லை. மறுபடியும் முயற்சிக்கவும்.",
    },
    messages: {
      loadingRegistered: "உங்கள் செயல்பாடுகள் ஏற்றப்படுகின்றன...",
      noRegistrations:
        "நீங்கள் இன்னும் எந்த செயல்பாட்டிலும் சேரவில்லை. கீழே உள்ள செயல்பாடுகளைப் பாருங்கள்!",
      trailDescriptionFallback: "மேலும் விவரங்கள் விரைவில் வருகிறது.",
      registrationNote: "உங்கள் குறிப்பு: {note}",
      loadingAttendance: "வருகை வரலாறு ஏற்றப்படுகின்றது...",
      noAttendance:
        "இன்னும் எந்த வருகையும் ஏற்பாட்டாளர் உறுதிசெய்யவில்லை. QR குறியீட்டை ஸ்கேன் செய்து பின்னர் பார்க்கவும்!",
      loadingAvailable: "கிடைக்கும் செயல்பாடுகள் ஏற்றப்படுகின்றன...",
      noAvailable: "தற்போது புதிய செயல்பாடுகள் இல்லை - பின்னர் மீண்டும் சரிபார்க்கவும்!",
      availableDescription: "நண்பர்களுடன் புதிய செயல்பாட்டை கண்டறியுங்கள்.",
    },
    labels: {
      trailFallback: "செயல்பாடு",
      trailWithIdFallback: "செயல்பாடு {id}",
    },
    attendance: {
      orgLabel: "அமைப்பு {org}",
    },
    available: {
      capacityStatus: "திறன்: {capacity} | நிலை: {status}",
      capacityUnknown: "பின்னர் அறிவிக்கப்படும்",
      status: {
        open: "திறந்தது",
        active: "செயல்பாட்டில்",
        closed: "மூடப்பட்டது",
        cancelled: "ரத்து",
        draft: "வரைவு",
        full: "நிறைந்தது",
        upcoming: "வரவிருக்கும்",
        unknown: "{status}",
      },
    },
    detail: {
      title: "செயல்பாட்டு விவரங்கள்",
      back: "என் செயல்பாடுகளுக்குத் திரும்ப",
      loading: "செயல்பாட்டு விவரங்கள் ஏற்றப்படுகின்றன...",
      errors: {
        load: "செயல்பாட்டு தகவலை ஏற்ற முடியவில்லை.",
      },
      info: {
        capacity: "திறன்: {capacity}",
        status: "நிலை: {status}",
      },
      registration: {
        heading: "பதிவு நிலை:",
        cancel: "பதிவை ரத்து செய்",
        cancelling: "ரத்து செய்கிறது...",
        cancelError: "இந்த பதிவை ரத்து செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
        noCancel: "இந்த பதிவை இனி ரத்து செய்ய முடியாது.",
        descriptions: {
          pending: "உங்கள் இடம் ஏற்பாட்டாளர் அனுமதியை காத்திருக்கிறது.",
          approved: "அனுமதி கிடைத்தது — ஏற்பாட்டாளர் இன்னும் உங்கள் இடத்தை உறுதி செய்ய வேண்டும்.",
          confirmed: "நீங்கள் உறுதி செய்யப்பட்டுள்ளீர்கள். நேரத்திற்கு வர மறக்காதீர்கள்.",
          rejected: "மன்னிக்கவும், இந்த பதிவு நிராகரிக்கப்பட்டது.",
          cancelled: "இந்த பதிவை நீங்கள் ரத்து செய்துள்ளீர்கள்.",
          waitlisted: "நீங்கள் தற்போது காத்திருப்பு பட்டியலில் உள்ளீர்கள் — இடம் காலியானதும் உங்களுக்கு வழங்கப்படும்.",
          generic: "புதிய தகவல் வந்தவுடன் நாங்கள் தெரிவிப்போம்.",
        },
      },
      callToAction: {
        prompt: "நீங்கள் இன்னும் இந்த செயல்பாட்டில் சேரவில்லை. இப்போது இடத்தை உறுதி செய்க.",
        join: "இந்த செயல்பாட்டில் சேர",
        joining: "சேரப்படுகிறது...",
      },
    },
  },
  rewards: {
    pageTitle: "பரிசுகள்",
    onboarding: {
      title: "பரிசுகளைத் திறக்க வழிகாட்டு செயலியை முடிக்கவும்",
      description:
        "ஏற்பாட்டாளர் உங்களை ஒரு அமைப்பில் சேர்த்த பிறகு தான் பரிசுகள், வவுசர்கள் மற்றும் பாயிண்ட் இருப்பு கிடைக்கும். அவர்கள் பகிரும் அழைப்புக் குறியீட்டை பயன்படுத்தவோ அல்லது ஏற்பாட்டாளர் டாஷ்போர்டில் உங்களை சேர்க்கச் சொல்லவோவும்.",
    },
    actions: {
      enterInvite: "அழைப்புக் குறியீட்டை உள்ளிடவும்",
      backHome: "முதற்பக்கத்துக்கு திரும்ப",
    },
    sections: {
      redeemable: "மாற்றிக்கொள்ளக்கூடிய பரிசுகள்",
      history: "மாற்று வரலாறு",
      pointsHistory: "பாயிண்ட் வரலாறு",
    },
    success: {
      voucher: "{name} வெற்றிகரமாக மாற்றப்பட்டது!",
    },
    labels: {
      voucherFallback: "வவுசர்",
      loading: "பரிசுகள் ஏற்றப்படுகின்றன...",
      noVouchers: "தற்போது பரிசுகள் இல்லை. பின்னர் மீண்டும் பார்க்கவும்!",
      lastUpdated: "கடைசியாக புதுப்பிக்கப்பட்டது {datetime}",
      redeemedAt: "மாற்றிய நேரம் {datetime}",
      noHistory: "இந்த அமைப்பிற்கு இன்னும் பாயிண்ட் செயல்பாடுகள் இல்லை.",
      redeeming: "மாற்றப்படுகிறது...",
      redeem: "மாற்று",
      qtyClaimed: "{count}/{total} பெறப்பட்டது",
      availablePoints: "கிடைக்கும் பாயிண்ட்கள்",
      organisation: "அமைப்பு",
      pendingAssignment:
        "நீங்கள் இன்னும் எந்த அமைப்பிலும் சேர்க்கப்படவில்லை. ஏற்பாட்டாளரிடம் அழைப்புக் குறியீட்டை கேட்கவோ அல்லது 'சேர' பக்கத்தில் குறியீட்டை உள்ளிடவோ செய்து பரிசுகளைச் சேர்த்துக் கொள்ளத் தொடங்குங்கள்.",
      loadingHistory: "உங்கள் பாயிண்ட் வரலாறு ஏற்றப்படுகின்றது...",
      loadingRedemptions: "உங்கள் மாற்று வரலாறு ஏற்றப்படுகின்றது...",
      noRedemptions: "நீங்கள் இன்னும் எந்த பரிசையும் மாற்றவில்லை.",
    },
    messages: {
      presentCode: "இந்த குறியீட்டை ஏற்பாட்டாளருக்கு காட்டவும்:",
      contextWithDate: "{context} - {date}",
    },
    vouchers: {
      cost: "செலவு: {points}",
      status: {
        active: "கிடைக்கிறது",
        inactive: "செயலற்றது",
        expired: "காலாவதியானது",
        scheduled: "திட்டமிடப்பட்டது",
        outOfStock: "எல்லாம் மாற்றப்பட்டது",
        unknown: "{status}",
      },
    },
    history: {
      reason: {
        activityCheckin: "செயல்பாட்டு செக்-இன்",
        trailCheckin: "செயல்பாட்டு பயண செக்-இன்",
        manualBonus: "கையேடு கூடுதல்",
        voucherRedeem: "வவுசர் மாற்று",
      },
      note: {
        qr: "QR",
      },
    },
    redemptions: {
      pointsUsed: "பயன்படுத்திய பாயிண்ட்கள்: {points}",
      code: "குறியீடு: {code}",
      status: {
        pending: "நிலுவை",
        completed: "முடிந்தது",
        redeemed: "மாற்றப்பட்டது",
        fulfilled: "நிறைவேற்றப்பட்டது",
        cancelled: "ரத்து",
        rejected: "நிராகரிக்கப்பட்டது",
        approved: "அனுமதிக்கப்பட்டது",
        generic: "{status}",
      },
      voucherFallback: "வவுசர் {code}",
      voucherIdFallback: "வவுசர் {id}",
    },
  },
  "Please enter your NRIC and 8-digit passcode.": "தயவுசெய்து உங்கள் NRIC மற்றும் 8 இலக்க கடவுச் சொல்லை உள்ளிடுங்கள்.",
  "Unable to log in. Please try again.": "உள் நுழைய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  "Welcome to SilverTrails": "SilverTrails-ற்கு வரவேற்கிறோம்",
  "NRIC / Identifier": "NRIC / அடையாள எண்",
  "e.g. S1234567A": "உதா. S1234567A",
  "Passcode (8-digit)": "கடவுச் சொல் (8 இலக்கம்)",
  DDMMYYYY: "DDMMYYYY",
  "Signing in...": "உள் நுழைகிறது...",
  Login: "உள் நுழை",
  "Not a member?": "உறுப்பினரா இல்லை?",
  "Sign up": "பதிவுசெய்",
  "Have a QR invite?": "QR அழைப்பா உண்டா?",
  "Scan to join": "சேர ஸ்கேன் செய்யவும்",
  "Please enter your full name.": "தயவுசெய்து உங்கள் முழுப்பெயரை உள்ளிடுங்கள்.",
  "Please enter your NRIC.": "தயவுசெய்து உங்கள் NRIC ஐ உள்ளிடுங்கள்.",
  "Passcode must be 8 digits (DDMMYYYY).": "கடவுச் சொல் 8 இலக்கமாக (DDMMYYYY) இருக்க வேண்டும்.",
  "Passcodes do not match.": "கடவுச் சொற்கள் பொருந்தவில்லை.",
  "Unable to sign up. Please try again.": "பதிவுசெய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  "Welcome aboard!": "வரவேற்கிறோம்!",
  "{name}, your SilverTrails account was created successfully.":
    "{name}, உங்கள் SilverTrails கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.",
  "Your SilverTrails account was created successfully.": "உங்கள் SilverTrails கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.",
  "You can now explore your trails, scan QR codes for activities, and collect rewards.":
    "இப்போது உங்கள் செயல்பாடுகளைப் பார்வையிட்டு, QR குறியீடுகளை ஸ்கேன் செய்து பரிசுகளைப் பெறலாம்.",
  "Go to my dashboard": "என் டாஷ்போர்டுக்கு செல்லவும்",
  "Create your account": "உங்கள் கணக்கை உருவாக்குங்கள்",
  "Full name": "முழுப்பெயர்",
  "e.g. Auntie Mei": "உதா. Auntie Mei",
  "Confirm passcode": "கடவுச் சொல்லை உறுதிப்படுத்தவும்",
  "Re-enter passcode": "கடவுச் சொல்லை மீண்டும் உள்ளிடவும்",
  "We use an 8-digit passcode (DDMMYYYY) instead of complex passwords so seniors can sign in easily.":
    "மூத்தவர்கள் எளிதில் உள் நுழைய 8 இலக்க கடவுச்சொல்லை (DDMMYYYY) பயன்படுத்துகிறோம்.",
  "Creating account...": "கணக்கு உருவாக்கப்படுகிறது...",
  "Already have an account?": "ஏற்கனவே கணக்கு உள்ளதா?",
  "Log in": "உள் நுழை",
  "Received an invite QR?": "அழைப்புக் QR கிடைத்ததா?",
  "Scan to join first": "முதலில் ஸ்கேன் செய்து சேரவும்",
};

const messages = {
  en: enMessages,
  zh: zhMessages,
  ms: msMessages,
  ta: taMessages,
};

let currentLocale = DEFAULT_LOCALE;
let initialized = false;

function persistLocale(locale) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage?.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage errors
  }
}

function detectBrowserLocale() {
  if (typeof navigator === "undefined") {
    return null;
  }
  const candidates = Array.isArray(navigator.languages) ? navigator.languages : [navigator.language];
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    const normalized = candidate.toLowerCase().split("-")[0];
    if (messages[normalized]) {
      return normalized;
    }
  }
  return null;
}

export function initLocale() {
  if (initialized) {
    return currentLocale;
  }
  let initial = DEFAULT_LOCALE;
  if (typeof window !== "undefined") {
    try {
      const stored = window.localStorage?.getItem(LOCALE_STORAGE_KEY);
      if (stored && messages[stored]) {
        initial = stored;
      } else {
        const detected = detectBrowserLocale();
        if (detected) {
          initial = detected;
        }
      }
    } catch {
      const detected = detectBrowserLocale();
      if (detected) {
        initial = detected;
      }
    }
  } else {
    const detected = detectBrowserLocale();
    if (detected) {
      initial = detected;
    }
  }
  currentLocale = messages[initial] ? initial : DEFAULT_LOCALE;
  initialized = true;
  persistLocale(currentLocale);
  return currentLocale;
}

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
    persistLocale(locale);
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
  } catch {
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
