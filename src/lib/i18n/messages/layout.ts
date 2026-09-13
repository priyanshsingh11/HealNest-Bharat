import { defineMessages } from "@/lib/i18n/config";

/** Header, footer and other chrome around every page. */
export const layoutMessages = defineMessages({
  en: {
    skipToContent: "Skip to content",
    tagline: "Verified care at your doorstep",
    nav: {
      home: "Home",
      discover: "Find care",
      services: "Services",
      bookings: "My bookings",
      dashboard: "Dashboard",
      admin: "Admin",
      main: "Main",
      mobile: "Mobile",
    },
    caretakerLabel: (profession: string) => `Caretaker · ${profession}`,
    logIn: "Log in",
    logOut: "Log out",
    logOutFailed: "Could not log out",
    openMenu: "Open menu",
    footer: {
      about:
        "India's trusted marketplace for verified home-visit care — nurses, physiotherapists, lab technicians, nannies and caregivers, right at your doorstep.",
      notMedical: "Not a medical provider. For emergencies dial",
      platform: "Platform",
      signIn: "Sign in",
      support: "Support",
      contact: "Contact us",
      getInTouch: "Get in touch",
      hours: "Mon – Sat, 9 am – 7 pm IST",
      whatsappAria: (number: string) => `Chat with us on WhatsApp at ${number}`,
    },
  },
  hi: {
    skipToContent: "मुख्य सामग्री पर जाएँ",
    tagline: "आपके दरवाज़े पर सत्यापित देखभाल",
    nav: {
      home: "होम",
      discover: "देखभाल खोजें",
      services: "सेवाएँ",
      bookings: "मेरी बुकिंग",
      dashboard: "डैशबोर्ड",
      admin: "एडमिन",
      main: "मुख्य",
      mobile: "मोबाइल",
    },
    caretakerLabel: (profession: string) => `देखभालकर्ता · ${profession}`,
    logIn: "लॉग इन",
    logOut: "लॉग आउट",
    logOutFailed: "लॉग आउट नहीं हो सका",
    openMenu: "मेन्यू खोलें",
    footer: {
      about:
        "सत्यापित होम-विज़िट देखभाल के लिए भारत का भरोसेमंद प्लेटफ़ॉर्म — नर्स, फिजियोथेरेपिस्ट, लैब टेक्नीशियन, आया और देखभालकर्ता, सीधे आपके घर पर।",
      notMedical: "हम चिकित्सा सेवा प्रदाता नहीं हैं। आपातकाल में डायल करें",
      platform: "प्लेटफ़ॉर्म",
      signIn: "साइन इन",
      support: "सहायता",
      contact: "संपर्क करें",
      getInTouch: "हमसे जुड़ें",
      hours: "सोम – शनि, सुबह 9 – शाम 7 बजे (IST)",
      whatsappAria: (number: string) => `WhatsApp पर ${number} पर हमसे चैट करें`,
    },
  },
});
