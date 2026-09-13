import { defineMessages } from "@/lib/i18n/config";

/** Location search box and the map panel. Locality and city names stay in English: they are place names. */
export const locationMessages = defineMessages({
  en: {
    picker: {
      label: "Where do you need care?",
      changeLocation: "Change location",
      placeholder: "Your area or city, e.g. Saket",
      currentLocation: "Current location",
      clear: "Clear location",
      matchingAreas: "Matching areas",
      noMatch: "No matching area. Try your city name instead, e.g. Lucknow or Coimbatore.",
      finding: "Finding your address…",
      useMyLocation: "Use my location",
      privacyHint: "Your location is only used to find providers nearby. It is shared with a provider only after you confirm a booking.",
      pin: (code: string) => ` · PIN ${code}`,
      noGeolocation: "Your browser doesn't support location access. Please type your area instead.",
      permissionDenied: "Location permission was denied. Type your area instead.",
      locateFailed: "We couldn't get your location. Type your area instead.",
    },
    map: {
      loading: "Loading map…",
      show: "Show map",
      hide: "Hide map",
    },
  },
  hi: {
    picker: {
      label: "आपको देखभाल कहाँ चाहिए?",
      changeLocation: "लोकेशन बदलें",
      placeholder: "आपका इलाका या शहर, जैसे Saket",
      currentLocation: "मौजूदा लोकेशन",
      clear: "लोकेशन हटाएँ",
      matchingAreas: "मिलते-जुलते इलाके",
      noMatch: "कोई मिलता-जुलता इलाका नहीं मिला। अपने शहर का नाम लिखकर देखें, जैसे Lucknow या Coimbatore।",
      finding: "आपका पता खोजा जा रहा है…",
      useMyLocation: "मेरी लोकेशन इस्तेमाल करें",
      privacyHint:
        "आपकी लोकेशन सिर्फ़ आस-पास के सेवा प्रदाता खोजने के लिए इस्तेमाल होती है। बुकिंग पक्की करने के बाद ही इसे सेवा प्रदाता के साथ शेयर किया जाता है।",
      pin: (code: string) => ` · पिन कोड ${code}`,
      noGeolocation: "आपका ब्राउज़र लोकेशन की सुविधा नहीं देता। कृपया अपना इलाका लिखें।",
      permissionDenied: "लोकेशन की अनुमति नहीं दी गई। अपना इलाका लिखें।",
      locateFailed: "आपकी लोकेशन पता नहीं चल पाई। अपना इलाका लिखें।",
    },
    map: {
      loading: "मैप लोड हो रहा है…",
      show: "मैप दिखाएँ",
      hide: "मैप छिपाएँ",
    },
  },
});
