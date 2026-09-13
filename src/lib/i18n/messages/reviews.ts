import { defineMessages } from "@/lib/i18n/config";
import { ASPECT_LABELS, ratingWord } from "@/lib/reviews";
import type { ReviewAspect } from "@/types";

// Ratings and reviews: the star picker, the review form and the rating summary with its filterable list.

export const reviewsMessages = defineMessages({
  en: {
    aspects: ASPECT_LABELS as Record<ReviewAspect, string>,
    ratingWord,
    starsAria: (value: number) => `${value} out of 5 stars`,
    form: {
      starWords: ["", "Poor", "Fair", "Good", "Very good", "Excellent"],
      stars: (n: number) => `${n} ${n === 1 ? "star" : "stars"}`,
      checkReview: "Please check your review",
      sendFailed: "Could not send your review",
      overall: (provider: string) => `How was your visit with ${provider}?`,
      details: "Rate the details (optional)",
      recommend: "Would you recommend them to family and friends?",
      yes: "Yes",
      no: "No",
      comment: "Your review (optional)",
      commentPlaceholder: "What went well? What could be better?",
      commentHint: "Shown publicly with your first name. Please leave out medical details.",
      sending: "Sending…",
      submit: "Submit review",
    },
    panel: {
      noRatings: "No ratings yet.",
      ratings: (n: number) => `${n} ratings`,
      wouldRecommend: (percent: number) => `${percent}% would recommend`,
      distribution: "Star distribution",
      starRow: (star: number) => `${star} star`,
      distributionNote: (n: number) => `Distribution of the ${n} written reviews below.`,
      filters: {
        all: "All",
        "5": "5 stars",
        "4": "4 stars",
        low: "3 stars & below",
        verified: "Verified visits",
        comments: "With comments",
      },
      filterAria: "Filter reviews",
      sort: "Sort",
      sorts: { recent: "Most recent", high: "Highest rated", low: "Lowest rated" },
      noMatch: "No reviews match this filter.",
      verifiedVisit: "Verified visit",
      recommends: "Recommends",
    },
  },
  hi: {
    aspects: {
      punctuality: "समय की पाबंदी",
      communication: "साफ़ समझाते हैं",
      courtesy: "देखभाल और व्यवहार",
      value: "पैसे की पूरी कीमत",
    },
    ratingWord: (rating: number) => {
      if (rating >= 4.5) return "बहुत बढ़िया";
      if (rating >= 4) return "बहुत अच्छा";
      if (rating >= 3.5) return "अच्छा";
      if (rating >= 3) return "औसत";
      return "औसत से कम";
    },
    starsAria: (value: number) => `5 में से ${value} स्टार`,
    form: {
      starWords: ["", "खराब", "ठीक-ठाक", "अच्छा", "बहुत अच्छा", "बहुत बढ़िया"],
      stars: (n: number) => `${n} स्टार`,
      checkReview: "कृपया अपना रिव्यू जाँच लें",
      sendFailed: "आपका रिव्यू नहीं भेजा जा सका",
      overall: (provider: string) => `${provider} के साथ आपकी विज़िट कैसी रही?`,
      details: "बाकी बातों को रेटिंग दें (वैकल्पिक)",
      recommend: "क्या आप परिवार और दोस्तों को इनके बारे में बताएँगे?",
      yes: "हाँ",
      no: "नहीं",
      comment: "आपका रिव्यू (वैकल्पिक)",
      commentPlaceholder: "क्या अच्छा रहा? क्या बेहतर हो सकता था?",
      commentHint: "यह आपके पहले नाम के साथ सबको दिखेगा। कृपया बीमारी या इलाज की जानकारी न लिखें।",
      sending: "भेजा जा रहा है…",
      submit: "रिव्यू जमा करें",
    },
    panel: {
      noRatings: "अभी कोई रेटिंग नहीं है।",
      ratings: (n: number) => `${n} रेटिंग`,
      wouldRecommend: (percent: number) => `${percent}% सुझाएँगे`,
      distribution: "स्टार के हिसाब से रेटिंग",
      starRow: (star: number) => `${star} स्टार`,
      distributionNote: (n: number) => `नीचे लिखे ${n} रिव्यू के हिसाब से।`,
      filters: {
        all: "सभी",
        "5": "5 स्टार",
        "4": "4 स्टार",
        low: "3 स्टार या कम",
        verified: "सत्यापित विज़िट",
        comments: "टिप्पणी वाले",
      },
      filterAria: "रिव्यू छाँटें",
      sort: "क्रम",
      sorts: { recent: "सबसे नए", high: "सबसे ज़्यादा रेटिंग", low: "सबसे कम रेटिंग" },
      noMatch: "इस फ़िल्टर से कोई रिव्यू नहीं मिला।",
      verifiedVisit: "सत्यापित विज़िट",
      recommends: "सुझाते हैं",
    },
  },
});
