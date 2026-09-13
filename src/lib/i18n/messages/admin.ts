import { defineMessages } from "@/lib/i18n/config";
import type { LineItemType, VerificationStatus } from "@/types";

/** Staff operations dashboard at /dashboard/admin and its inline editors. */
export const adminMessages = defineMessages<{
  meta: { title: string };
  signedOut: { title: string; body: string; back: string };
  eyebrow: string;
  title: string;
  sectionsLabel: string;
  sections: {
    verification: string;
    providers: string;
    bookings: string;
    pricing: string;
    settings: string;
    catalogue: string;
    audit: string;
  };
  stats: { providers: string; waiting: string; bookings: string; earnings: string };
  verification: {
    title: (n: number) => string;
    description: string;
    empty: string;
    submitted: (when: string) => string;
    rows: {
      mobile: string;
      email: string;
      address: string;
      languages: string;
      experience: string;
      experienceYears: (years: number) => string;
      govtId: string;
      govtIdValue: (type: string, last4: string) => string;
      registration: string;
      police: string;
    };
    workHistory: string;
    workHistoryHint: string;
    noneListed: string;
    present: string;
    current: string;
    contact: (name: string) => string;
    qualifications: string;
    documents: string;
    demoDocuments: string;
    recentlyReviewed: string;
    approved: string;
    rejected: string;
  };
  providers: {
    title: string;
    description: string;
    listingActive: (name: string) => string;
    columns: { provider: string; category: string; city: string; credentials: string; verification: string; listing: string };
  };
  bookings: {
    title: string;
    total: string;
    payout: string;
    columns: {
      booking: string;
      providerService: string;
      status: string;
      total: string;
      payout: string;
      platform: string;
      created: string;
    };
  };
  pricing: { title: string; description: string };
  settings: { title: string; description: string };
  catalogue: {
    categories: string;
    categoryActive: (name: string) => string;
    services: (n: number) => string;
    swipe: string;
    serviceActive: (name: string) => string;
    columns: { service: string; provider: string; basePrice: string; status: string };
  };
  audit: { title: string; description: string; empty: string; by: (role: string) => string };
  controls: {
    somethingWentWrong: string;
    saved: string;
    save: string;
    active: string;
    inactive: string;
    verificationFor: (name: string) => string;
    verificationOptions: Record<VerificationStatus, string>;
    reviewerNote: string;
    reviewerNotePlaceholder: string;
    approve: string;
    reject: string;
    categoryDescription: (name: string) => string;
    basePriceFor: (name: string) => string;
    appliesTo: (item: string) => string;
    lineItems: Record<LineItemType, string>;
    mode: string;
    fixed: string;
    percent: string;
    amount: string;
    percentValue: string;
    taxLabel: string;
    taxRate: string;
    quoteValidity: string;
    emergencyNumber: string;
    taxAppliesTo: string;
    taxable: Record<Exclude<LineItemType, "tax">, string>;
    refundPolicy: string;
    requirePrescription: string;
    prescriptionNote: string;
    licensingNote: string;
    saveSettings: string;
  };
}>({
  en: {
    meta: { title: "Admin" },
    signedOut: {
      title: "Admin",
      body: "This area is for HealNest staff. Sign in with your staff account to continue.",
      back: "Back to HealNest Bharat",
    },
    eyebrow: "Admin",
    title: "Operations",
    sectionsLabel: "Admin sections",
    sections: {
      verification: "Verification requests",
      providers: "Providers",
      bookings: "Bookings",
      pricing: "Pricing & margins",
      settings: "Settings",
      catalogue: "Categories & services",
      audit: "Audit log",
    },
    stats: {
      providers: "Providers",
      waiting: "Verification requests waiting",
      bookings: "Bookings",
      earnings: "Platform earnings (live bookings)",
    },
    verification: {
      title: (n) => `Verification requests (${n})`,
      description:
        "Check each caretaker's identity, qualifications, work history and registration against their documents before approving. Approval gives them the blue verified tick and makes them bookable.",
      empty: "No applications waiting for review.",
      submitted: (when) => `Submitted ${when}`,
      rows: {
        mobile: "Mobile",
        email: "Email",
        address: "Address",
        languages: "Languages",
        experience: "Experience",
        experienceYears: (years) => `${years} years`,
        govtId: "Government ID",
        govtIdValue: (type, last4) => `${type} ending ${last4}`,
        registration: "Registration",
        police: "Police verification",
      },
      workHistory: "Work history",
      workHistoryHint: "— call the organisation to cross-verify",
      noneListed: "None listed",
      present: "present",
      current: "Current",
      contact: (name) => `Contact: ${name}`,
      qualifications: "Qualifications",
      documents: "Documents",
      demoDocuments: "Demo: file names only — connect document storage before going live.",
      recentlyReviewed: "Recently reviewed",
      approved: "Approved",
      rejected: "Rejected",
    },
    providers: {
      title: "Provider verification",
      description: "Only verified providers can receive bookings. Every change is written to the audit log.",
      listingActive: (name) => `${name} listing active`,
      columns: {
        provider: "Provider",
        category: "Category",
        city: "City",
        credentials: "Credentials",
        verification: "Verification",
        listing: "Listing",
      },
    },
    bookings: {
      title: "Bookings by status",
      total: "Total",
      payout: "Payout",
      columns: {
        booking: "Booking",
        providerService: "Provider / service",
        status: "Status",
        total: "Total",
        payout: "Payout",
        platform: "Platform",
        created: "Created",
      },
    },
    pricing: {
      title: "Pricing rules & platform margin",
      description:
        "Margins are always disclosed to customers as separate amounts. Changes apply to new quotes only — booked price snapshots never change.",
    },
    settings: {
      title: "Country settings",
      description: "Tax, refunds, prescription and licensing are configurable — nothing is hardcoded for one country.",
    },
    catalogue: {
      categories: "Categories",
      categoryActive: (name) => `${name} category active`,
      services: (n) => `Services (${n})`,
      swipe: "Swipe sideways to see all columns.",
      serviceActive: (name) => `${name} active`,
      columns: { service: "Service", provider: "Provider", basePrice: "Base price", status: "Status" },
    },
    audit: {
      title: "Audit log",
      description: "Quote snapshots, booking status changes, verification, reviews and pricing changes.",
      empty: "No changes recorded yet in this session.",
      by: (role) => `by ${role}`,
    },
    controls: {
      somethingWentWrong: "Something went wrong",
      saved: "Saved",
      save: "Save",
      active: "Active",
      inactive: "Inactive",
      verificationFor: (name) => `Verification status for ${name}`,
      verificationOptions: { verified: "Verified", pending: "Pending", unverified: "Unverified", rejected: "Rejected" },
      reviewerNote: "Reviewer note",
      reviewerNotePlaceholder: "Required when rejecting — tell the caretaker what to fix.",
      approve: "Approve & verify",
      reject: "Reject",
      categoryDescription: (name) => `${name} — description`,
      basePriceFor: (name) => `Base price in rupees for ${name}`,
      appliesTo: (item) => `Applies to: ${item} line`,
      lineItems: {
        visit: "visit",
        procedure: "procedure",
        medicine: "medicine",
        travel: "travel",
        platform_fee: "platform fee",
        tax: "tax",
      },
      mode: "Mode",
      fixed: "Fixed ₹",
      percent: "Percent %",
      amount: "Amount (₹)",
      percentValue: "Percent (%)",
      taxLabel: "Tax label",
      taxRate: "Tax rate (%)",
      quoteValidity: "Quote validity (min)",
      emergencyNumber: "Emergency number",
      taxAppliesTo: "Tax applies to",
      taxable: {
        visit: "Visit fee",
        procedure: "Procedure fee",
        medicine: "Medicines",
        travel: "Travel fee",
        platform_fee: "Platform fee",
      },
      refundPolicy: "Refund policy",
      requirePrescription: "Require a prescription for medicines",
      prescriptionNote: "Prescription note",
      licensingNote: "Licensing note",
      saveSettings: "Save settings",
    },
  },
  hi: {
    meta: { title: "एडमिन" },
    signedOut: {
      title: "एडमिन",
      body: "यह हिस्सा HealNest स्टाफ के लिए है। आगे बढ़ने के लिए अपने स्टाफ अकाउंट से लॉग इन करें।",
      back: "HealNest Bharat पर वापस जाएँ",
    },
    eyebrow: "एडमिन",
    title: "संचालन",
    sectionsLabel: "एडमिन सेक्शन",
    sections: {
      verification: "सत्यापन अनुरोध",
      providers: "सेवा प्रदाता",
      bookings: "बुकिंग",
      pricing: "कीमत और मार्जिन",
      settings: "सेटिंग्स",
      catalogue: "श्रेणियाँ और सेवाएँ",
      audit: "ऑडिट लॉग",
    },
    stats: {
      providers: "सेवा प्रदाता",
      waiting: "बाकी सत्यापन अनुरोध",
      bookings: "बुकिंग",
      earnings: "प्लेटफ़ॉर्म की कमाई (चालू बुकिंग)",
    },
    verification: {
      title: (n) => `सत्यापन अनुरोध (${n})`,
      description:
        "मंज़ूरी देने से पहले हर देखभालकर्ता की पहचान, योग्यता, काम का अनुभव और पंजीकरण उनके दस्तावेज़ों से मिलाएँ। मंज़ूरी मिलने पर उन्हें नीला सत्यापित निशान मिलता है और उनकी बुकिंग हो सकती है।",
      empty: "समीक्षा के लिए कोई आवेदन बाकी नहीं है।",
      submitted: (when) => `जमा किया: ${when}`,
      rows: {
        mobile: "मोबाइल",
        email: "ईमेल",
        address: "पता",
        languages: "भाषाएँ",
        experience: "अनुभव",
        experienceYears: (years) => `${years} साल`,
        govtId: "सरकारी पहचान पत्र",
        govtIdValue: (type, last4) => `${type}, आखिरी अंक ${last4}`,
        registration: "पंजीकरण",
        police: "पुलिस सत्यापन",
      },
      workHistory: "काम का अनुभव",
      workHistoryHint: "— पुष्टि के लिए संस्था को फ़ोन करें",
      noneListed: "कुछ नहीं दिया गया",
      present: "अब तक",
      current: "वर्तमान",
      contact: (name) => `संपर्क: ${name}`,
      qualifications: "योग्यताएँ",
      documents: "दस्तावेज़",
      demoDocuments: "डेमो: सिर्फ़ फ़ाइल के नाम — लाइव करने से पहले दस्तावेज़ स्टोरेज जोड़ें।",
      recentlyReviewed: "हाल ही में समीक्षा किए गए",
      approved: "मंज़ूर",
      rejected: "अस्वीकार",
    },
    providers: {
      title: "सेवा प्रदाता सत्यापन",
      description: "सिर्फ़ सत्यापित सेवा प्रदाताओं को ही बुकिंग मिल सकती है। हर बदलाव ऑडिट लॉग में दर्ज होता है।",
      listingActive: (name) => `${name} की लिस्टिंग चालू`,
      columns: {
        provider: "सेवा प्रदाता",
        category: "श्रेणी",
        city: "शहर",
        credentials: "प्रमाणपत्र",
        verification: "सत्यापन",
        listing: "लिस्टिंग",
      },
    },
    bookings: {
      title: "स्थिति के अनुसार बुकिंग",
      total: "कुल",
      payout: "भुगतान",
      columns: {
        booking: "बुकिंग",
        providerService: "सेवा प्रदाता / सेवा",
        status: "स्थिति",
        total: "कुल",
        payout: "भुगतान",
        platform: "प्लेटफ़ॉर्म",
        created: "बनाई गई",
      },
    },
    pricing: {
      title: "कीमत के नियम और प्लेटफ़ॉर्म मार्जिन",
      description:
        "मार्जिन ग्राहकों को हमेशा अलग राशि के रूप में दिखाया जाता है। बदलाव सिर्फ़ नए कोटेशन पर लागू होते हैं — बुक हो चुकी कीमतें कभी नहीं बदलतीं।",
    },
    settings: {
      title: "देश की सेटिंग्स",
      description: "टैक्स, रिफ़ंड, पर्चा और लाइसेंस से जुड़ी बातें बदली जा सकती हैं — किसी एक देश के लिए कुछ भी तय नहीं है।",
    },
    catalogue: {
      categories: "श्रेणियाँ",
      categoryActive: (name) => `${name} श्रेणी चालू`,
      services: (n) => `सेवाएँ (${n})`,
      swipe: "सभी कॉलम देखने के लिए बगल में स्वाइप करें।",
      serviceActive: (name) => `${name} चालू`,
      columns: { service: "सेवा", provider: "सेवा प्रदाता", basePrice: "मूल कीमत", status: "स्थिति" },
    },
    audit: {
      title: "ऑडिट लॉग",
      description: "कोटेशन, बुकिंग की स्थिति में बदलाव, सत्यापन, रिव्यू और कीमत में बदलाव।",
      empty: "इस सेशन में अभी तक कोई बदलाव दर्ज नहीं हुआ।",
      by: (role) => `द्वारा: ${role}`,
    },
    controls: {
      somethingWentWrong: "कुछ गड़बड़ हो गई",
      saved: "सेव हो गया",
      save: "सेव करें",
      active: "चालू",
      inactive: "बंद",
      verificationFor: (name) => `${name} की सत्यापन स्थिति`,
      verificationOptions: { verified: "सत्यापित", pending: "बाकी", unverified: "सत्यापित नहीं", rejected: "अस्वीकार" },
      reviewerNote: "समीक्षक की टिप्पणी",
      reviewerNotePlaceholder: "अस्वीकार करते समय ज़रूरी — देखभालकर्ता को बताएँ कि क्या ठीक करना है।",
      approve: "मंज़ूर और सत्यापित करें",
      reject: "अस्वीकार करें",
      categoryDescription: (name) => `${name} — विवरण`,
      basePriceFor: (name) => `${name} की मूल कीमत (रुपये में)`,
      appliesTo: (item) => `लागू: ${item} वाली लाइन पर`,
      lineItems: {
        visit: "विज़िट",
        procedure: "प्रक्रिया",
        medicine: "दवा",
        travel: "यात्रा",
        platform_fee: "प्लेटफ़ॉर्म शुल्क",
        tax: "टैक्स",
      },
      mode: "तरीका",
      fixed: "तय ₹",
      percent: "प्रतिशत %",
      amount: "राशि (₹)",
      percentValue: "प्रतिशत (%)",
      taxLabel: "टैक्स का नाम",
      taxRate: "टैक्स दर (%)",
      quoteValidity: "कोटेशन की वैधता (मिनट)",
      emergencyNumber: "इमरजेंसी नंबर",
      taxAppliesTo: "टैक्स किस पर लगेगा",
      taxable: {
        visit: "विज़िट शुल्क",
        procedure: "प्रक्रिया शुल्क",
        medicine: "दवाइयाँ",
        travel: "यात्रा शुल्क",
        platform_fee: "प्लेटफ़ॉर्म शुल्क",
      },
      refundPolicy: "रिफ़ंड नीति",
      requirePrescription: "दवाइयों के लिए पर्चा ज़रूरी करें",
      prescriptionNote: "पर्चे से जुड़ी टिप्पणी",
      licensingNote: "लाइसेंस से जुड़ी टिप्पणी",
      saveSettings: "सेटिंग्स सेव करें",
    },
  },
});
