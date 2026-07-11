const fs = require("fs");
const path = require("path");

const baseUrl = process.env.WTV_URL || "http://localhost:5000";
const results = [];

function record(name, passed, detail = "") {
  results.push({ name, passed, detail });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${detail ? ` - ${detail}` : ""}`);
  if (!passed) throw new Error(`${name}: ${detail}`);
}

async function request(endpoint, options = {}) {
  const response = await fetch(`${baseUrl}${endpoint}`, options);
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  return { status: response.status, data, headers: response.headers };
}

function auth(token, extra = {}) {
  return { ...extra, Authorization: `Bearer ${token}` };
}

async function login(email) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "demo123" })
  });
  record(`Login: ${email}`, response.status === 200 && response.data?.token, `HTTP ${response.status}`);
  return response.data;
}

function unique(prefix) {
  return `${prefix}-${Date.now()}`;
}

async function run() {
  const startedAt = new Date().toISOString();

  const health = await request("/api/health");
  record("API health check", health.status === 200 && health.data?.message?.includes("Waste-to-Value Rwanda"), `HTTP ${health.status}`);

  const publicHome = await request("/api/public/home");
  record("Public homepage data loads", publicHome.status === 200 && publicHome.data?.stats?.length >= 3, `HTTP ${publicHome.status}`);

  const accounts = {};
  for (const [role, email] of Object.entries({
    admin: "admin@wastetovalue.rw",
    industry: "industry@wastetovalue.rw",
    buyer: "buyer@wastetovalue.rw",
    transporter: "transport@wastetovalue.rw",
    regulator: "regulator@wastetovalue.rw"
  })) {
    accounts[role] = await login(email);
  }

  const anonymousAdmin = await request("/api/admin/users");
  record("Anonymous admin access is rejected", anonymousAdmin.status === 401, `HTTP ${anonymousAdmin.status}`);

  const adminHeaders = auth(accounts.admin.token, { "Content-Type": "application/json" });
  const industryHeaders = auth(accounts.industry.token, { "Content-Type": "application/json" });
  const buyerHeaders = auth(accounts.buyer.token, { "Content-Type": "application/json" });
  const transporterHeaders = auth(accounts.transporter.token, { "Content-Type": "application/json" });
  const regulatorHeaders = auth(accounts.regulator.token, { "Content-Type": "application/json" });

  const stamp = Date.now();
  const registration = await request("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: "Presentation Test Buyer",
      email: `presentation-buyer-${stamp}@wastetovalue.rw`,
      phone: "0788000999",
      password: "Temporary123",
      role: "buyer",
      companyName: `Presentation Buyer ${stamp}`,
      district: "Gasabo",
      sector: "Kacyiru",
      businessCategory: "Recycling"
    })
  });
  record("Public registration creates a buyer company", registration.status === 201 && registration.data?.user?.role === "buyer", `HTTP ${registration.status}`);

  const verifyCompany = await request(`/api/admin/users/${registration.data.user.id}/company-verification`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "verified" })
  });
  record("Admin verifies registered company", verifyCompany.status === 200 && verifyCompany.data?.status === "verified", `HTTP ${verifyCompany.status}`);

  const suspendUser = await request(`/api/admin/users/${registration.data.user.id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "suspended", reason: "Automated verification suspension test" })
  });
  record("Admin suspends a user account", suspendUser.status === 200 && suspendUser.data?.status === "suspended", `HTTP ${suspendUser.status}`);

  const reactivateUser = await request(`/api/admin/users/${registration.data.user.id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "active" })
  });
  record("Admin reactivates a user account", reactivateUser.status === 200 && reactivateUser.data?.status === "active", `HTTP ${reactivateUser.status}`);

  const categoryName = unique("Presentation Category");
  const category = await request("/api/categories", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: categoryName, description: "Temporary category created during verification." })
  });
  record("Admin creates a material category", category.status === 201 && category.data?.category?.name === categoryName, `HTTP ${category.status}`);

  const deactivateCategory = await request(`/api/categories/${category.data.category.id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({})
  });
  record("Admin deactivates a category", deactivateCategory.status === 200 && deactivateCategory.data?.status === "inactive", `HTTP ${deactivateCategory.status}`);

  const reactivateCategory = await request(`/api/categories/${category.data.category.id}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({})
  });
  record("Admin reactivates a category", reactivateCategory.status === 200 && reactivateCategory.data?.status === "active", `HTTP ${reactivateCategory.status}`);

  const materialTitle = unique("Presentation Plastic Batch");
  const materialForm = new FormData();
  materialForm.set("title", materialTitle);
  materialForm.set("category", "Plastic");
  materialForm.set("description", "Clean sorted presentation-test plastic scraps for recycling.");
  materialForm.set("quantity", "320");
  materialForm.set("unit", "kg");
  materialForm.set("condition", "Clean and dry");
  materialForm.set("price", "95");
  materialForm.set("district", "Kicukiro");
  materialForm.set("sector", "Gikondo");
  materialForm.set("pickupAddress", "Kigali Special Economic Zone verification pickup");

  const createdMaterial = await request("/api/materials", {
    method: "POST",
    headers: auth(accounts.industry.token),
    body: materialForm
  });
  record("Waste producer posts a material listing", createdMaterial.status === 201 && createdMaterial.data?.material?.status === "pending_review", `HTTP ${createdMaterial.status}`);
  const materialId = createdMaterial.data.material.id;

  const updatedMaterial = await request(`/api/materials/${materialId}`, {
    method: "PATCH",
    headers: industryHeaders,
    body: JSON.stringify({ quantity: 360, district: "Gasabo", sector: "Kacyiru" })
  });
  record("Waste producer edits listing quantity/location", updatedMaterial.status === 200 && Number(updatedMaterial.data?.item?.quantity) === 360, `HTTP ${updatedMaterial.status}`);

  const adminApprovesMaterial = await request(`/api/materials/${materialId}/status`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ status: "available" })
  });
  record("Admin approves material listing", adminApprovesMaterial.status === 200 && adminApprovesMaterial.data?.status === "available", `HTTP ${adminApprovesMaterial.status}`);

  const quality = await request(`/api/materials/${materialId}/quality`, {
    method: "PATCH",
    headers: regulatorHeaders,
    body: JSON.stringify({})
  });
  record("Regulator verifies material quality", quality.status === 200 && quality.data?.item?.qualityVerified === true, `HTTP ${quality.status}`);

  const marketplace = await request("/api/materials");
  const listedMaterial = marketplace.data?.materials?.find((item) => item.id === materialId);
  record("Approved material appears in marketplace", marketplace.status === 200 && Boolean(listedMaterial), `HTTP ${marketplace.status}`);

  const materialDetails = await request(`/api/materials/${materialId}`);
  record("Buyer can get material details", materialDetails.status === 200 && materialDetails.data?.material?.id === materialId, `HTTP ${materialDetails.status}`);

  const cancellableRequest = await request("/api/requests", {
    method: "POST",
    headers: buyerHeaders,
    body: JSON.stringify({ materialId, requestedQuantity: 25, message: "Temporary cancellation verification request." })
  });
  record("Buyer posts a material request", cancellableRequest.status === 201 && cancellableRequest.data?.request?.status === "pending", `HTTP ${cancellableRequest.status}`);

  const cancelledRequest = await request(`/api/requests/${cancellableRequest.data.request.id}/status`, {
    method: "PATCH",
    headers: buyerHeaders,
    body: JSON.stringify({ status: "cancelled" })
  });
  record("Buyer cancels own pending request", cancelledRequest.status === 200 && cancelledRequest.data?.status === "cancelled", `HTTP ${cancelledRequest.status}`);

  const approvalRequest = await request("/api/requests", {
    method: "POST",
    headers: buyerHeaders,
    body: JSON.stringify({ materialId, requestedQuantity: 120, offeredPrice: 11400, message: "Presentation verification request for approval and transport." })
  });
  record("Buyer posts a second request for approval workflow", approvalRequest.status === 201 && approvalRequest.data?.request?.status === "pending", `HTTP ${approvalRequest.status}`);

  const approvedRequest = await request(`/api/requests/${approvalRequest.data.request.id}/status`, {
    method: "PATCH",
    headers: industryHeaders,
    body: JSON.stringify({ status: "approved" })
  });
  record("Waste producer approves buyer request", approvedRequest.status === 200 && approvedRequest.data?.status === "approved" && approvedRequest.data?.transactionId, `HTTP ${approvedRequest.status}`);

  const jobs = await request("/api/transport/jobs", { headers: transporterHeaders });
  const job = jobs.data?.transportJobs?.find((item) => item.transactionId === approvedRequest.data.transactionId);
  record("Transport provider sees new pickup job", jobs.status === 200 && Boolean(job), job ? `Job ${job.id}` : "missing");

  const accepted = await request(`/api/transport/jobs/${job.id}/status`, {
    method: "PATCH",
    headers: transporterHeaders,
    body: JSON.stringify({ status: "accepted" })
  });
  record("Transport provider accepts pickup job", accepted.status === 200 && accepted.data?.status === "accepted", `HTTP ${accepted.status}`);

  const pickedUp = await request(`/api/transport/jobs/${job.id}/status`, {
    method: "PATCH",
    headers: transporterHeaders,
    body: JSON.stringify({ status: "picked_up" })
  });
  record("Transport provider marks pickup complete", pickedUp.status === 200 && pickedUp.data?.status === "picked_up", `HTTP ${pickedUp.status}`);

  const inTransit = await request(`/api/transport/jobs/${job.id}/status`, {
    method: "PATCH",
    headers: transporterHeaders,
    body: JSON.stringify({ status: "in_transit" })
  });
  record("Transport provider marks delivery in transit", inTransit.status === 200 && inTransit.data?.status === "in_transit", `HTTP ${inTransit.status}`);

  const delivered = await request(`/api/transport/jobs/${job.id}/status`, {
    method: "PATCH",
    headers: transporterHeaders,
    body: JSON.stringify({ status: "delivered" })
  });
  record("Transport provider confirms delivery arrival", delivered.status === 200 && delivered.data?.status === "delivered", `HTTP ${delivered.status}`);

  const confirmed = await request(`/api/transport/jobs/${job.id}/status`, {
    method: "PATCH",
    headers: buyerHeaders,
    body: JSON.stringify({ status: "confirmed" })
  });
  record("Buyer confirms received material", confirmed.status === 200 && confirmed.data?.status === "confirmed", `HTTP ${confirmed.status}`);

  const certificates = await request("/api/certificates", { headers: buyerHeaders });
  const certificate = certificates.data?.certificates?.find((item) => item.materialType === materialTitle);
  record("Certificate is generated after confirmed delivery", certificates.status === 200 && Boolean(certificate), certificate?.certificateNumber || "missing");

  const certificateVerification = await request(`/api/certificates/verify/${encodeURIComponent(certificate.certificateNumber)}`);
  record("Public certificate verification link works", certificateVerification.status === 200 && certificateVerification.data?.verified === true, `HTTP ${certificateVerification.status}`);

  const adminReports = await request("/api/admin/reports", { headers: adminHeaders });
  record("Admin opens reports", adminReports.status === 200 && adminReports.data?.dashboard?.stats?.length >= 4, `HTTP ${adminReports.status}`);

  const regulatorReports = await request("/api/analytics/reports", { headers: regulatorHeaders });
  record("Regulator opens impact reports", regulatorReports.status === 200 && regulatorReports.data?.dashboard?.impact?.length >= 1, `HTTP ${regulatorReports.status}`);

  const forbiddenReports = await request("/api/admin/reports", { headers: buyerHeaders });
  record("Buyer cannot open admin reports", forbiddenReports.status === 403, `HTTP ${forbiddenReports.status}`);

  const report = {
    system: "Waste-to-Value Rwanda",
    baseUrl,
    startedAt,
    completedAt: new Date().toISOString(),
    passed: results.filter((item) => item.passed).length,
    failed: results.filter((item) => !item.passed).length,
    results
  };

  const evidenceDir = path.resolve(__dirname, "../../Book/evidence");
  fs.mkdirSync(evidenceDir, { recursive: true });
  fs.writeFileSync(path.join(evidenceDir, "waste-to-value-system-verification.json"), JSON.stringify(report, null, 2));
  console.log(`\n${report.passed} checks passed. Evidence: ${path.join(evidenceDir, "waste-to-value-system-verification.json")}`);
}

run().catch((error) => {
  console.error(`\nVerification stopped: ${error.message}`);
  process.exitCode = 1;
});
