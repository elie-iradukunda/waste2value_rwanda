export const DEMO_PASSWORD = "password123";

export const ROLE_META = {
  ADMIN: {
    key: "admin",
    label: "Admin",
    email: "admin@wastetovalue.rw",
    color: "#8b5cf6",
    initial: "AD"
  },
  PRODUCER: {
    key: "producer",
    label: "Waste Producer",
    email: "industry@wastetovalue.rw",
    color: "#2563eb",
    initial: "WP"
  },
  RECYCLER: {
    key: "recycler",
    label: "Recycler / SME",
    email: "buyer@wastetovalue.rw",
    color: "#059669",
    initial: "RS"
  },
  TRANSPORT: {
    key: "transport",
    label: "Transport Staff",
    email: "transport@wastetovalue.rw",
    color: "#d97706",
    initial: "TP"
  }
};

export const DEMO_ACCOUNTS = Object.values(ROLE_META);

export const LISTING_STATUS = {
  PENDING_APPROVAL: { t: "Pending approval", c: "b-amber" },
  APPROVED: { t: "Approved", c: "b-blue" },
  REJECTED: { t: "Rejected", c: "b-red" },
  MATCHED: { t: "Matched with buyer", c: "b-blue" },
  IN_TRANSIT: { t: "In transit", c: "b-blue" },
  DELIVERED: { t: "Delivered", c: "b-blue" },
  CERTIFIED: { t: "Certified", c: "b-green" }
};

export const REQ_STATUS = {
  PENDING: { t: "Pending", c: "b-amber" },
  APPROVED: { t: "Approved", c: "b-green" },
  REJECTED: { t: "Rejected", c: "b-red" }
};

export const JOB_STATUS = {
  WAITING: { t: "Waiting for pickup", c: "b-amber" },
  PICKED_UP: { t: "Picked up", c: "b-blue" },
  IN_TRANSIT: { t: "In transit", c: "b-blue" },
  DELIVERED: { t: "Delivered", c: "b-green" }
};

export const PIPE = [
  { k: "posted", t: "Posted" },
  { k: "approved", t: "Approved" },
  { k: "matched", t: "Matched" },
  { k: "transit", t: "In transit" },
  { k: "delivered", t: "Delivered" },
  { k: "certified", t: "Certified" }
];

export function roleMeta(role) {
  return ROLE_META[String(role || "").toUpperCase()] || ROLE_META.PRODUCER;
}

export function listingStage(listing) {
  switch (String(listing?.status || "").toUpperCase()) {
    case "PENDING_APPROVAL": return 0;
    case "APPROVED": return 1;
    case "MATCHED": return 2;
    case "IN_TRANSIT": return 3;
    case "DELIVERED": return 4;
    case "CERTIFIED": return 5;
    default: return 0;
  }
}

export function unitLabel(unit) {
  const value = String(unit || "KG").toUpperCase();
  if (value === "TONNE") return "tonnes";
  if (value === "M3") return "m3";
  return "kg";
}

export function formatNumber(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? number.toLocaleString() : number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function formatQuantity(item) {
  return `${formatNumber(item?.quantity)} ${unitLabel(item?.unit)}`;
}

export function formatPrice(item) {
  const amount = item?.priceAmount;
  if (amount == null || amount === "" || Number(amount) <= 0) return "Price not set";

  const currency = String(item?.currency || "RWF").toUpperCase();
  const value = `${currency} ${formatNumber(amount)}`;
  return String(item?.priceType || "PER_UNIT").toUpperCase() === "TOTAL"
    ? `${value} total`
    : `${value} / ${unitLabel(item?.unit)}`;
}

export function categoryName(item) {
  return item?.category?.name || item?.category || "Uncategorized";
}

export function listingImages(listing) {
  const images = [];
  const add = (image) => {
    if (typeof image === "string" && image.trim() && !images.includes(image)) {
      images.push(image);
    }
  };

  if (Array.isArray(listing?.imageGallery)) {
    listing.imageGallery.forEach(add);
  } else if (typeof listing?.imageGallery === "string") {
    try {
      const parsed = JSON.parse(listing.imageGallery);
      if (Array.isArray(parsed)) parsed.forEach(add);
    } catch (_error) {
      add(listing.imageGallery);
    }
  }

  add(listing?.imageDataUrl);
  return images;
}

export function whatsappPhone(phone, defaultCountryCode = "250") {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith(defaultCountryCode)) return digits;
  if (digits.length === 10 && digits.startsWith("0")) return `${defaultCountryCode}${digits.slice(1)}`;
  if (digits.length === 9 && /^[78]/.test(digits)) return `${defaultCountryCode}${digits}`;
  return digits;
}

export function whatsappListingLink(listing) {
  const producer = listing?.producerCompany || {};
  const phone = whatsappPhone(producer.phone);
  if (!phone) return "";

  const message = [
    `Hello ${producer.name || "Waste to Value producer"},`,
    `I am interested in "${listing?.title || "your material"}" on Waste to Value.`,
    `Quantity: ${formatQuantity(listing)}.`,
    `Price: ${formatPrice(listing)}.`,
    `Location: ${listing?.location || "Not provided"}.`,
    "Please share more details."
  ].join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function formatDate(value) {
  if (!value) return "Not issued";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function sameId(a, b) {
  return String(a) === String(b);
}
