import type { Locale } from "@/lib/i18n/config";
import { domainMessages } from "@/lib/i18n/messages/domain";

// Validation and API error messages are written once in English (zod schemas, AppError) and shared by client
// and server. This table turns them into Hindi at the edges: API error responses and form field errors.
// A message missing here simply stays in English.

const en = domainMessages.en;
const hi = domainMessages.hi;

/** English label → Hindi label, for messages that embed a label from the shared vocabulary. */
function reverse<K extends string>(english: Record<K, string>, hindi: Record<K, string>, normalise = (s: string) => s) {
  return new Map((Object.keys(english) as K[]).map((key) => [normalise(english[key]), hindi[key]]));
}

const PROFESSIONS = reverse(en.professions, hi.professions);
const STATUS_BY_LABEL = reverse(en.statuses, hi.statuses);
const DOCUMENTS = reverse(en.documents, hi.documents, (s) => s.toLowerCase());

/** Own-property lookup, so a message like "constructor" can't pick up Object.prototype members. */
function lookup(table: Record<string, string>, key: string): string | undefined {
  return Object.hasOwn(table, key) ? table[key] : undefined;
}

const profession = (label: string) => PROFESSIONS.get(label) ?? label;
const status = (value: string) => STATUS_BY_LABEL.get(value) ?? lookup(hi.statuses, value) ?? value;
const role = (value: string) => lookup(hi.roles, value) ?? value;

/** `notFound(what)` builds "<what> not found"; the common ones get a proper Hindi sentence. */
const NOT_FOUND: Record<string, string> = {
  Booking: "बुकिंग नहीं मिली",
  Provider: "सेवा प्रदाता नहीं मिले",
  Service: "सेवा नहीं मिली",
  Slot: "यह समय (स्लॉट) नहीं मिला",
  "Pricing rule": "कीमत का नियम नहीं मिला",
  "Verification application": "सत्यापन आवेदन नहीं मिला",
  Account: "अकाउंट नहीं मिला",
  Category: "श्रेणी नहीं मिली",
};

const HI_EXACT: Record<string, string> = {
  // Generic
  "Something went wrong. Please try again.": "कुछ गड़बड़ हो गई। कृपया फिर से कोशिश करें।",
  "Too many requests. Please wait a moment and try again.": "बहुत ज़्यादा अनुरोध। कृपया थोड़ी देर रुककर फिर से कोशिश करें।",
  "Network error — check your connection and try again.": "नेटवर्क की समस्या — अपना इंटरनेट कनेक्शन जाँचें और फिर से कोशिश करें।",
  "Request body must be valid JSON": "अनुरोध सही नहीं है",
  "Invalid request": "अनुरोध सही नहीं है",
  "You are not allowed to do that": "आपको यह करने की अनुमति नहीं है",

  // Booking, slots and reviews (src/lib/validations.ts)
  "Choose a provider": "सेवा प्रदाता चुनें",
  "Choose a service": "सेवा चुनें",
  "Choose a date and time window": "तारीख और समय चुनें",
  "Please review and accept the price breakdown": "कृपया कीमत का ब्योरा देखकर स्वीकार करें",
  "Give this address a label": "इस पते को एक नाम दें",
  "Enter the full visit address (house/flat, street, locality)": "विज़िट का पूरा पता लिखें (मकान/फ़्लैट, गली, इलाका)",
  "Address is too long": "पता बहुत लंबा है",
  "Choose the visit area above": "ऊपर विज़िट का इलाका चुनें",
  "You must agree to share the visit address with this provider": "इस सेवा प्रदाता के साथ विज़िट का पता साझा करने की सहमति देना ज़रूरी है",
  "Choose at least one day": "कम से कम एक दिन चुनें",
  "Choose up to 14 days at a time": "एक बार में ज़्यादा से ज़्यादा 14 दिन चुनें",
  "Choose a start time": "शुरू होने का समय चुनें",
  "Choose a star rating": "स्टार रेटिंग चुनें",
  "Tell the caretaker why their application was rejected": "देखभालकर्ता को बताएँ कि उनका आवेदन क्यों अस्वीकार किया गया",
  "Percentage margin cannot exceed 100%": "प्रतिशत मार्जिन 100% से ज़्यादा नहीं हो सकता",

  // Accounts and staff sign-in
  "Enter the staff passcode": "स्टाफ पासकोड डालें",
  "Enter a valid email address": "सही ईमेल पता डालें",
  "Enter your full name": "अपना पूरा नाम लिखें",
  "Name is too long": "नाम बहुत लंबा है",
  "Email is too long": "ईमेल बहुत लंबा है",
  "Enter a 10-digit Indian mobile number": "10 अंकों का भारतीय मोबाइल नंबर डालें",
  "Choose a gender": "लिंग चुनें",
  "Choose where you are based": "चुनें कि आप कहाँ रहते हैं",
  "Language names need at least 2 letters": "भाषा के नाम में कम से कम 2 अक्षर होने चाहिए",
  "Add at least one language": "कम से कम एक भाषा जोड़ें",
  "Add up to 8 languages": "ज़्यादा से ज़्यादा 8 भाषाएँ जोड़ें",
  "Enter your years of experience": "अनुभव के साल लिखें",
  "Use whole years": "पूरे साल लिखें",
  "Years of experience can't be negative": "अनुभव के साल शून्य से कम नहीं हो सकते",
  "Enter 60 years or fewer": "60 साल या उससे कम लिखें",

  // Caretaker verification (src/lib/verification.ts)
  "Enter a valid 10-digit Indian mobile number": "सही 10 अंकों का भारतीय मोबाइल नंबर डालें",
  "Enter a valid year": "सही साल लिखें",
  "Year can't be in the future": "साल आने वाले समय का नहीं हो सकता",
  "Choose a qualification": "योग्यता चुनें",
  "Enter the university or college": "यूनिवर्सिटी या कॉलेज का नाम लिखें",
  "Enter the year": "साल लिखें",
  "Enter the hospital, agency, clinic or family you worked for": "जिस अस्पताल, एजेंसी, क्लिनिक या परिवार के लिए आपने काम किया, उसका नाम लिखें",
  "Enter the role you held there": "वहाँ आपका पद या काम लिखें",
  "Enter the city": "शहर लिखें",
  "Enter the year you joined": "जुड़ने का साल लिखें",
  "Enter the year you left": "छोड़ने का साल लिखें",
  "Enter the year you left, or tick “I work here now”": "छोड़ने का साल लिखें, या “मैं अभी यहाँ काम करता/करती हूँ” पर टिक करें",
  "The year you left can't be before the year you joined": "छोड़ने का साल जुड़ने के साल से पहले का नहीं हो सकता",
  "Each file must be under 10 MB": "हर फ़ाइल 10 MB से छोटी होनी चाहिए",
  "Enter your full name as on your ID": "पहचान पत्र पर लिखा अपना पूरा नाम लिखें",
  "Enter your full address": "अपना पूरा पता लिखें",
  "Enter your city": "अपना शहर लिखें",
  "Choose at least one language": "कम से कम एक भाषा चुनें",
  "Enter the last 4 characters of your ID": "अपने पहचान पत्र के आखिरी 4 अक्षर या अंक लिखें",
  "Upload a clear profile photo": "अपनी साफ़ प्रोफ़ाइल फ़ोटो अपलोड करें",
  "That photo is too large — try a smaller one": "यह फ़ोटो बहुत बड़ी है — कोई छोटी फ़ोटो चुनें",
  "Upload a JPEG, PNG or WebP photo": "JPEG, PNG या WebP फ़ोटो अपलोड करें",
  "Enter your registration number": "अपना पंजीकरण नंबर लिखें",
  "Enter your registering council": "अपनी पंजीकरण काउंसिल का नाम लिखें",
  "Add at least one qualification": "कम से कम एक योग्यता जोड़ें",
  "Enter your police verification certificate number": "अपने पुलिस सत्यापन प्रमाणपत्र का नंबर लिखें",
  "Please confirm these details are accurate": "कृपया पुष्टि करें कि यह जानकारी सही है",
  "Add at least one workplace — where you work now, or where you worked last":
    "कम से कम एक कार्यस्थल जोड़ें — जहाँ आप अभी काम करते हैं, या जहाँ आखिरी बार काम किया",

  // Staff sign-in (src/lib/staff-otp.ts, src/app/api/staff, src/app/api/session)
  "Staff sign-in is not set up on this deployment.": "इस साइट पर स्टाफ लॉग इन चालू नहीं है।",
  "Too many codes requested. Wait a minute and try again.": "बहुत ज़्यादा कोड माँगे गए। एक मिनट रुककर फिर से कोशिश करें।",
  "Could not send the sign-in code. Check that this address is a Supabase Auth user.":
    "लॉग इन कोड नहीं भेजा जा सका। जाँचें कि यह पता Supabase Auth में यूज़र के रूप में जुड़ा है।",
  "That passcode is not correct.": "यह पासकोड सही नहीं है।",
  "That address is not on the staff list.": "यह पता स्टाफ की सूची में नहीं है।",
  "That sign-in has expired. Start again with your passcode.": "लॉग इन का समय खत्म हो गया। पासकोड से फिर से शुरू करें।",
  "That code is not correct, or it has expired.": "यह कोड सही नहीं है, या इसका समय खत्म हो गया है।",
  "Sign-in is turned off on this deployment.": "इस साइट पर लॉग इन बंद है।",
  "Choose a caretaker profile.": "देखभालकर्ता प्रोफ़ाइल चुनें।",
  "Choose a customer account.": "ग्राहक अकाउंट चुनें।",
  "This account isn't registered on this device. Log in from the device you created it on, or create a new account.":
    "यह अकाउंट इस डिवाइस पर रजिस्टर नहीं है। जिस डिवाइस पर अकाउंट बनाया था, वहाँ से लॉग इन करें, या नया अकाउंट बनाएँ।",

  // Accounts (src/lib/services/accounts.ts, src/app/api/accounts, repositories)
  "Creating accounts is disabled.": "अभी नए अकाउंट नहीं बनाए जा सकते।",
  "An account with this email already exists. Log in to it instead.": "इस ईमेल से पहले से एक अकाउंट है। उसी में लॉग इन करें।",
  "Choose where you are based from the list.": "सूची में से चुनें कि आप कहाँ रहते हैं।",
  "This profession is not accepting new caretakers right now.": "इस पेशे में अभी नए देखभालकर्ता नहीं जोड़े जा रहे हैं।",
  "Could not create the account right now. Please try again.": "अभी अकाउंट नहीं बन सका। कृपया फिर से कोशिश करें।",
  "That account already exists.": "यह अकाउंट पहले से मौजूद है।",
  "That provider profile already exists.": "यह सेवा प्रदाता प्रोफ़ाइल पहले से मौजूद है।",

  // Admin and provider dashboards (src/lib/services/admin.ts, verification.ts)
  "Admin role required.": "एडमिन भूमिका ज़रूरी है।",
  "You can only manage your own provider profile.": "आप सिर्फ़ अपनी सेवा प्रदाता प्रोफ़ाइल बदल सकते हैं।",
  "Fully booked slots can't be changed. Cancel or decline the bookings instead.":
    "पूरी तरह बुक हो चुके स्लॉट बदले नहीं जा सकते। इसके बजाय बुकिंग रद्द या अस्वीकार करें।",
  "Choose valid dates.": "सही तारीखें चुनें।",
  "This application has already been reviewed.": "इस आवेदन की समीक्षा पहले ही हो चुकी है।",

  // Bookings and reviews (src/lib/services/bookings.ts, quotes.ts, reviews.ts, booking routes)
  "Switch to the Customer role to request a visit.": "विज़िट का अनुरोध करने के लिए ग्राहक भूमिका पर जाएँ।",
  "Log in or create an account to request a visit.": "विज़िट का अनुरोध करने के लिए लॉग इन करें या अकाउंट बनाएँ।",
  "This provider has not completed verification yet and cannot accept bookings.":
    "इस सेवा प्रदाता का सत्यापन अभी पूरा नहीं हुआ है, इसलिए वे बुकिंग नहीं ले सकते।",
  "This category is temporarily unavailable.": "यह श्रेणी कुछ समय के लिए उपलब्ध नहीं है।",
  "That service is not offered by this provider.": "यह सेवा प्रदाता यह सेवा नहीं देते।",
  "That service is not offered by this provider": "यह सेवा प्रदाता यह सेवा नहीं देते",
  "Choose one of this provider's available time windows.": "इस सेवा प्रदाता के उपलब्ध समय में से कोई एक चुनें।",
  "That time window is no longer available. Please pick another.": "यह समय अब उपलब्ध नहीं है। कृपया कोई दूसरा समय चुनें।",
  "Someone just booked that time window. Please pick another.": "किसी ने अभी-अभी यह समय बुक कर लिया। कृपया कोई दूसरा समय चुनें।",
  "Only the customer who booked this visit can review it.": "सिर्फ़ वही ग्राहक रिव्यू दे सकते हैं जिन्होंने यह विज़िट बुक की थी।",
  "You can review a visit once it has been completed.": "विज़िट पूरी होने के बाद ही आप रिव्यू दे सकते हैं।",
  "This visit has already been reviewed.": "इस विज़िट का रिव्यू पहले ही दिया जा चुका है।",
  "Demo tools are disabled.": "डेमो टूल बंद हैं।",
  "This booking has no further steps.": "इस बुकिंग में आगे कोई कदम नहीं है।",

  // zod's own defaults, for fields without a custom message
  "Invalid input": "जानकारी सही नहीं है",
  "Invalid email address": "सही ईमेल पता डालें",
  "Invalid ISO date": "सही तारीख चुनें",
};

/** Messages with names, numbers or ids in them. Each pattern is tried in order against the whole message. */
const HI_PATTERNS: Array<[RegExp, (...groups: string[]) => string]> = [
  [/^Request failed \((\d+)\)$/, (code) => `अनुरोध विफल रहा (${code})`],

  // Schemas
  [/^Keep the description under (\d+) characters$/, (n) => `विवरण ${n} अक्षरों से छोटा रखें`],
  [/^Keep your review under (\d+) characters$/, (n) => `अपना रिव्यू ${n} अक्षरों से छोटा रखें`],
  [
    /^Upload: (.+)$/,
    (list) => `अपलोड करें: ${list.split(", ").map((label) => DOCUMENTS.get(label) ?? label).join(", ")}`,
  ],

  // Services
  [
    /^This action requires the (.+) role\. Switch role from the header\.$/,
    (roles) => `यह काम करने के लिए ${roles.split(" or ").map(role).join(" या ")} भूमिका ज़रूरी है। हेडर से भूमिका बदलें।`,
  ],
  [
    /^A (\w+) cannot move this booking from (.+) to (.+)\.$/,
    (actor, from, to) => `${role(actor)} इस बुकिंग को “${status(from)}” से “${status(to)}” पर नहीं ले जा सकते।`,
  ],
  [
    /^Cannot move booking from (\w+) to (\w+)$/,
    (from, to) => `बुकिंग को “${status(from)}” से “${status(to)}” पर नहीं ले जाया जा सकता`,
  ],
  [
    /^This address is ([\d.]+) km away, outside (.+)'s ([\d.]+) km service area\.$/,
    (distance, name, radius) => `यह पता ${distance} km दूर है, जो ${name} के ${radius} km के सेवा क्षेत्र से बाहर है।`,
  ],
  [/^(.+) visits are coming soon and can't be booked yet\.$/, (p) => `${profession(p)} की विज़िट जल्द शुरू होंगी, अभी बुक नहीं की जा सकतीं।`],
  [
    /^(.+) sign-ups open soon\. We'll announce it on HealNest Bharat\.$/,
    (p) => `${profession(p)} के लिए साइन-अप जल्द शुरू होंगे। हम HealNest Bharat पर इसकी घोषणा करेंगे।`,
  ],
  [/^You can open slots up to (\d+) days ahead\.$/, (n) => `आप ज़्यादा से ज़्यादा ${n} दिन आगे तक के स्लॉट खोल सकते हैं।`],
  [/^(.+) is in the past\.$/, (when) => `${when} का समय बीत चुका है।`],
  [/^(.+) overlaps an existing slot\.$/, (when) => `${when} पहले से मौजूद किसी स्लॉट से टकराता है।`],

  // zod's own defaults (v4 English locale)
  [/^Too small: expected string to have >=(\d+) characters?$/, (n) => `कम से कम ${n} अक्षर लिखें`],
  [/^Too big: expected string to have <=(\d+) characters?$/, (n) => `ज़्यादा से ज़्यादा ${n} अक्षर लिखें`],
  [/^Too small: expected array to have >=(\d+) items?$/, (n) => `कम से कम ${n} जोड़ें`],
  [/^Too big: expected array to have <=(\d+) items?$/, (n) => `ज़्यादा से ज़्यादा ${n} जोड़ें`],
  [/^Too small: expected number to be >=(-?[\d.]+)$/, (n) => `${n} या उससे ज़्यादा लिखें`],
  [/^Too small: expected number to be >(-?[\d.]+)$/, (n) => `${n} से ज़्यादा लिखें`],
  [/^Too big: expected number to be <=(-?[\d.]+)$/, (n) => `${n} या उससे कम लिखें`],
  [/^Too big: expected number to be <(-?[\d.]+)$/, (n) => `${n} से कम लिखें`],
  [/^Invalid input: expected number, received .+$/, () => "कृपया एक संख्या लिखें"],
  [/^Invalid input: expected (?:string|array|boolean|object), received (?:undefined|null)$/, () => "यह जानकारी भरना ज़रूरी है"],
  [/^Invalid input: expected .+$/, () => "जानकारी सही नहीं है"],
  [/^Invalid option: expected one of .+$/, () => "दिए गए विकल्पों में से एक चुनें"],
  [/^Invalid discriminator value\. Expected .+$/, () => "दिए गए विकल्पों में से एक चुनें"],
  [/^Invalid string: must match pattern .+$/, () => "सही फ़ॉर्मेट में लिखें"],

  // `notFound(what)`: known subjects first, then anything else.
  [/^(.+) not found$/, (what) => lookup(NOT_FOUND, what) ?? "यह जानकारी नहीं मिली"],
];

export function translateError(message: string, locale: Locale): string {
  if (locale === "en") return message;
  const exact = lookup(HI_EXACT, message);
  if (exact) return exact;
  for (const [pattern, render] of HI_PATTERNS) {
    const match = message.match(pattern);
    if (match) return render(...match.slice(1));
  }
  return message;
}
