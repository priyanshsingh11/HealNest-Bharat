import { defineMessages } from "@/lib/i18n/config";
import type { CategoryKind } from "@/types";

/** A provider's public profile page. Bio, credentials, policies and service names are provider content and stay as written. */
export const providerMessages = defineMessages<{
  meta: { notFound: string };
  backToResults: string;
  kindNotice: Record<CategoryKind, string>;
  yearsExperience: (years: number) => string;
  reviewCount: (n: number) => string;
  basedIn: (locality: string, city: string) => string;
  fromYou: (distance: string) => string;
  servicesTitle: string;
  servicesDescription: string;
  procedureFee: (amount: string) => string;
  medicines: (amount: string) => string;
  requestThis: string;
  credentialsTitle: string;
  credentialVerified: string;
  credentialUnverified: string;
  regNo: (reference: string) => string;
  areaTitle: string;
  areaText: (km: number, locality: string, fee: string) => string;
  approximateBase: (name: string) => string;
  you: string;
  approximateArea: string;
  cancellationTitle: string;
  reviewsTitle: string;
  reviewsDescription: string;
  requestVisit: string;
  fullPriceNote: string;
  notVerified: string;
  outsideArea: (distance: string, km: number) => string;
  availability: string;
  noWindows: string;
  left: (n: number) => string;
  timesIst: string;
}>({
  en: {
    meta: { notFound: "Provider not found" },
    backToResults: "Back to results",
    kindNotice: {
      medical:
        "Medical service by a registered professional. Home visits are for non-emergency needs only and follow your doctor's written advice where applicable.",
      childcare: "Childcare service — this provider is not a medical professional and cannot give medicines or medical care.",
      non_medical:
        "Non-medical personal care — companionship, mobility and daily-living support. This provider cannot give medicines or medical treatment.",
    },
    yearsExperience: (years) => `${years} years experience`,
    reviewCount: (n) => `(${n} reviews)`,
    basedIn: (locality, city) => `Based in ${locality}, ${city}`,
    fromYou: (distance) => ` · ${distance} from you`,
    servicesTitle: "Services & prices",
    servicesDescription: "Visit fees shown. Travel, platform fee and any estimated items appear in the full quote before you confirm.",
    procedureFee: (amount) => `+ procedure fee ${amount}`,
    medicines: (amount) => `+ optional medicines ~${amount} (estimate)`,
    requestThis: "Request this",
    credentialsTitle: "Credentials & verification",
    credentialVerified: "verified",
    credentialUnverified: "not yet verified",
    regNo: (reference) => ` · Reg. no. ${reference}`,
    areaTitle: "Home-visit area",
    areaText: (km, locality, fee) => `Visits within ${km} km of ${locality}. Travel fee ${fee}.`,
    approximateBase: (name) => `${name} (approximate base)`,
    you: "You",
    approximateArea: "Approximate area.",
    cancellationTitle: "Cancellation & refunds",
    reviewsTitle: "Ratings & reviews",
    reviewsDescription: "From customers after their visit. Reviews marked “Verified visit” come from completed HealNest bookings.",
    requestVisit: "Request home visit",
    fullPriceNote: "You'll see the full price before confirming.",
    notVerified: "This provider hasn't completed verification yet, so bookings are not available.",
    outsideArea: (distance, km) => `Your location is ${distance} away — outside this provider's ${km} km home-visit area.`,
    availability: "Availability",
    noWindows: "No open time windows this week.",
    left: (n) => `· ${n} left`,
    timesIst: "Times are IST.",
  },
  hi: {
    meta: { notFound: "सेवा प्रदाता नहीं मिला" },
    backToResults: "नतीजों पर वापस जाएँ",
    kindNotice: {
      medical:
        "पंजीकृत पेशेवर द्वारा चिकित्सा सेवा। होम विज़िट सिर्फ़ गैर-आपातकालीन ज़रूरतों के लिए है और जहाँ लागू हो, आपके डॉक्टर की लिखित सलाह के अनुसार होती है।",
      childcare: "बच्चों की देखभाल की सेवा — यह सेवा प्रदाता चिकित्सा पेशेवर नहीं है और दवा या चिकित्सा देखभाल नहीं दे सकता।",
      non_medical:
        "गैर-चिकित्सा व्यक्तिगत देखभाल — साथ देना, चलने-फिरने और रोज़मर्रा के कामों में मदद। यह सेवा प्रदाता दवा या इलाज नहीं दे सकता।",
    },
    yearsExperience: (years) => `${years} साल का अनुभव`,
    reviewCount: (n) => `(${n} रिव्यू)`,
    basedIn: (locality, city) => `${locality}, ${city} में स्थित`,
    fromYou: (distance) => ` · आपसे ${distance} दूर`,
    servicesTitle: "सेवाएँ और कीमतें",
    servicesDescription: "यहाँ विज़िट शुल्क दिखाया गया है। यात्रा शुल्क, प्लेटफ़ॉर्म शुल्क और अनुमानित खर्च बुकिंग पक्की करने से पहले पूरे कोटेशन में दिखेंगे।",
    procedureFee: (amount) => `+ प्रक्रिया शुल्क ${amount}`,
    medicines: (amount) => `+ वैकल्पिक दवाएँ ~${amount} (अनुमान)`,
    requestThis: "अनुरोध करें",
    credentialsTitle: "योग्यता और सत्यापन",
    credentialVerified: "सत्यापित",
    credentialUnverified: "अभी सत्यापित नहीं",
    regNo: (reference) => ` · पंजीकरण सं. ${reference}`,
    areaTitle: "होम विज़िट क्षेत्र",
    areaText: (km, locality, fee) => `${locality} से ${km} km के अंदर विज़िट। यात्रा शुल्क ${fee}।`,
    approximateBase: (name) => `${name} (अनुमानित लोकेशन)`,
    you: "आप",
    approximateArea: "अनुमानित क्षेत्र।",
    cancellationTitle: "रद्द करना और रिफ़ंड",
    reviewsTitle: "रेटिंग और रिव्यू",
    reviewsDescription: "विज़िट के बाद ग्राहकों के रिव्यू। “सत्यापित विज़िट” वाले रिव्यू HealNest की पूरी हो चुकी बुकिंग से आते हैं।",
    requestVisit: "होम विज़िट का अनुरोध करें",
    fullPriceNote: "पक्का करने से पहले आपको पूरी कीमत दिखेगी।",
    notVerified: "इस सेवा प्रदाता का सत्यापन अभी पूरा नहीं हुआ है, इसलिए बुकिंग उपलब्ध नहीं है।",
    outsideArea: (distance, km) => `आपकी लोकेशन ${distance} दूर है — यह इस सेवा प्रदाता के ${km} km के होम विज़िट क्षेत्र से बाहर है।`,
    availability: "उपलब्धता",
    noWindows: "इस हफ़्ते कोई खाली समय नहीं है।",
    left: (n) => `· ${n} बाकी`,
    timesIst: "समय IST में है।",
  },
});
