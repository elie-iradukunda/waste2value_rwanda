const fs = require("fs");
const path = require("path");

const baseUrl = process.env.WTV_URL || "http://localhost:5000";
const demoPassword = process.env.WTV_DEMO_PASSWORD || "password123";
const sampleImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
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
  } catch (_error) {
    data = { message: text };
  }
  return { status: response.status, data };
}

function jsonHeaders(token) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

async function login(email) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, password: demoPassword })
  });
  record(`Login: ${email}`, response.status === 200 && response.data?.token, `HTTP ${response.status}`);
  return response.data;
}

async function run() {
  const startedAt = new Date().toISOString();

  const health = await request("/api/health");
  record("API health check", health.status === 200 && health.data?.message?.includes("Waste-to-Value Rwanda"), `HTTP ${health.status}`);

  const publicMarketplaceInitial = await request("/api/public/marketplace");
  record(
    "Public landing loads approved marketplace",
    publicMarketplaceInitial.status === 200 && Array.isArray(publicMarketplaceInitial.data),
    `HTTP ${publicMarketplaceInitial.status}`
  );

  const publicProducersInitial = await request("/api/public/producers");
  record(
    "Public landing loads approved producer profiles",
    publicProducersInitial.status === 200 && publicProducersInitial.data?.some((company) => company.status === "APPROVED" && Array.isArray(company.materials)),
    `HTTP ${publicProducersInitial.status}`
  );

  const blockedTransportRegistration = await request("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      role: "TRANSPORT",
      companyName: "Verification Transport Self Register",
      name: "Blocked Transport Registrant",
      email: `blocked-transport-${Date.now()}@wastetovalue.rw`,
      phone: "0788000666",
      password: demoPassword
    })
  });
  record("Transport staff cannot self-register publicly", blockedTransportRegistration.status === 400, `HTTP ${blockedTransportRegistration.status}`);

  const accounts = {
    admin: await login("admin@wastetovalue.rw"),
    producer: await login("industry@wastetovalue.rw"),
    recycler: await login("buyer@wastetovalue.rw"),
    transport: await login("transport@wastetovalue.rw")
  };

  const anonymous = await request("/api/admin/reports");
  record("Anonymous admin access is rejected", anonymous.status === 401, `HTTP ${anonymous.status}`);

  const adminHeaders = jsonHeaders(accounts.admin.token);
  const producerHeaders = jsonHeaders(accounts.producer.token);
  const recyclerHeaders = jsonHeaders(accounts.recycler.token);
  let transportHeaders = jsonHeaders(accounts.transport.token);

  const adminReports = await request("/api/admin/reports", { headers: adminHeaders });
  record("Admin opens reports", adminReports.status === 200 && typeof adminReports.data?.totalCompanies === "number", `HTTP ${adminReports.status}`);

  const recyclerRegistrationStamp = Date.now();
  const registeredRecycler = await request("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      role: "RECYCLER",
      companyName: `Verification Recycler ${recyclerRegistrationStamp}`,
      name: "Verification Recycler",
      email: `verification-recycler-${recyclerRegistrationStamp}@wastetovalue.rw`,
      phone: "0788000777",
      password: demoPassword
    })
  });
  record("Recycler public registration is approved immediately", registeredRecycler.status === 200 && registeredRecycler.data?.token && registeredRecycler.data?.user?.role === "RECYCLER", `HTTP ${registeredRecycler.status}`);

  const registeredRecyclerMarketplace = await request("/api/marketplace", { headers: jsonHeaders(registeredRecycler.data?.token) });
  record(
    "New recycler can access purchasing marketplace",
    registeredRecyclerMarketplace.status === 200 && Array.isArray(registeredRecyclerMarketplace.data),
    `HTTP ${registeredRecyclerMarketplace.status}`
  );

  const missingProducerDocument = await request("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      role: "PRODUCER",
      companyName: `Verification Producer Missing RDB ${Date.now()}`,
      name: "Missing RDB Producer",
      email: `missing-rdb-producer-${Date.now()}@wastetovalue.rw`,
      phone: "0788000779",
      password: demoPassword,
      businessLocation: "Kigali",
      producedMaterials: "Plastic packaging",
      productionDescription: "Produces packaging waste streams."
    })
  });
  record("Producer registration requires RDB document", missingProducerDocument.status === 400, `HTTP ${missingProducerDocument.status}`);

  const producerRegistrationStamp = Date.now();
  const registeredProducer = await request("/api/auth/register", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({
      role: "PRODUCER",
      companyName: `Verification Producer ${producerRegistrationStamp}`,
      name: "Verification Producer",
      email: `verification-producer-${producerRegistrationStamp}@wastetovalue.rw`,
      phone: "0788000778",
      password: demoPassword,
      registrationNumber: `RDB-VERIFY-${producerRegistrationStamp}`,
      businessLocation: "Kigali Special Economic Zone",
      producedMaterials: "Plastic packaging, PET bottles, clean industrial offcuts",
      productionDescription: "Automated verification producer profile for admin approval review.",
      rdbDocumentName: "verification-rdb-document.png",
      rdbDocumentDataUrl: sampleImage
    })
  });
  record("Producer public registration creates pending company account", registeredProducer.status === 200 && registeredProducer.data?.token && registeredProducer.data?.user?.role === "PRODUCER", `HTTP ${registeredProducer.status}`);

  const registeredPendingCompanies = await request("/api/admin/companies/pending", { headers: adminHeaders });
  const registeredCompany = registeredPendingCompanies.data?.find((company) => company.contactEmail === `verification-producer-${producerRegistrationStamp}@wastetovalue.rw`);
  record(
    "Admin sees producer RDB document and production profile",
    registeredPendingCompanies.status === 200
      && registeredCompany?.phone === "0788000778"
      && registeredCompany?.rdbDocumentDataUrl
      && registeredCompany?.producedMaterials?.includes("PET bottles"),
    `HTTP ${registeredPendingCompanies.status}`
  );

  const rejectedRegistration = await request(`/api/admin/companies/${registeredCompany.id}/review`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ approve: false })
  });
  record("Admin can reject temporary producer registration", rejectedRegistration.status === 200 && rejectedRegistration.data?.status === "REJECTED", `HTTP ${rejectedRegistration.status}`);

  const categories = await request("/api/categories", { headers: producerHeaders });
  const firstCategory = categories.data?.[0];
  record("Authenticated user loads categories", categories.status === 200 && firstCategory?.id, `HTTP ${categories.status}`);

  const staffStamp = Date.now();
  const createdTransportStaff = await request("/api/producer/transport-staff", {
    method: "POST",
    headers: producerHeaders,
    body: JSON.stringify({
      name: "Verification Transport Staff",
      email: `verification-transport-staff-${staffStamp}@wastetovalue.rw`,
      password: demoPassword
    })
  });
  record(
    "Producer creates transport staff credentials",
    createdTransportStaff.status === 200 && createdTransportStaff.data?.user?.role === "TRANSPORT" && createdTransportStaff.data?.credentials?.password === demoPassword,
    `HTTP ${createdTransportStaff.status}`
  );

  const createdTransportLogin = await login(`verification-transport-staff-${staffStamp}@wastetovalue.rw`);
  transportHeaders = jsonHeaders(createdTransportLogin.token);

  const transportStaffList = await request("/api/producer/transport-staff", { headers: producerHeaders });
  record(
    "Producer sees created transport staff account",
    transportStaffList.status === 200 && transportStaffList.data?.some((staff) => staff.email === `verification-transport-staff-${staffStamp}@wastetovalue.rw`),
    `HTTP ${transportStaffList.status}`
  );

  const adminCategories = await request("/api/admin/categories", { headers: adminHeaders });
  record(
    "Admin opens category management with usage stats",
    adminCategories.status === 200 && adminCategories.data?.some((category) => category.id === firstCategory.id && typeof category.totalListings === "number"),
    `HTTP ${adminCategories.status}`
  );

  const usedCategory = adminCategories.data?.find((category) => Number(category.totalListings || 0) > 0);
  if (usedCategory) {
    const blockedCategoryDelete = await request(`/api/admin/categories/${usedCategory.id}`, {
      method: "DELETE",
      headers: adminHeaders
    });
    record("Admin cannot remove category that has materials", blockedCategoryDelete.status === 400, `HTTP ${blockedCategoryDelete.status}`);
  }

  const categoryStamp = Date.now();
  const createdCategory = await request("/api/admin/categories", {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ name: `Verification Category ${categoryStamp}` })
  });
  record("Admin creates unused category", createdCategory.status === 200 && createdCategory.data?.canDelete === true, `HTTP ${createdCategory.status}`);

  const renamedCategory = await request(`/api/admin/categories/${createdCategory.data.id}`, {
    method: "PATCH",
    headers: adminHeaders,
    body: JSON.stringify({ name: `Verification Category ${categoryStamp} Updated` })
  });
  record("Admin renames unused category", renamedCategory.status === 200 && renamedCategory.data?.name?.endsWith("Updated"), `HTTP ${renamedCategory.status}`);

  const deletedCategory = await request(`/api/admin/categories/${createdCategory.data.id}`, {
    method: "DELETE",
    headers: adminHeaders
  });
  record("Admin removes unused category", deletedCategory.status === 200 && deletedCategory.data?.deleted === true, `HTTP ${deletedCategory.status}`);

  const title = `Verification Plastic Batch ${Date.now()}`;
  const listing = await request("/api/listings", {
    method: "POST",
    headers: producerHeaders,
    body: JSON.stringify({
      title,
      description: "Automated verification listing for the new Waste-to-Value workflow.",
      categoryId: firstCategory.id,
      imageDataUrl: sampleImage,
      imageGallery: [sampleImage, sampleImage],
      quantity: 125,
      unit: "KG",
      priceAmount: 175,
      currency: "RWF",
      priceType: "PER_UNIT",
      location: "Kigali Special Economic Zone"
    })
  });
  record("Producer posts listing for admin approval", listing.status === 200 && listing.data?.status === "PENDING_APPROVAL" && Number(listing.data?.priceAmount) === 175, `HTTP ${listing.status}`);

  const listingId = listing.data.id;
  const mine = await request("/api/listings/mine", { headers: producerHeaders });
  record("Producer sees own listing", mine.status === 200 && mine.data?.some((item) => item.id === listingId), `HTTP ${mine.status}`);

  const pendingListings = await request("/api/admin/listings/pending", { headers: adminHeaders });
  record("Admin sees pending listing", pendingListings.status === 200 && pendingListings.data?.some((item) => item.id === listingId), `HTTP ${pendingListings.status}`);

  const pendingStatusListings = await request("/api/admin/listings/status/PENDING_APPROVAL", { headers: adminHeaders });
  record(
    "Admin can open pending materials by status",
    pendingStatusListings.status === 200 && pendingStatusListings.data?.some((item) => item.id === listingId && item.producerCompany?.name),
    `HTTP ${pendingStatusListings.status}`
  );

  const marketplaceBeforeApproval = await request("/api/marketplace", { headers: recyclerHeaders });
  record(
    "Pending listing is hidden from recycler marketplace",
    marketplaceBeforeApproval.status === 200 && !marketplaceBeforeApproval.data?.some((item) => item.id === listingId),
    `HTTP ${marketplaceBeforeApproval.status}`
  );

  const blockedPendingRequest = await request(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: recyclerHeaders,
    body: JSON.stringify({
      requestedQuantity: 25,
      requestedUnit: "KG",
      contactName: "Verification Buyer",
      contactPhone: "0788000999",
      deliveryLocation: "Verification recycler workshop",
      message: "This should fail before admin approval."
    })
  });
  record("Pending listing cannot be requested before approval", blockedPendingRequest.status === 400, `HTTP ${blockedPendingRequest.status}`);

  const approvedListing = await request(`/api/admin/listings/${listingId}/review`, {
    method: "POST",
    headers: adminHeaders,
    body: JSON.stringify({ approve: true, quality: "A" })
  });
  record("Admin approves and grades listing", approvedListing.status === 200 && approvedListing.data?.status === "APPROVED", `HTTP ${approvedListing.status}`);

  const approvedStatusListings = await request("/api/admin/listings/status/APPROVED", { headers: adminHeaders });
  record(
    "Admin can open approved materials by status",
    approvedStatusListings.status === 200 && approvedStatusListings.data?.some((item) => item.id === listingId && item.quality === "A"),
    `HTTP ${approvedStatusListings.status}`
  );

  const publicMarketplaceAfterApproval = await request("/api/public/marketplace");
  const publicListing = publicMarketplaceAfterApproval.data?.find((item) => item.id === listingId);
  record(
    "Public marketplace shows approved material full details",
    publicMarketplaceAfterApproval.status === 200 && publicListing?.producerCompany?.name && Number(publicListing.priceAmount) === 175 && Array.isArray(publicListing.imageGallery),
    `HTTP ${publicMarketplaceAfterApproval.status}`
  );

  const marketplace = await request("/api/marketplace", { headers: recyclerHeaders });
  const marketplaceListing = marketplace.data?.find((item) => item.id === listingId);
  record(
    "Recycler sees approved listing",
    marketplace.status === 200 && marketplaceListing && Number(marketplaceListing.priceAmount) === 175 && Array.isArray(marketplaceListing.imageGallery),
    `HTTP ${marketplace.status}`
  );

  const createdRequest = await request(`/api/listings/${listingId}/requests`, {
    method: "POST",
    headers: recyclerHeaders,
    body: JSON.stringify({
      requestedQuantity: 75,
      requestedUnit: "KG",
      proposedPrice: 175,
      contactName: "Verification Buyer",
      contactPhone: "0788000999",
      preferredPickupDate: new Date().toISOString().slice(0, 10),
      deliveryLocation: "Verification recycler workshop",
      message: "Verification request for matched transport workflow."
    })
  });
  record("Recycler requests material", createdRequest.status === 200 && createdRequest.data?.status === "PENDING" && Number(createdRequest.data?.requestedQuantity) === 75, `HTTP ${createdRequest.status}`);

  const incoming = await request("/api/producer/requests", { headers: producerHeaders });
  const requestForListing = incoming.data?.find((item) => item.listingId === listingId);
  record("Producer sees incoming request", incoming.status === 200 && requestForListing?.id && requestForListing?.contactPhone === "0788000999", `HTTP ${incoming.status}`);

  const matched = await request(`/api/requests/${requestForListing.id}/review`, {
    method: "POST",
    headers: producerHeaders,
    body: JSON.stringify({ approve: true, reason: "Verification approved because recycler profile and pickup plan are acceptable." })
  });
  const jobId = matched.data?.job?.id;
  record("Producer approves request and creates transport job", matched.status === 200 && jobId, `HTTP ${matched.status}`);

  const jobs = await request("/api/transport/jobs", { headers: transportHeaders });
  record(
    "Producer-created transport staff sees assigned job",
    jobs.status === 200 && jobs.data?.some((job) => job.id === jobId && job.providerCompanyId === accounts.producer.user.companyId),
    `HTTP ${jobs.status}`
  );

  const pickedUp = await request(`/api/transport/jobs/${jobId}/advance`, {
    method: "POST",
    headers: transportHeaders,
    body: JSON.stringify({
      driverName: "Verification Driver",
      driverPhone: "0788000888",
      vehiclePlate: "RAB 900 V",
      pickupQuantity: 75,
      pickupUnit: "KG",
      pickupCondition: "GOOD",
      pickupNotes: "Verification pickup proof captured.",
      pickupPhotoDataUrl: sampleImage
    })
  });
  record(
    "Transport records pickup proof",
    pickedUp.status === 200 && pickedUp.data?.status === "PICKED_UP" && pickedUp.data?.vehiclePlate === "RAB 900 V",
    `HTTP ${pickedUp.status}`
  );

  const inTransit = await request(`/api/transport/jobs/${jobId}/advance`, { method: "POST", headers: transportHeaders, body: JSON.stringify({}) });
  record("Transport marks in transit", inTransit.status === 200 && inTransit.data?.status === "IN_TRANSIT", `HTTP ${inTransit.status}`);

  const delivered = await request(`/api/transport/jobs/${jobId}/advance`, {
    method: "POST",
    headers: transportHeaders,
    body: JSON.stringify({
      deliveryQuantity: 75,
      deliveryUnit: "KG",
      deliveryCondition: "GOOD",
      deliveryLocation: "Verification recycler workshop",
      receiverName: "Verification Buyer",
      receiverPhone: "0788000999",
      deliveryNotes: "Verification delivery proof captured.",
      deliveryPhotoDataUrl: sampleImage
    })
  });
  record(
    "Transport records delivery proof",
    delivered.status === 200 && delivered.data?.status === "DELIVERED" && delivered.data?.receiverName === "Verification Buyer",
    `HTTP ${delivered.status}`
  );

  const certified = await request(`/api/listings/${listingId}/confirm-receipt`, {
    method: "POST",
    headers: recyclerHeaders,
    body: JSON.stringify({
      receivedQuantity: 75,
      receivedUnit: "KG",
      receiptCondition: "GOOD",
      receiverName: "Verification Buyer",
      receiverPhone: "0788000999",
      receiptLocation: "Verification recycler workshop",
      receiptNotes: "Final receipt confirmed during automated verification.",
      finalApproval: true
    })
  });
  record("Recycler confirms receipt and receives certificate", certified.status === 200 && certified.data?.id && certified.data?.receiptCondition === "GOOD", `HTTP ${certified.status}`);

  const publicProducersAfterCertification = await request("/api/public/producers");
  const publicProducerProfile = publicProducersAfterCertification.data?.find((company) => company.contactEmail === "industry@wastetovalue.rw");
  record(
    "Public producer profile shows supplied materials and certificates",
    publicProducersAfterCertification.status === 200 && publicProducerProfile?.materials?.some((item) => item.id === listingId) && Number(publicProducerProfile.certificateCount) >= 1,
    `HTTP ${publicProducersAfterCertification.status}`
  );

  const certificates = await request("/api/recycler/certificates", { headers: recyclerHeaders });
  const generatedCertificate = certificates.data?.find((item) => item.id === certified.data.id);
  record(
    "Recycler certificate list includes movement proof",
    certificates.status === 200 && generatedCertificate?.listing?.job?.vehiclePlate === "RAB 900 V",
    `HTTP ${certificates.status}`
  );

  const forbidden = await request("/api/admin/reports", { headers: recyclerHeaders });
  record("Recycler cannot open admin reports", forbidden.status === 403, `HTTP ${forbidden.status}`);

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
