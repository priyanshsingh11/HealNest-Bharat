import { DEFAULT_CATEGORIES } from "@/lib/categories";
import type { CareService } from "@/lib/care-services";
import { defineMessages, type Locale } from "@/lib/i18n/config";
import type {
  BookingStatus,
  CareServiceId,
  Category,
  CategoryId,
  CategoryKind,
  DocumentKind,
  GovtIdType,
  Role,
  VerificationStatus,
} from "@/types";

// Vocabulary shared across the whole site: professions, booking statuses, roles and the care-service catalogue.
// The English values mirror the constants in src/lib (which API code and tests still use).

type CategoryCopy = { name: string; shortName: string; description: string };
type CareServiceCopy = Pick<CareService, "name" | "summary" | "description" | "includes" | "note" | "scope">;

export const domainMessages = defineMessages<{
  professions: Record<CategoryId, string>;
  kinds: Record<CategoryKind, string>;
  categories: Record<CategoryId, CategoryCopy>;
  roles: Record<Role, string>;
  statuses: Record<BookingStatus, string>;
  verification: Record<VerificationStatus, string>;
  govtIds: Record<GovtIdType, string>;
  documents: Record<DocumentKind, string>;
  registration: Record<CategoryId, string>;
  comingSoon: string;
  verified: string;
  verifiedBy: string;
  /** Replaces the English copy of each catalogue service; ids and `providedBy` stay in src/lib/care-services.ts. */
  careServices: Record<CareServiceId, CareServiceCopy> | null;
}>({
  en: {
    professions: {
      nurse: "Nurse",
      physiotherapist: "Physiotherapist",
      phlebotomist: "Lab technician",
      babysitter: "Nanny / Babysitter",
      caregiver: "Caregiver",
    },
    kinds: {
      medical: "Medical service",
      childcare: "Childcare — non-medical",
      non_medical: "Personal care — non-medical",
    },
    categories: Object.fromEntries(
      DEFAULT_CATEGORIES.map(({ id, name, shortName, description }) => [id, { name, shortName, description }]),
    ) as Record<CategoryId, CategoryCopy>,
    roles: { user: "Customer", provider: "Provider", admin: "Admin" },
    statuses: {
      REQUESTED: "Requested",
      ACCEPTED: "Accepted",
      ON_THE_WAY: "On the way",
      ARRIVED: "Arrived",
      IN_PROGRESS: "In progress",
      COMPLETED: "Completed",
      DECLINED: "Declined",
      CANCELLED: "Cancelled",
    },
    verification: {
      verified: "Verified",
      pending: "Verification pending",
      unverified: "Not verified",
      rejected: "Verification rejected",
    },
    govtIds: {
      aadhaar: "Aadhaar",
      pan: "PAN card",
      voter_id: "Voter ID",
      passport: "Passport",
      driving_licence: "Driving licence",
    },
    documents: {
      photo_id: "Government photo ID",
      degree: "Degree or qualification certificate",
      registration: "Council registration certificate",
      police: "Police verification certificate",
      training: "Training certificate",
      other: "Other supporting document",
    },
    registration: {
      nurse: "Nurse registration",
      physiotherapist: "Physiotherapy registration",
      phlebotomist: "Registration",
      babysitter: "Registration",
      caregiver: "Registration",
    },
    comingSoon: "Coming soon",
    verified: "Verified",
    verifiedBy: "Verified by HealNest Bharat",
    careServices: null,
  },
  hi: {
    professions: {
      nurse: "नर्स",
      physiotherapist: "फिजियोथेरेपिस्ट",
      phlebotomist: "लैब टेक्नीशियन",
      babysitter: "आया / बेबीसिटर",
      caregiver: "देखभालकर्ता",
    },
    kinds: {
      medical: "चिकित्सा सेवा",
      childcare: "बच्चों की देखभाल — गैर-चिकित्सा",
      non_medical: "व्यक्तिगत देखभाल — गैर-चिकित्सा",
    },
    categories: {
      nurse: {
        name: "होम नर्स",
        shortName: "नर्स",
        description: "घर पर इंजेक्शन, घाव की ड्रेसिंग, वाइटल्स की निगरानी और ऑपरेशन के बाद की देखभाल के लिए पंजीकृत नर्सें।",
      },
      physiotherapist: {
        name: "फिजियोथेरेपिस्ट",
        shortName: "फिजियो",
        description: "घर पर दर्द से राहत, रिहैबिलिटेशन और चलने-फिरने के सेशन के लिए योग्य फिजियोथेरेपिस्ट।",
      },
      phlebotomist: {
        name: "घर पर लैब सैंपल",
        shortName: "लैब टेस्ट",
        description: "प्रशिक्षित फ्लेबोटोमिस्ट जो घर से खून और अन्य सैंपल लेकर पार्टनर लैब में जाँच के लिए पहुँचाते हैं।",
      },
      babysitter: {
        name: "बेबीसिटर / आया",
        shortName: "बेबीसिटर",
        description: "घर पर बच्चों की देखभाल के लिए बैकग्राउंड-जाँची गई बेबीसिटर और आया। यह चिकित्सा सेवा नहीं है।",
      },
      caregiver: {
        name: "देखभालकर्ता",
        shortName: "देखभालकर्ता",
        description: "बुज़ुर्गों के साथ रहने, चलने-फिरने और रोज़मर्रा के कामों में मदद के लिए प्रशिक्षित देखभालकर्ता। यह चिकित्सा सेवा नहीं है।",
      },
    },
    roles: { user: "ग्राहक", provider: "सेवा प्रदाता", admin: "एडमिन" },
    statuses: {
      REQUESTED: "अनुरोध भेजा गया",
      ACCEPTED: "स्वीकार किया गया",
      ON_THE_WAY: "रास्ते में",
      ARRIVED: "पहुँच गए",
      IN_PROGRESS: "जारी है",
      COMPLETED: "पूरा हुआ",
      DECLINED: "अस्वीकार किया गया",
      CANCELLED: "रद्द किया गया",
    },
    verification: {
      verified: "सत्यापित",
      pending: "सत्यापन बाकी है",
      unverified: "सत्यापित नहीं",
      rejected: "सत्यापन अस्वीकार",
    },
    govtIds: {
      aadhaar: "आधार",
      pan: "पैन कार्ड",
      voter_id: "वोटर आईडी",
      passport: "पासपोर्ट",
      driving_licence: "ड्राइविंग लाइसेंस",
    },
    documents: {
      photo_id: "सरकारी फोटो पहचान पत्र",
      degree: "डिग्री या योग्यता प्रमाणपत्र",
      registration: "काउंसिल पंजीकरण प्रमाणपत्र",
      police: "पुलिस सत्यापन प्रमाणपत्र",
      training: "प्रशिक्षण प्रमाणपत्र",
      other: "अन्य सहायक दस्तावेज़",
    },
    registration: {
      nurse: "नर्स पंजीकरण",
      physiotherapist: "फिजियोथेरेपी पंजीकरण",
      phlebotomist: "पंजीकरण",
      babysitter: "पंजीकरण",
      caregiver: "पंजीकरण",
    },
    comingSoon: "जल्द आ रहा है",
    verified: "सत्यापित",
    verifiedBy: "HealNest Bharat द्वारा सत्यापित",
    careServices: {
      "home-nursing": {
        name: "होम नर्सिंग",
        summary: "घर पर विज़िट या पूरी शिफ्ट के लिए पंजीकृत नर्सें।",
        description: "नियमित नर्सिंग देखभाल, वाइटल्स की निगरानी और दिन या रात की शिफ्ट के लिए घर पर पंजीकृत नर्स।",
        includes: ["वाइटल्स: बीपी, पल्स, SpO₂, तापमान, शुगर", "डॉक्टर के पर्चे के अनुसार दवा की याद दिलाना", "12 घंटे की दिन या रात की नर्सिंग शिफ्ट"],
        scope: [
          { title: "मरीज़ की निगरानी", description: "बीपी, पल्स, तापमान, SpO₂, साँस की दर, ब्लड शुगर, होश, दर्द और समग्र स्थिति; हालत बिगड़ने पर तुरंत सूचना।" },
          { title: "दवा और उपचार", description: "पर्चे की दवाएँ, इंजेक्शन, IV फ्लूइड, इंसुलिन और नेबुलाइज़ेशन; दवा का समय तय करना और निगरानी।" },
          { title: "बुनियादी नर्सिंग देखभाल", description: "व्यक्तिगत स्वच्छता, मुँह की सफ़ाई, खाना खिलाना, कपड़े/चादर बदलना, करवट दिलाना, बेडसोर से बचाव और चलने में मदद।" },
          { title: "कैथेटर/ट्यूब देखभाल", description: "फोली कैथेटर, NG/फीडिंग ट्यूब, ड्रेन, ट्रेकियोस्टोमी और ओस्टोमी की देखभाल, पेशाब की मात्रा की निगरानी सहित।" },
          { title: "घाव की देखभाल", description: "ड्रेसिंग, ऑपरेशन के बाद और बेडसोर की देखभाल, संक्रमण की निगरानी और कीटाणुरहित तरीका।" },
          { title: "साँस संबंधी देखभाल", description: "मरीज़ की ज़रूरत और नर्स की दक्षता के अनुसार ऑक्सीजन थेरेपी, नेबुलाइज़ेशन, सक्शन और ट्रेकियोस्टोमी देखभाल।" },
          { title: "पोषण और मल-मूत्र", description: "खाना खिलाना, ट्यूब फीडिंग, इनटेक/आउटपुट की निगरानी, डायपर बदलना और मल-मूत्र संबंधी देखभाल।" },
          { title: "रिकॉर्ड रखना", description: "नर्सिंग नोट्स, वाइटल्स/दवा/इनटेक-आउटपुट का रिकॉर्ड और मरीज़ की हालत में बड़े बदलाव की जानकारी देना।" },
        ],
      },
      "injection-iv": {
        name: "इंजेक्शन और IV",
        summary: "डॉक्टर के लिखे इंजेक्शन और IV ड्रिप घर पर।",
        description: "पंजीकृत नर्स द्वारा मांसपेशी, त्वचा के नीचे और नस में इंजेक्शन, और IV इन्फ्यूज़न।",
        includes: ["IM / SC / IV इंजेक्शन", "IV ड्रिप और इन्फ्यूज़न लगाना और निगरानी", "कैनुला की देखभाल"],
        note: "पंजीकृत डॉक्टर का वैध पर्चा ज़रूरी है।",
      },
      "wound-dressing": {
        name: "घाव की ड्रेसिंग",
        summary: "डॉक्टर की सलाह के अनुसार घाव की सफ़ाई और ड्रेसिंग।",
        description: "ऑपरेशन के घाव, चोट, अल्सर और बेडसोर की कीटाणुरहित सफ़ाई और ड्रेसिंग।",
        includes: ["ऑपरेशन और ऑपरेशन के बाद के घाव", "डायबिटिक फुट और प्रेशर अल्सर", "टांके और स्टेपल की देखभाल"],
      },
      "catheter-care": {
        name: "कैथेटर देखभाल",
        summary: "पेशाब की नली (कैथेटर) लगाना, बदलना और निकालना।",
        description: "प्रशिक्षित नर्स द्वारा यूरिनरी कैथेटर लगाना, नियमित रूप से बदलना, निकालना और बैग की देखभाल।",
        includes: ["फोली कैथेटर लगाना और बदलना", "कैथेटर निकालना", "स्वच्छता और संक्रमण से बचाव"],
        note: "कैथेटर लगाना और बदलना केवल डॉक्टर की सलाह पर किया जाता है।",
      },
      "elderly-care": {
        name: "बुज़ुर्गों की देखभाल",
        summary: "बुज़ुर्गों के लिए साथ, रोज़मर्रा के कामों में मदद और देखरेख।",
        description: "घर पर बुज़ुर्गों के लिए रोज़ की मदद: साथ देना, चलने-फिरने और व्यक्तिगत देखभाल में सहायता।",
        includes: ["साथ देना और देखरेख", "नहाने, कपड़े पहनने और खाने में मदद", "टहलने और चलने-फिरने में सहारा"],
      },
      "post-operative-care": {
        name: "ऑपरेशन के बाद की देखभाल",
        summary: "अस्पताल से छुट्टी के बाद नर्सिंग और रिहैब सहायता।",
        description: "सर्जरी के बाद अस्पताल के डिस्चार्ज प्लान के अनुसार घर पर ठीक होने में मदद।",
        includes: ["डिस्चार्ज प्लान के अनुसार नर्सिंग विज़िट", "सर्जरी के बाद फिजियोथेरेपी रिहैब", "दर्द, ड्रेन और चलने-फिरने की निगरानी"],
      },
      physiotherapy: {
        name: "फिजियोथेरेपी",
        summary: "घर पर सेशन के लिए योग्य फिजियोथेरेपिस्ट।",
        description: "योग्य फिजियोथेरेपिस्ट द्वारा दर्द से राहत, चलने-फिरने और ताकत के लिए घर पर फिजियोथेरेपी।",
        includes: ["कमर, गर्दन और जोड़ों का दर्द", "लकवा (स्ट्रोक) और न्यूरो रिहैबिलिटेशन", "बुज़ुर्गों के लिए संतुलन और गिरने से बचाव"],
      },
      "home-lab-collection": {
        name: "घर पर लैब सैंपल",
        summary: "लैब टेस्ट के लिए घर से खून और सैंपल लेना।",
        description: "प्रशिक्षित फ्लेबोटोमिस्ट घर से खून, पेशाब या अन्य सैंपल लेकर पार्टनर लैब तक पहुँचाते हैं।",
        includes: ["ब्लड टेस्ट और हेल्थ चेक-अप पैकेज", "सुबह-सुबह खाली पेट सैंपल", "पेशाब और मल का सैंपल लेना"],
        note: "दिखाई गई कीमत सैंपल लेने की फीस है। टेस्ट का शुल्क लैब अलग से लेती है।",
      },
    },
  },
});

/** A catalogue service with its copy in the visitor's language. */
export function localizeCareService<T extends CareService>(service: T, locale: Locale): T {
  const copy = domainMessages[locale].careServices?.[service.id];
  return copy ? { ...service, ...copy } : service;
}

/**
 * A category with its copy in the visitor's language. Admins can edit a category's description, so an edited
 * description is shown as written; only the unchanged default is replaced.
 */
export function localizeCategory<T extends Pick<Category, "id" | "name" | "shortName" | "description">>(
  category: T,
  locale: Locale,
): T {
  if (locale === "en") return category;
  const copy = domainMessages[locale].categories[category.id];
  const english = domainMessages.en.categories[category.id];
  if (!copy) return category;
  return {
    ...category,
    name: copy.name,
    shortName: copy.shortName,
    description: category.description === english?.description ? copy.description : category.description,
  };
}
