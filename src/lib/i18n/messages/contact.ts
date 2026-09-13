import { SUPPORT_HOURS } from "@/lib/contact";
import { defineMessages } from "@/lib/i18n/config";

/** The /contact page. Support is by WhatsApp chat and email only. */
export const contactMessages = defineMessages({
  en: {
    metaTitle: "Contact Us – HealNest Bharat",
    metaDescription: "Reach out to the HealNest Bharat team for support, partnership enquiries or general questions.",
    eyebrow: "Get in touch",
    heading: "Contact us",
    intro: "Have a question or need help with a booking? Message us on WhatsApp or send an email and our team will help you.",
    whatsapp: { heading: "WhatsApp", body: `Chat with us · ${SUPPORT_HOURS}` },
    email: { heading: "Email", body: "We reply within 24 hours" },
    instagram: { heading: "Instagram", body: "Follow us for updates" },
    emergencyBefore: "For medical emergencies, please dial ",
    emergencyAfter: " immediately.",
  },
  hi: {
    metaTitle: "संपर्क करें – HealNest Bharat",
    metaDescription: "सहायता, साझेदारी या किसी भी सवाल के लिए HealNest Bharat टीम से संपर्क करें।",
    eyebrow: "हमसे जुड़ें",
    heading: "संपर्क करें",
    intro: "कोई सवाल है या बुकिंग में मदद चाहिए? हमें WhatsApp पर मैसेज करें या ईमेल भेजें, हमारी टीम आपकी मदद करेगी।",
    whatsapp: { heading: "WhatsApp", body: "हमसे चैट करें · सोम – शनि, सुबह 9 – शाम 7 बजे (IST)" },
    email: { heading: "ईमेल", body: "हम 24 घंटे के अंदर जवाब देते हैं" },
    instagram: { heading: "Instagram", body: "नई जानकारी के लिए हमें फ़ॉलो करें" },
    emergencyBefore: "मेडिकल इमरजेंसी में तुरंत ",
    emergencyAfter: " डायल करें।",
  },
});
