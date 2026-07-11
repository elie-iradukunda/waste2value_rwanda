const QRCode = require("qrcode");
const { Certificate } = require("../models");
const { serializeCertificate } = require("../utils/serialize");

function appBaseUrl(req) {
  if (process.env.PUBLIC_APP_URL) return process.env.PUBLIC_APP_URL.replace(/\/$/, "");
  const protocol = req.get("x-forwarded-proto") || req.protocol || "http";
  const host = req.get("x-forwarded-host") || req.get("host") || "localhost:5173";
  return `${protocol}://${host}`.replace(/\/$/, "");
}

async function withQr(certificate, req) {
  const enriched = serializeCertificate(certificate, appBaseUrl(req));
  enriched.qrCodeDataUrl = await QRCode.toDataURL(enriched.verificationUrl, { margin: 1, width: 180, errorCorrectionLevel: "M" });
  return enriched;
}

exports.list = async (req, res) => {
  const where = {};
  if (req.query.company) {
    where.sellerCompanyName = req.query.company;
  }

  const certificates = await Certificate.findAll({ where, order: [["createdAt", "DESC"]] });
  const enriched = await Promise.all(certificates.map((certificate) => withQr(certificate, req)));
  return res.json({ success: true, certificates: enriched });
};

exports.verifyCertificate = async (req, res) => {
  const certificate = await Certificate.findOne({ where: { certificateNumber: req.params.number } });
  if (!certificate) {
    return res.status(404).json({ success: false, verified: false, message: "Certificate not found" });
  }
  return res.json({ success: true, verified: certificate.verificationStatus === "verified", certificate: await withQr(certificate, req) });
};
