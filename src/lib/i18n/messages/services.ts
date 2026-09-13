import { defineMessages } from "@/lib/i18n/config";

/** The /services catalogue page. Service names, descriptions and scope come from domain.ts. */
export const servicesMessages = defineMessages({
  en: {
    metaTitle: "Home care services",
    eyebrow: "Our services",
    heading: "Care at home, done properly.",
    intro: (available: number, soon: number) =>
      `${available} home services from verified nurses, physiotherapists and caregivers, with ${soon} more coming soon. Prices below are starting visit fees. Your full itemised quote appears before you confirm.`,
    notOpen: "Not open for bookings yet",
    unavailable: "Currently unavailable",
    from: (price: string) => `From ${price}`,
    providedBy: "Provided by",
    findProviders: "Find providers",
    disclaimer: (emergencyNumber: string) =>
      `Home visits are for non-emergency needs only. Medicines and injections are administered only against a valid prescription from a registered medical practitioner. For emergencies, dial ${emergencyNumber}.`,
    scope: {
      aria: "Home nursing care scope",
      heading: "Care scope",
    },
  },
  hi: {
    metaTitle: "घर पर देखभाल सेवाएँ",
    eyebrow: "हमारी सेवाएँ",
    heading: "घर पर देखभाल, सही तरीके से।",
    intro: (available: number, soon: number) =>
      `सत्यापित नर्सों, फिजियोथेरेपिस्ट और देखभालकर्ताओं की ${available} घरेलू सेवाएँ, और ${soon} सेवाएँ जल्द आ रही हैं। नीचे दी गई कीमतें विज़िट का शुरुआती शुल्क हैं। पक्का करने से पहले आपको हर शुल्क के ब्योरे के साथ पूरा खर्च दिखाया जाएगा।`,
    notOpen: "अभी बुकिंग शुरू नहीं हुई है",
    unavailable: "अभी उपलब्ध नहीं",
    from: (price: string) => `${price} से शुरू`,
    providedBy: "सेवा देने वाले",
    findProviders: "सेवा प्रदाता खोजें",
    disclaimer: (emergencyNumber: string) =>
      `घर पर विज़िट केवल गैर-आपातकालीन ज़रूरतों के लिए है। दवाएँ और इंजेक्शन केवल पंजीकृत डॉक्टर के वैध पर्चे पर ही दिए जाते हैं। आपातकाल में ${emergencyNumber} डायल करें।`,
    scope: {
      aria: "होम नर्सिंग देखभाल का दायरा",
      heading: "देखभाल का दायरा",
    },
  },
});
