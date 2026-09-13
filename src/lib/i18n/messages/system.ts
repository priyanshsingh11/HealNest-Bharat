import { defineMessages } from "@/lib/i18n/config";

/** Site-wide notices and fallback screens: the emergency banner, 404 and the error boundary. */
export const systemMessages = defineMessages({
  en: {
    emergency: {
      aria: "Emergency notice",
      lead: "For life-threatening emergencies, contact local emergency services",
      dialBefore: " (dial ",
      dialAfter: " in India). HealNest Bharat does not provide emergency care or diagnosis.",
    },
    notFound: {
      eyebrow: "Error 404",
      heading: "We couldn't find that page",
      body: "The provider or booking may no longer exist, or the link may be incorrect.",
      findCare: "Find care",
      home: "Home",
    },
    error: {
      heading: "Something went wrong",
      body: "We couldn't load this page. Please try again. If you need urgent medical help, call 112.",
      retry: "Try again",
      home: "Go home",
    },
  },
  hi: {
    emergency: {
      aria: "आपातकालीन सूचना",
      lead: "जान का खतरा होने पर स्थानीय आपातकालीन सेवाओं से संपर्क करें",
      dialBefore: " (भारत में ",
      dialAfter: " डायल करें)। HealNest Bharat आपातकालीन देखभाल या रोग की पहचान नहीं करता।",
    },
    notFound: {
      eyebrow: "त्रुटि 404",
      heading: "हमें यह पेज नहीं मिला",
      body: "हो सकता है वह सेवा प्रदाता या बुकिंग अब मौजूद न हो, या लिंक गलत हो।",
      findCare: "देखभाल खोजें",
      home: "होम",
    },
    error: {
      heading: "कुछ गड़बड़ हो गई",
      body: "यह पेज लोड नहीं हो सका। कृपया फिर से कोशिश करें। तुरंत मेडिकल मदद चाहिए तो 112 पर कॉल करें।",
      retry: "फिर से कोशिश करें",
      home: "होम पर जाएँ",
    },
  },
});
