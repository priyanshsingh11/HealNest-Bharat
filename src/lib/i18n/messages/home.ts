import { defineMessages } from "@/lib/i18n/config";
import type { CategoryId } from "@/types";

type Step = { title: string; body: string };

/** Homepage: hero, profession strip, search, nursing scope and how-it-works. Care-service copy lives in domain.ts. */
export const homeMessages = defineMessages<{
  hero: {
    eyebrow: string;
    headingBefore: string;
    headingHighlight: string;
    headingAfter: string;
    intro: string;
    findLink: string;
    verifiedCount: string;
    photoAlt: string;
    book: string;
  };
  stats: { verified: string; services: string; reviews: string };
  professionsAria: string;
  professionPlurals: Record<CategoryId, string>;
  findCare: { headingBefore: string; headingHighlight: string; headingAfter: string; subtitle: string };
  search: {
    chooseLocationFirst: string;
    findNearby: string;
    servicesHeading: string;
    servicesLink: string;
    categoriesHeading: string;
    comingSoonTitle: (profession: string) => string;
    soon: string;
  };
  nursingScope: {
    eyebrow: string;
    headingBefore: string;
    headingHighlight: string;
    headingAfter: string;
    intro: string;
    disclaimer: string;
  };
  how: {
    heading: string;
    steps: [Step, Step, Step];
    trustAria: string;
    trust: { verified: Step; pricing: Step; privacy: Step };
    disclaimer: string;
  };
}>({
  en: {
    hero: {
      eyebrow: "Home visits · Across India",
      headingBefore: "Trusted ",
      headingHighlight: "Care",
      headingAfter: " at Your Doorstep",
      intro:
        "Home nursing, injections & IV, physiotherapy and elderly care — from verified professionals near you, with every rupee explained before you book. Home lab collection is coming soon.",
      findLink: "Find a verified professional",
      verifiedCount: "verified professionals",
      photoAlt: "A doctor, a nurse and a caregiver",
      book: "Book a home visit",
    },
    stats: {
      verified: "Verified professionals",
      services: "Home care services",
      reviews: "Reviews from families",
    },
    professionsAria: "Care professionals on HealNest Bharat",
    professionPlurals: {
      nurse: "Nurses",
      physiotherapist: "Physiotherapists",
      phlebotomist: "Lab technicians",
      babysitter: "Nannies",
      caregiver: "Caregivers",
    },
    findCare: {
      headingBefore: "Find ",
      headingHighlight: "care",
      headingAfter: " near you",
      subtitle: "Choose your area, then the help you need.",
    },
    search: {
      chooseLocationFirst: "Choose your area or use your current location first.",
      findNearby: "Find care nearby",
      servicesHeading: "What do you need at home?",
      servicesLink: "Service details & prices →",
      categoriesHeading: "Or choose a professional:",
      comingSoonTitle: (profession) => `${profession} — coming soon`,
      soon: "· Soon",
    },
    nursingScope: {
      eyebrow: "For reference",
      headingBefore: "What home ",
      headingHighlight: "nursing",
      headingAfter: " can involve",
      intro:
        "The areas a registered nurse may work across at home. What happens on your visit is decided by your doctor’s advice, the nurse’s own competency and what you agree with the provider before booking.",
      disclaimer:
        "This is a general description of home nursing, not a list of services HealNest Bharat guarantees. Medicines and injections are given only against a valid prescription from a registered medical practitioner.",
    },
    how: {
      heading: "How it works",
      steps: [
        { title: "Tell us where", body: "Search your area or use your current location." },
        { title: "Choose a provider", body: "Compare distance, availability, ratings, credentials and prices." },
        { title: "Request a visit", body: "Pick a time window, review the full quote and confirm." },
      ],
      trustAria: "Why HealNest Bharat",
      trust: {
        verified: {
          title: "Verified professionals",
          body: "Every provider shows their verification status and registration.",
        },
        pricing: { title: "Itemised pricing", body: "See every charge, line by line, before you confirm." },
        privacy: {
          title: "Your location stays private",
          body: "Shared with a provider only after you confirm a booking.",
        },
      },
      disclaimer:
        "HealNest Bharat connects you with independent providers. It is not an emergency service and does not offer diagnosis or treatment advice. Babysitters and caregivers provide non-medical support only.",
    },
  },
  hi: {
    hero: {
      eyebrow: "घर पर विज़िट · पूरे भारत में",
      headingBefore: "आपके दरवाज़े पर भरोसेमंद ",
      headingHighlight: "देखभाल",
      headingAfter: "",
      intro:
        "होम नर्सिंग, इंजेक्शन और IV, फिजियोथेरेपी और बुज़ुर्गों की देखभाल — आपके आस-पास के सत्यापित प्रोफ़ेशनल्स से, और बुकिंग से पहले हर रुपये का पूरा हिसाब। घर पर लैब सैंपल की सुविधा जल्द आ रही है।",
      findLink: "सत्यापित प्रोफ़ेशनल खोजें",
      verifiedCount: "सत्यापित प्रोफ़ेशनल्स",
      photoAlt: "एक डॉक्टर, एक नर्स और एक देखभालकर्ता",
      book: "घर पर विज़िट बुक करें",
    },
    stats: {
      verified: "सत्यापित प्रोफ़ेशनल्स",
      services: "घर पर देखभाल सेवाएँ",
      reviews: "परिवारों के रिव्यू",
    },
    professionsAria: "HealNest Bharat पर देखभाल प्रोफ़ेशनल्स",
    professionPlurals: {
      nurse: "नर्सें",
      physiotherapist: "फिजियोथेरेपिस्ट",
      phlebotomist: "लैब टेक्नीशियन",
      babysitter: "आया",
      caregiver: "देखभालकर्ता",
    },
    findCare: {
      headingBefore: "अपने आस-पास ",
      headingHighlight: "देखभाल",
      headingAfter: " खोजें",
      subtitle: "पहले अपना इलाका चुनें, फिर बताएँ कि आपको किस मदद की ज़रूरत है।",
    },
    search: {
      chooseLocationFirst: "पहले अपना इलाका चुनें या अपनी मौजूदा लोकेशन इस्तेमाल करें।",
      findNearby: "आस-पास देखभाल खोजें",
      servicesHeading: "घर पर आपको किस चीज़ की ज़रूरत है?",
      servicesLink: "सेवाओं की जानकारी और कीमतें →",
      categoriesHeading: "या कोई प्रोफ़ेशनल चुनें:",
      comingSoonTitle: (profession) => `${profession} — जल्द आ रहा है`,
      soon: "· जल्द",
    },
    nursingScope: {
      eyebrow: "जानकारी के लिए",
      headingBefore: "घर पर ",
      headingHighlight: "नर्सिंग",
      headingAfter: " में क्या-क्या शामिल हो सकता है",
      intro:
        "वे काम जो एक पंजीकृत नर्स घर पर कर सकती है। आपकी विज़िट में असल में क्या होगा, यह आपके डॉक्टर की सलाह, नर्स की अपनी दक्षता और बुकिंग से पहले सेवा प्रदाता के साथ आपकी सहमति पर निर्भर करता है।",
      disclaimer:
        "यह होम नर्सिंग का सामान्य विवरण है, HealNest Bharat द्वारा गारंटी की गई सेवाओं की सूची नहीं। दवाएँ और इंजेक्शन केवल पंजीकृत डॉक्टर के वैध पर्चे पर ही दिए जाते हैं।",
    },
    how: {
      heading: "यह कैसे काम करता है",
      steps: [
        { title: "बताइए कहाँ", body: "अपना इलाका खोजें या अपनी मौजूदा लोकेशन इस्तेमाल करें।" },
        { title: "सेवा प्रदाता चुनें", body: "दूरी, उपलब्धता, रेटिंग, योग्यता और कीमतों की तुलना करें।" },
        { title: "विज़िट का अनुरोध करें", body: "समय चुनें, पूरा खर्च देखें और पक्का करें।" },
      ],
      trustAria: "HealNest Bharat क्यों",
      trust: {
        verified: {
          title: "सत्यापित प्रोफ़ेशनल्स",
          body: "हर सेवा प्रदाता का सत्यापन स्टेटस और पंजीकरण दिखाया जाता है।",
        },
        pricing: { title: "हर शुल्क का पूरा ब्योरा", body: "पक्का करने से पहले हर शुल्क एक-एक करके देखें।" },
        privacy: {
          title: "आपकी लोकेशन निजी रहती है",
          body: "बुकिंग पक्की करने के बाद ही सेवा प्रदाता को बताई जाती है।",
        },
      },
      disclaimer:
        "HealNest Bharat आपको स्वतंत्र सेवा प्रदाताओं से जोड़ता है। यह आपातकालीन सेवा नहीं है और रोग की पहचान या इलाज की सलाह नहीं देता। बेबीसिटर और देखभालकर्ता केवल गैर-चिकित्सा मदद देते हैं।",
    },
  },
});
