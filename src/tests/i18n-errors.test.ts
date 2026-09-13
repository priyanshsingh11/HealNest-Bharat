import { describe, expect, it } from "vitest";
import { z } from "zod";
import { translateError } from "@/lib/i18n/errors";
import { verificationSchemaFor } from "@/lib/verification";

describe("translateError", () => {
  it("passes English through unchanged", () => {
    expect(translateError("Choose a star rating", "en")).toBe("Choose a star rating");
  });

  it("translates an exact message", () => {
    expect(translateError("Choose a star rating", "hi")).toBe("स्टार रेटिंग चुनें");
  });

  it("keeps the captured values of a pattern", () => {
    expect(translateError("Keep your review under 500 characters", "hi")).toBe("अपना रिव्यू 500 अक्षरों से छोटा रखें");
    expect(translateError("This address is 12.5 km away, outside Asha's 8 km service area.", "hi")).toBe(
      "यह पता 12.5 km दूर है, जो Asha के 8 km के सेवा क्षेत्र से बाहर है।",
    );
    expect(translateError("A user cannot move this booking from Completed to Requested.", "hi")).toBe(
      "ग्राहक इस बुकिंग को “पूरा हुआ” से “अनुरोध भेजा गया” पर नहीं ले जा सकते।",
    );
  });

  it("names common not-found subjects and falls back for the rest", () => {
    expect(translateError("Booking not found", "hi")).toBe("बुकिंग नहीं मिली");
    expect(translateError("Widget not found", "hi")).toBe("यह जानकारी नहीं मिली");
  });

  it("translates each document in the verification schema's Upload message", () => {
    const result = verificationSchemaFor("nurse").safeParse({ documents: [] });
    const message = result.error?.issues.find((issue) => issue.path[0] === "documents")?.message;
    expect(message).toBe("Upload: government photo id, degree or qualification certificate, council registration certificate");
    expect(translateError(message!, "hi")).toBe(
      "अपलोड करें: सरकारी फोटो पहचान पत्र, डिग्री या योग्यता प्रमाणपत्र, काउंसिल पंजीकरण प्रमाणपत्र",
    );
  });

  it("translates zod's default messages", () => {
    const message = z.string().min(3).safeParse("a").error?.issues[0]?.message;
    expect(translateError(message!, "hi")).toBe("कम से कम 3 अक्षर लिखें");
  });

  it("leaves an unknown message in English", () => {
    expect(translateError("Something nobody has translated", "hi")).toBe("Something nobody has translated");
    expect(translateError("constructor", "hi")).toBe("constructor");
  });
});
