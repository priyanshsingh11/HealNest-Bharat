import { defineMessages } from "@/lib/i18n/config";
import type { BookingStatus, SlotStatus } from "@/types";

/** Caretaker dashboard: overview, calendar, slots and reviews pages, plus the shared header, tabs and controls. */
export const providerDashboardMessages = defineMessages<{
  gate: { title: string; notFound: string; openSaved: string; logIn: string; deviceOnly: string; createOne: string; toGetStarted: string };
  nav: { aria: string; overview: string; calendar: string; slots: string; verification: string; reviews: string };
  switcher: { label: string; open: string; failed: string };
  overview: {
    title: string;
    customerPays: (amount: string) => string;
    yourPayout: (amount: string) => string;
    platformFee: (amount: string) => string;
    tax: (amount: string) => string;
    includesEstimates: string;
    queueState: { waiting: string; with: string; attended: string };
    callout: {
      reviewTitle: string;
      reviewBody: string;
      rejectedTitle: string;
      rejectedBody: string;
      startTitle: string;
      startBody: string;
    };
    patient: string;
    stats: { newRequests: string; waiting: string; attendedToday: string; expectedPayout: string };
    payoutNote: (platformShare: string) => string;
    queueTitle: string;
    queueDescription: string;
    queueEmpty: string;
    token: string;
    requestsTitle: (n: number) => string;
    requestsDescription: string;
    requestsEmpty: string;
    upcomingTitle: (n: number) => string;
    upcomingDescription: string;
    upcomingEmpty: string;
    past: string;
    yourRating: string;
    ratingsCount: (n: number) => string;
    readReviews: string;
    serviceArea: string;
    basedIn: (place: string) => string;
    yourBase: string;
    yourServices: string;
    pricesNote: (travelFee: string) => string;
  };
  calendar: {
    title: string;
    now: string;
    inMinutes: (n: number) => string;
    next7: string;
    weekFrom: (day: string) => string;
    summary: (appointments: number, openPlaces: number) => string;
    weeks: string;
    previous: string;
    today: string;
    next: string;
    swipe: string;
    upNext: string;
    noUpcoming: string;
    remindersTitle: string;
    remindersBody: string;
    download: string;
    addressesLeftOut: string;
  };
  week: {
    today: string;
    blocked: string;
    booked: (booked: number, capacity: number) => string;
    legend: string;
    open: string;
    partly: string;
    full: string;
    appointment: string;
    now: string;
  };
  reviews: { title: string; heading: string; description: string };
  schedule: {
    title: string;
    addTitle: string;
    addDescription: string;
    slotsTitle: (days: number) => string;
    slotsDescription: string;
    yourServices: string;
    pricesNote: (travelFee: string) => string;
  };
  controls: {
    somethingWrong: string;
    nextAction: Partial<Record<BookingStatus, string>>;
    markAttended: string;
    accept: string;
    decline: string;
    cancelVisit: string;
    updatingTo: (status: string) => string;
    noSlots: string;
    fullTitle: string;
    clickToBlock: string;
    clickToOpen: string;
    slotStatus: Record<SlotStatus, string>;
    days: string;
    weekdays: string;
    everyDay: string;
    clear: string;
    startIst: string;
    length: string;
    chooseDay: string;
    added: (n: number) => string;
    addSlots: (n: number) => string;
    radius: string;
    saveRadius: string;
    saved: string;
  };
}>({
  en: {
    gate: {
      title: "Provider dashboard",
      notFound: "That caretaker profile wasn't found. ",
      openSaved: "Open one of the caretaker profiles saved on this device, or",
      logIn: "log in as a caretaker",
      deviceOnly: "Caretaker accounts can only be opened from the device they were created on.",
      createOne: "Create one",
      toGetStarted: "to get started.",
    },
    nav: {
      aria: "Dashboard sections",
      overview: "Overview",
      calendar: "Calendar",
      slots: "Slots",
      verification: "Profile & verification",
      reviews: "Ratings & reviews",
    },
    switcher: { label: "Your caretaker profiles", open: "Open provider dashboard", failed: "Could not switch profile" },
    overview: {
      title: "Provider dashboard",
      customerPays: (amount) => `Customer pays ${amount}`,
      yourPayout: (amount) => `your payout ${amount}`,
      platformFee: (amount) => `platform fee & margin ${amount}`,
      tax: (amount) => ` · tax ${amount}`,
      includesEstimates: " · includes estimates",
      queueState: { waiting: "Waiting", with: "With you", attended: "Attended" },
      callout: {
        reviewTitle: "Your verification is under review",
        reviewBody: "HealNest Bharat staff are checking your documents. You'll get the blue verified tick once approved.",
        rejectedTitle: "Your verification needs attention",
        rejectedBody: "See the reviewer's note and resubmit your details.",
        startTitle: "Get verified to start receiving bookings",
        startBody: "Submit your ID, qualifications and registration. Verified caretakers get a blue tick and can be booked.",
      },
      patient: "Patient",
      stats: {
        newRequests: "New requests",
        waiting: "Waiting in today's queue",
        attendedToday: "Attended today",
        expectedPayout: "Expected payout",
      },
      payoutNote: (platformShare) =>
        `Payout covers active and completed visits, from each booking's price snapshot. Platform fee & margin on those: ${platformShare}.`,
      queueTitle: "Today's patient queue",
      queueDescription: "Confirmed patients for today in time order. Mark each one as you see them.",
      queueEmpty: "No confirmed patients for today.",
      token: "Token ",
      requestsTitle: (n) => `Incoming requests (${n})`,
      requestsDescription: "Accept or decline. Customers are notified immediately.",
      requestsEmpty: "No new requests.",
      upcomingTitle: (n) => `Upcoming confirmed (${n})`,
      upcomingDescription: "Accepted visits on other days. They also appear on your calendar.",
      upcomingEmpty: "Nothing else confirmed yet.",
      past: "Past & closed",
      yourRating: "Your rating",
      ratingsCount: (n) => `${n} ratings`,
      readReviews: "Read your reviews →",
      serviceArea: "Service area",
      basedIn: (place) => `Based in ${place}. You receive home-visit requests within this radius.`,
      yourBase: "Your base",
      yourServices: "Your services",
      pricesNote: (travelFee) => `Prices are set with HealNest Bharat admin. Home-visit travel fee ${travelFee}.`,
    },
    calendar: {
      title: "Calendar",
      now: "Now",
      inMinutes: (n) => `In ${n} min`,
      next7: "Next 7 days",
      weekFrom: (day) => `Week from ${day}`,
      summary: (appointments, openPlaces) =>
        `${appointments} ${appointments === 1 ? "appointment" : "appointments"} · ${openPlaces} open ${openPlaces === 1 ? "place" : "places"}`,
      weeks: "Weeks",
      previous: "Previous",
      today: "Today",
      next: "Next",
      swipe: "Swipe sideways to see all 7 days.",
      upNext: "Up next",
      noUpcoming: "No upcoming appointments.",
      remindersTitle: "Reminders on your phone",
      remindersBody:
        "Add your appointments to Google Calendar, Apple Calendar or Outlook, with a reminder 30 minutes before each one. Download again after new bookings.",
      download: "Download calendar (.ics)",
      addressesLeftOut: "Patient addresses are left out of the file.",
    },
    week: {
      today: "Today",
      blocked: "Blocked",
      booked: (booked, capacity) => `${booked}/${capacity} booked`,
      legend: "Legend",
      open: "Open",
      partly: "Partly booked",
      full: "Full",
      appointment: "Appointment",
      now: "Now",
    },
    reviews: {
      title: "Ratings & reviews",
      heading: "What your patients say",
      description:
        "Customers rate completed visits: overall stars, punctuality, how clearly you explain, care & courtesy, and value for money. Reviews from bookings are marked as verified visits.",
    },
    schedule: {
      title: "Slots",
      addTitle: "Add availability",
      addDescription: "Choose the days and a time window. Customers book one visit per slot. Times are IST.",
      slotsTitle: (days) => `Your slots — next ${days} days`,
      slotsDescription: "Click a slot to block or reopen it. Booked slots are managed through their bookings.",
      yourServices: "Your services",
      pricesNote: (travelFee) => `Prices are set with HealNest Bharat admin. Travel fee ${travelFee}.`,
    },
    controls: {
      somethingWrong: "Something went wrong",
      nextAction: {
        ACCEPTED: "Mark on the way",
        ON_THE_WAY: "Mark arrived",
        ARRIVED: "Start visit",
        IN_PROGRESS: "Complete visit",
      },
      markAttended: "Mark attended",
      accept: "Accept",
      decline: "Decline",
      cancelVisit: "Cancel visit",
      updatingTo: (status) => `Updating to ${status}`,
      noSlots: "No slots yet. Add availability above.",
      fullTitle: "Full — manage it through the bookings",
      clickToBlock: "Click to block",
      clickToOpen: "Click to open",
      slotStatus: { open: "open", booked: "full", blocked: "blocked" },
      days: "Days",
      weekdays: "Weekdays",
      everyDay: "Every day",
      clear: "Clear",
      startIst: "Start (IST)",
      length: "Length",
      chooseDay: "Choose at least one day.",
      added: (n) => `Added ${n} ${n === 1 ? "slot" : "slots"}.`,
      addSlots: (n) => `Add ${n > 1 ? `${n} slots` : "slot"}`,
      radius: "Service radius (km)",
      saveRadius: "Save radius",
      saved: "Saved.",
    },
  },
  hi: {
    gate: {
      title: "सेवा प्रदाता डैशबोर्ड",
      notFound: "यह देखभालकर्ता प्रोफ़ाइल नहीं मिली। ",
      openSaved: "इस डिवाइस पर सेव की गई कोई देखभालकर्ता प्रोफ़ाइल खोलें, या",
      logIn: "देखभालकर्ता के रूप में लॉग इन करें",
      deviceOnly: "देखभालकर्ता अकाउंट केवल उसी डिवाइस से खुलते हैं जिस पर वे बनाए गए थे।",
      createOne: "नया अकाउंट बनाएँ",
      toGetStarted: "और शुरू करें।",
    },
    nav: {
      aria: "डैशबोर्ड के हिस्से",
      overview: "सारांश",
      calendar: "कैलेंडर",
      slots: "स्लॉट",
      verification: "प्रोफ़ाइल और सत्यापन",
      reviews: "रेटिंग और रिव्यू",
    },
    switcher: { label: "आपकी देखभालकर्ता प्रोफ़ाइलें", open: "सेवा प्रदाता डैशबोर्ड खोलें", failed: "प्रोफ़ाइल नहीं बदली जा सकी" },
    overview: {
      title: "सेवा प्रदाता डैशबोर्ड",
      customerPays: (amount) => `ग्राहक देगा ${amount}`,
      yourPayout: (amount) => `आपकी कमाई ${amount}`,
      platformFee: (amount) => `प्लेटफ़ॉर्म शुल्क और मार्जिन ${amount}`,
      tax: (amount) => ` · टैक्स ${amount}`,
      includesEstimates: " · अनुमानित राशि शामिल",
      queueState: { waiting: "इंतज़ार में", with: "आपके पास", attended: "देख लिया" },
      callout: {
        reviewTitle: "आपके सत्यापन की जाँच हो रही है",
        reviewBody: "HealNest Bharat की टीम आपके दस्तावेज़ जाँच रही है। मंज़ूरी मिलते ही आपको नीला सत्यापित टिक मिलेगा।",
        rejectedTitle: "आपके सत्यापन पर ध्यान देने की ज़रूरत है",
        rejectedBody: "जाँचकर्ता का नोट देखें और अपनी जानकारी फिर से जमा करें।",
        startTitle: "बुकिंग पाने के लिए सत्यापन कराएँ",
        startBody: "अपना पहचान पत्र, योग्यता और पंजीकरण जमा करें। सत्यापित देखभालकर्ताओं को नीला टिक मिलता है और उन्हें बुक किया जा सकता है।",
      },
      patient: "मरीज़",
      stats: {
        newRequests: "नए अनुरोध",
        waiting: "आज की कतार में इंतज़ार",
        attendedToday: "आज देखे गए",
        expectedPayout: "अनुमानित कमाई",
      },
      payoutNote: (platformShare) =>
        `कमाई में चालू और पूरी हो चुकी विज़िट शामिल हैं, हर बुकिंग के समय की कीमत के अनुसार। इन पर प्लेटफ़ॉर्म शुल्क और मार्जिन: ${platformShare}।`,
      queueTitle: "आज के मरीज़ों की कतार",
      queueDescription: "आज के पक्के मरीज़, समय के क्रम में। हर मरीज़ को देखने के बाद मार्क करें।",
      queueEmpty: "आज के लिए कोई पक्का मरीज़ नहीं है।",
      token: "टोकन ",
      requestsTitle: (n) => `नए अनुरोध (${n})`,
      requestsDescription: "स्वीकार या अस्वीकार करें। ग्राहक को तुरंत सूचना मिलती है।",
      requestsEmpty: "कोई नया अनुरोध नहीं।",
      upcomingTitle: (n) => `आने वाली पक्की बुकिंग (${n})`,
      upcomingDescription: "दूसरे दिनों की स्वीकार की गई विज़िट। ये आपके कैलेंडर में भी दिखती हैं।",
      upcomingEmpty: "अभी और कुछ पक्का नहीं है।",
      past: "पुरानी और बंद बुकिंग",
      yourRating: "आपकी रेटिंग",
      ratingsCount: (n) => `${n} रेटिंग`,
      readReviews: "अपने रिव्यू पढ़ें →",
      serviceArea: "सेवा क्षेत्र",
      basedIn: (place) => `आपका स्थान: ${place}। इस दायरे के अंदर के घर-विज़िट अनुरोध आपको मिलते हैं।`,
      yourBase: "आपका स्थान",
      yourServices: "आपकी सेवाएँ",
      pricesNote: (travelFee) => `कीमतें HealNest Bharat एडमिन के साथ तय होती हैं। घर-विज़िट यात्रा शुल्क ${travelFee}।`,
    },
    calendar: {
      title: "कैलेंडर",
      now: "अभी",
      inMinutes: (n) => `${n} मिनट में`,
      next7: "अगले 7 दिन",
      weekFrom: (day) => `${day} से शुरू होने वाला हफ़्ता`,
      summary: (appointments, openPlaces) => `${appointments} अपॉइंटमेंट · ${openPlaces} खाली जगह`,
      weeks: "हफ़्ते",
      previous: "पिछला",
      today: "आज",
      next: "अगला",
      swipe: "सभी 7 दिन देखने के लिए बगल में स्वाइप करें।",
      upNext: "आगे क्या है",
      noUpcoming: "कोई आने वाला अपॉइंटमेंट नहीं।",
      remindersTitle: "फ़ोन पर रिमाइंडर",
      remindersBody:
        "अपने अपॉइंटमेंट Google Calendar, Apple Calendar या Outlook में जोड़ें, हर एक से 30 मिनट पहले रिमाइंडर के साथ। नई बुकिंग के बाद फिर से डाउनलोड करें।",
      download: "कैलेंडर डाउनलोड करें (.ics)",
      addressesLeftOut: "फ़ाइल में मरीज़ों के पते नहीं होते।",
    },
    week: {
      today: "आज",
      blocked: "बंद",
      booked: (booked, capacity) => `${booked}/${capacity} बुक`,
      legend: "संकेत",
      open: "खाली",
      partly: "कुछ बुक",
      full: "भरा हुआ",
      appointment: "अपॉइंटमेंट",
      now: "अभी",
    },
    reviews: {
      title: "रेटिंग और रिव्यू",
      heading: "आपके मरीज़ क्या कहते हैं",
      description:
        "ग्राहक पूरी हुई विज़िट को रेट करते हैं: कुल स्टार, समय की पाबंदी, आप कितनी साफ़ बात समझाते हैं, देखभाल और व्यवहार, और कीमत के हिसाब से सेवा। बुकिंग से आए रिव्यू सत्यापित विज़िट के रूप में दिखते हैं।",
    },
    schedule: {
      title: "स्लॉट",
      addTitle: "उपलब्धता जोड़ें",
      addDescription: "दिन और समय चुनें। ग्राहक हर स्लॉट में एक विज़िट बुक करते हैं। समय IST में है।",
      slotsTitle: (days) => `आपके स्लॉट — अगले ${days} दिन`,
      slotsDescription: "किसी स्लॉट को बंद करने या फिर से खोलने के लिए उस पर क्लिक करें। बुक हो चुके स्लॉट उनकी बुकिंग से संभाले जाते हैं।",
      yourServices: "आपकी सेवाएँ",
      pricesNote: (travelFee) => `कीमतें HealNest Bharat एडमिन के साथ तय होती हैं। यात्रा शुल्क ${travelFee}।`,
    },
    controls: {
      somethingWrong: "कुछ गड़बड़ हो गई",
      nextAction: {
        ACCEPTED: "रास्ते में हूँ",
        ON_THE_WAY: "पहुँच गया/गई",
        ARRIVED: "विज़िट शुरू करें",
        IN_PROGRESS: "विज़िट पूरी करें",
      },
      markAttended: "देख लिया",
      accept: "स्वीकार करें",
      decline: "अस्वीकार करें",
      cancelVisit: "विज़िट रद्द करें",
      updatingTo: (status) => `${status} में बदला जा रहा है`,
      noSlots: "अभी कोई स्लॉट नहीं। ऊपर उपलब्धता जोड़ें।",
      fullTitle: "भरा हुआ — इसे बुकिंग से संभालें",
      clickToBlock: "बंद करने के लिए क्लिक करें",
      clickToOpen: "खोलने के लिए क्लिक करें",
      slotStatus: { open: "खाली", booked: "भरा हुआ", blocked: "बंद" },
      days: "दिन",
      weekdays: "सोम–शुक्र",
      everyDay: "हर दिन",
      clear: "हटाएँ",
      startIst: "शुरू (IST)",
      length: "अवधि",
      chooseDay: "कम से कम एक दिन चुनें।",
      added: (n) => `${n} स्लॉट जोड़े गए।`,
      addSlots: (n) => (n > 1 ? `${n} स्लॉट जोड़ें` : "स्लॉट जोड़ें"),
      radius: "सेवा दायरा (km)",
      saveRadius: "दायरा सेव करें",
      saved: "सेव हो गया।",
    },
  },
});
