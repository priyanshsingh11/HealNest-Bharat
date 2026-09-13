import { defineMessages } from "@/lib/i18n/config";
import type { ApplicationStatus, CategoryId } from "@/types";

/** Caretaker "Profile & verification" page and its form. Govt ID, document and registration names live in domain.ts. */
export const verificationMessages = defineMessages<{
  page: {
    title: string;
    applicationStatus: Record<ApplicationStatus, string>;
    verifiedTitle: string;
    verifiedBody: string;
    verifiedUnderReview: string;
    verifiedResubmit: string;
    reviewTitle: string;
    reviewBody: string;
    rejectedTitle: string;
    rejectedBody: string;
    unverifiedTitle: string;
    unverifiedBody: string;
    checksFooter: string;
    checks: {
      photoId: string;
      registration: (label: string) => string;
      qualifications: string;
      work: string;
      police: string;
      documents: (labels: string[]) => string;
    };
    reviewerNote: string;
    yourApplications: string;
    submittedAt: (date: string) => string;
    reviewedAt: (date: string) => string;
    whatWeCheck: string;
    formTitle: (profession: string) => string;
    formDescription: string;
  };
  form: {
    /** Display names for the common language chips; the stored value stays English. Missing names show as stored. */
    languageNames: Record<string, string>;
    roleHint: Record<CategoryId, string>;
    photoNotImage: string;
    photoUnsupported: string;
    photoUnreadable: string;
    submitFailed: string;
    submittedTitle: string;
    submittedBody: string;
    editResubmit: string;
    fixFields: (n: number) => string;
    optional: string;
    identityTitle: string;
    identityDescription: string;
    photoAlt: string;
    changePhoto: string;
    uploadPhoto: string;
    photoHint: string;
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    govtId: string;
    last4: string;
    professionalTitle: string;
    yearsExperience: string;
    registrationNumber: (label: string) => string;
    registeringCouncil: string;
    policeRef: string;
    languages: string;
    addLanguageAria: string;
    anotherLanguage: string;
    add: string;
    qualifications: string;
    qualification: string;
    institution: string;
    year: string;
    removeQualification: (n: number) => string;
    remove: string;
    addQualification: string;
    workTitle: string;
    workDescription: string;
    currentWorkplace: string;
    workplace: (n: number) => string;
    removeWorkplace: (n: number) => string;
    organisation: string;
    organisationPlaceholder: string;
    role: string;
    rolePlaceholder: (hint: string) => string;
    fromYear: string;
    toYear: string;
    present: string;
    workHereNow: string;
    contactPerson: string;
    contactPlaceholder: string;
    contactPhone: string;
    addWorkplace: (first: boolean) => string;
    documentsTitle: string;
    documentsDescription: string;
    noFile: string;
    replace: string;
    chooseFile: string;
    uploadDocument: (label: string) => string;
    confirm: string;
    submitting: string;
    submit: string;
  };
}>({
  en: {
    page: {
      title: "Profile & verification",
      applicationStatus: { submitted: "Under review", approved: "Approved", rejected: "Not approved", superseded: "Replaced" },
      verifiedTitle: "You're verified",
      verifiedBody: "Your profile shows the blue verified tick and customers can book you.",
      verifiedUnderReview: "Your updated details are under review — you stay bookable meanwhile.",
      verifiedResubmit: "If your details change, submit them again below — you stay bookable while we review.",
      reviewTitle: "Verification under review",
      reviewBody: "HealNest Bharat staff are checking your details. You'll get the blue tick once approved.",
      rejectedTitle: "Verification not approved",
      rejectedBody: "Please fix the issue noted below and resubmit.",
      unverifiedTitle: "Not verified yet",
      unverifiedBody: "Submit your details to get the blue verified tick. Only verified caretakers can be booked.",
      checksFooter: "Once approved, your profile gets the blue verified tick.",
      checks: {
        photoId: "Government photo ID — we keep only the last 4 characters",
        registration: (label) => `${label} with your council`,
        qualifications: "Your qualifications and where you studied",
        work: "Where you work now and where you worked before — we may call the organisation",
        police: "Police verification certificate",
        documents: (labels) => `Documents: ${labels.map((label) => label.toLowerCase()).join(", ")}`,
      },
      reviewerNote: "Reviewer's note:",
      yourApplications: "Your applications",
      submittedAt: (date) => `Submitted ${date}`,
      reviewedAt: (date) => ` · reviewed ${date}`,
      whatWeCheck: "What we check",
      formTitle: (profession) => `${profession} verification`,
      formDescription:
        "Fields marked by your profession are required. HealNest Bharat staff check them against your documents before approving.",
    },
    form: {
      languageNames: {},
      roleHint: {
        nurse: "Staff nurse, ICU",
        physiotherapist: "Physiotherapist, OPD",
        phlebotomist: "Lab technician",
        babysitter: "Live-out nanny",
        caregiver: "Elder-care attendant",
      },
      photoNotImage: "Choose an image file (JPEG, PNG or WebP).",
      photoUnsupported: "Your browser couldn't process this photo.",
      photoUnreadable: "Couldn't read that photo.",
      submitFailed: "Could not submit your details",
      submittedTitle: "Submitted for review",
      submittedBody:
        "HealNest Bharat staff will check your details against your documents. You'll see the result on this page, and your profile gets the blue verified tick once approved.",
      editResubmit: "Edit and resubmit",
      fixFields: (n) => `Please fix ${n} ${n === 1 ? "field" : "fields"} below.`,
      optional: "(optional)",
      identityTitle: "Identity & contact",
      identityDescription: "As shown on your government ID. We keep only the last 4 characters of your ID number.",
      photoAlt: "Your profile photo",
      changePhoto: "Change photo",
      uploadPhoto: "Upload profile photo",
      photoHint: "A clear, recent photo of your face. It appears on your profile once approved.",
      fullName: "Full name",
      phone: "Mobile number",
      email: "Email",
      address: "Address",
      city: "City",
      govtId: "Government ID",
      last4: "Last 4",
      professionalTitle: "Professional details",
      yearsExperience: "Years of experience",
      registrationNumber: (label) => `${label} number`,
      registeringCouncil: "Registering council",
      policeRef: "Police verification certificate number",
      languages: "Languages you speak",
      addLanguageAria: "Add another language",
      anotherLanguage: "Another language",
      add: "Add",
      qualifications: "Qualifications",
      qualification: "Qualification",
      institution: "University / college",
      year: "Year",
      removeQualification: (n) => `Remove qualification ${n}`,
      remove: "Remove",
      addQualification: "Add qualification",
      workTitle: "Work history",
      workDescription:
        "Where you work now and where you have worked before. Our team may call the organisation to confirm your role, so give a contact person where you can.",
      currentWorkplace: "Current workplace",
      workplace: (n) => `Workplace ${n}`,
      removeWorkplace: (n) => `Remove workplace ${n}`,
      organisation: "Hospital, clinic, agency or family",
      organisationPlaceholder: "e.g. Apollo Hospital, Indiranagar",
      role: "Your role there",
      rolePlaceholder: (hint) => `e.g. ${hint}`,
      fromYear: "From (year)",
      toYear: "To (year)",
      present: "Present",
      workHereNow: "I work here now",
      contactPerson: "Contact person",
      contactPlaceholder: "Matron, HR or the family member",
      contactPhone: "Their mobile number",
      addWorkplace: (first) => (first ? "Add workplace" : "Add previous workplace"),
      documentsTitle: "Documents",
      documentsDescription: "PDF or photo, up to 10 MB each. In this demo only the file name is recorded — files aren't uploaded.",
      noFile: "No file chosen",
      replace: "Replace",
      chooseFile: "Choose file",
      uploadDocument: (label) => `Upload ${label.toLowerCase()}`,
      confirm:
        "I confirm these details are accurate, and I consent to HealNest Bharat checking them with the issuing council, police and ID records.",
      submitting: "Submitting…",
      submit: "Submit for verification",
    },
  },
  hi: {
    page: {
      title: "प्रोफ़ाइल और सत्यापन",
      applicationStatus: { submitted: "जाँच जारी", approved: "मंज़ूर", rejected: "मंज़ूर नहीं", superseded: "बदला गया" },
      verifiedTitle: "आप सत्यापित हैं",
      verifiedBody: "आपकी प्रोफ़ाइल पर नीला सत्यापित टिक दिखता है और ग्राहक आपको बुक कर सकते हैं।",
      verifiedUnderReview: "आपकी नई जानकारी की जाँच हो रही है — तब तक भी आपकी बुकिंग हो सकती है।",
      verifiedResubmit: "अगर आपकी जानकारी बदलती है, तो उसे नीचे फिर से जमा करें — जाँच के दौरान भी आपकी बुकिंग हो सकती है।",
      reviewTitle: "सत्यापन की जाँच हो रही है",
      reviewBody: "HealNest Bharat की टीम आपकी जानकारी जाँच रही है। मंज़ूरी मिलते ही आपको नीला टिक मिलेगा।",
      rejectedTitle: "सत्यापन मंज़ूर नहीं हुआ",
      rejectedBody: "कृपया नीचे बताई गई समस्या ठीक करें और फिर से जमा करें।",
      unverifiedTitle: "अभी सत्यापित नहीं",
      unverifiedBody: "नीला सत्यापित टिक पाने के लिए अपनी जानकारी जमा करें। केवल सत्यापित देखभालकर्ताओं को ही बुक किया जा सकता है।",
      checksFooter: "मंज़ूरी मिलने पर आपकी प्रोफ़ाइल को नीला सत्यापित टिक मिलता है।",
      checks: {
        photoId: "सरकारी फोटो पहचान पत्र — हम केवल आख़िरी 4 अक्षर रखते हैं",
        registration: (label) => `आपकी काउंसिल में ${label}`,
        qualifications: "आपकी योग्यता और आपने कहाँ पढ़ाई की",
        work: "आप अभी कहाँ काम करते हैं और पहले कहाँ काम किया — हम संस्था को फ़ोन कर सकते हैं",
        police: "पुलिस सत्यापन प्रमाणपत्र",
        documents: (labels) => `दस्तावेज़: ${labels.join(", ")}`,
      },
      reviewerNote: "जाँचकर्ता का नोट:",
      yourApplications: "आपके आवेदन",
      submittedAt: (date) => `जमा किया ${date}`,
      reviewedAt: (date) => ` · जाँचा गया ${date}`,
      whatWeCheck: "हम क्या जाँचते हैं",
      formTitle: (profession) => `${profession} सत्यापन`,
      formDescription: "आपके पेशे के लिए ज़रूरी जानकारी भरना अनिवार्य है। मंज़ूरी से पहले HealNest Bharat की टीम इसे आपके दस्तावेज़ों से मिलाती है।",
    },
    form: {
      languageNames: {
        Hindi: "हिंदी",
        English: "अंग्रेज़ी",
        Bengali: "बांग्ला",
        Marathi: "मराठी",
        Telugu: "तेलुगु",
        Tamil: "तमिल",
        Gujarati: "गुजराती",
        Urdu: "उर्दू",
        Kannada: "कन्नड़",
        Malayalam: "मलयालम",
        Odia: "ओड़िया",
        Punjabi: "पंजाबी",
        Assamese: "असमिया",
        Konkani: "कोंकणी",
        Bhojpuri: "भोजपुरी",
      },
      roleHint: {
        nurse: "स्टाफ नर्स, ICU",
        physiotherapist: "फिजियोथेरेपिस्ट, OPD",
        phlebotomist: "लैब टेक्नीशियन",
        babysitter: "दिन की आया",
        caregiver: "बुज़ुर्गों का देखभालकर्ता",
      },
      photoNotImage: "कोई फोटो फ़ाइल चुनें (JPEG, PNG या WebP)।",
      photoUnsupported: "आपका ब्राउज़र यह फोटो नहीं खोल सका।",
      photoUnreadable: "यह फोटो पढ़ी नहीं जा सकी।",
      submitFailed: "आपकी जानकारी जमा नहीं हो सकी",
      submittedTitle: "जाँच के लिए जमा हो गया",
      submittedBody:
        "HealNest Bharat की टीम आपकी जानकारी को आपके दस्तावेज़ों से मिलाएगी। नतीजा इसी पेज पर दिखेगा, और मंज़ूरी मिलते ही आपकी प्रोफ़ाइल को नीला सत्यापित टिक मिलेगा।",
      editResubmit: "बदलें और फिर से जमा करें",
      fixFields: (n) => `कृपया नीचे ${n} ${n === 1 ? "जानकारी" : "जानकारियाँ"} ठीक करें।`,
      optional: "(ज़रूरी नहीं)",
      identityTitle: "पहचान और संपर्क",
      identityDescription: "जैसा आपके सरकारी पहचान पत्र पर लिखा है। हम आपके ID नंबर के केवल आख़िरी 4 अक्षर रखते हैं।",
      photoAlt: "आपकी प्रोफ़ाइल फोटो",
      changePhoto: "फोटो बदलें",
      uploadPhoto: "प्रोफ़ाइल फोटो अपलोड करें",
      photoHint: "आपके चेहरे की साफ़ और हाल की फोटो। मंज़ूरी के बाद यह आपकी प्रोफ़ाइल पर दिखेगी।",
      fullName: "पूरा नाम",
      phone: "मोबाइल नंबर",
      email: "ईमेल",
      address: "पता",
      city: "शहर",
      govtId: "सरकारी पहचान पत्र",
      last4: "आख़िरी 4",
      professionalTitle: "पेशे की जानकारी",
      yearsExperience: "अनुभव (साल)",
      registrationNumber: (label) => `${label} नंबर`,
      registeringCouncil: "पंजीकरण करने वाली काउंसिल",
      policeRef: "पुलिस सत्यापन प्रमाणपत्र नंबर",
      languages: "आप कौन-सी भाषाएँ बोलते हैं",
      addLanguageAria: "कोई और भाषा जोड़ें",
      anotherLanguage: "कोई और भाषा",
      add: "जोड़ें",
      qualifications: "योग्यता",
      qualification: "योग्यता",
      institution: "विश्वविद्यालय / कॉलेज",
      year: "साल",
      removeQualification: (n) => `योग्यता ${n} हटाएँ`,
      remove: "हटाएँ",
      addQualification: "योग्यता जोड़ें",
      workTitle: "काम का अनुभव",
      workDescription:
        "आप अभी कहाँ काम करते हैं और पहले कहाँ काम किया है। हमारी टीम आपका पद पक्का करने के लिए संस्था को फ़ोन कर सकती है, इसलिए हो सके तो किसी संपर्क व्यक्ति का नाम दें।",
      currentWorkplace: "अभी का कार्यस्थल",
      workplace: (n) => `कार्यस्थल ${n}`,
      removeWorkplace: (n) => `कार्यस्थल ${n} हटाएँ`,
      organisation: "अस्पताल, क्लिनिक, एजेंसी या परिवार",
      organisationPlaceholder: "जैसे Apollo Hospital, Indiranagar",
      role: "वहाँ आपका पद",
      rolePlaceholder: (hint) => `जैसे ${hint}`,
      fromYear: "कब से (साल)",
      toYear: "कब तक (साल)",
      present: "अभी तक",
      workHereNow: "मैं अभी यहाँ काम करता/करती हूँ",
      contactPerson: "संपर्क व्यक्ति",
      contactPlaceholder: "मैट्रन, HR या परिवार का सदस्य",
      contactPhone: "उनका मोबाइल नंबर",
      addWorkplace: (first) => (first ? "कार्यस्थल जोड़ें" : "पिछला कार्यस्थल जोड़ें"),
      documentsTitle: "दस्तावेज़",
      documentsDescription: "PDF या फोटो, हर एक 10 MB तक। इस डेमो में केवल फ़ाइल का नाम दर्ज होता है — फ़ाइलें अपलोड नहीं होतीं।",
      noFile: "कोई फ़ाइल नहीं चुनी",
      replace: "बदलें",
      chooseFile: "फ़ाइल चुनें",
      uploadDocument: (label) => `${label} अपलोड करें`,
      confirm:
        "मैं पुष्टि करता/करती हूँ कि यह जानकारी सही है, और मैं HealNest Bharat को इसे जारी करने वाली काउंसिल, पुलिस और पहचान रिकॉर्ड से जाँचने की सहमति देता/देती हूँ।",
      submitting: "जमा हो रहा है…",
      submit: "सत्यापन के लिए जमा करें",
    },
  },
});
