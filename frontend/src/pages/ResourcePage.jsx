import ManagementPage from "../components/dashboard/ManagementPage";
import { useAction, useApiResource } from "../hooks/useApi";
import { api, normalizeMaterial } from "../lib/api";
import { certificates, managementRows, materials, transportJobs, transactions } from "../data/platformData";

const emptyPayload = {
  materials,
  requests: managementRows.requests,
  transportJobs,
  certificates,
  transactions,
  users: managementRows.users,
  companies: managementRows.companies
};

function materialRows(items) {
  return items.map(normalizeMaterial).map((item) => ({
    id: item.id,
    material: item.title,
    category: item.category,
    quantity: item.quantity,
    location: item.location,
    status: item.status
  }));
}

function requestRows(items) {
  return items.map((item) => ({
    id: item.id,
    material: item.material,
    company: item.buyer || item.company,
    quantity: item.quantity,
    status: item.status
  }));
}

function certificateRows(items) {
  return items.map((item) => ({
    id: item.id,
    number: item.certificateNumber,
    material: item.materialType,
    quantity: item.quantityReused,
    status: item.issueDate === "Pending" ? "Pending" : item.verificationStatus || "Verified"
  }));
}

function transportRows(items) {
  return items.map((job) => ({
    id: job.id,
    job: job.title || job.material,
    route: job.meta || `${job.route} - ${job.quantity}`,
    offer: job.offer || (job.action === "Accept" ? "Open" : "Assigned"),
    status: job.action || job.status
  }));
}

function companyRows(items) {
  return items.map((item) => ({
    id: item.id,
    company: item.companyName || item.company,
    type: item.companyType || item.type,
    district: item.district,
    status: item.verificationStatus || item.status
  }));
}

function userRows(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.fullName || item.name,
    email: item.email,
    role: item.role,
    status: item.status
  }));
}

function buildConfigs(payload) {
  const materialsData = materialRows(payload.materials || []);
  const requestsData = requestRows(payload.requests || []);
  const certificatesData = certificateRows(payload.certificates || []);
  const transportData = transportRows(payload.transportJobs || []);
  const companiesData = companyRows(payload.companies || []);
  const usersData = userRows(payload.users || []);
  const transactionData = payload.transactions || [];

  return {
    adminUsers: {
      title: "User Management",
      role: "admin",
      active: "Dashboard",
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "status", label: "Status" }
      ],
      rows: usersData,
      actions: ["Approve account", "Suspend user", "Change role"]
    },
    adminCompanies: {
      title: "Company Verification",
      role: "admin",
      active: "Dashboard",
      columns: [
        { key: "company", label: "Company" },
        { key: "type", label: "Type" },
        { key: "district", label: "District" },
        { key: "status", label: "Status" }
      ],
      rows: companiesData,
      actions: ["Verify company", "Request document", "Reject application"]
    },
    adminMaterialApprovals: {
      title: "Waste Listing Approval",
      role: "admin",
      active: "Materials",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: materialsData,
      actions: ["Approve listing", "Request quality report", "Reject listing"]
    },
    transactions: {
      title: "Transaction Monitoring",
      role: "admin",
      active: "Requests",
      columns: [
        { key: "material", label: "Material" },
        { key: "seller", label: "Seller" },
        { key: "buyer", label: "Buyer" },
        { key: "status", label: "Status" },
        { key: "certificate", label: "Certificate" }
      ],
      rows: transactionData,
      actions: ["Verify payment", "Assign transport", "Generate report"]
    },
    certificates: {
      title: "Certificate Management",
      role: "admin",
      active: "Certificates",
      columns: [
        { key: "number", label: "Certificate" },
        { key: "material", label: "Material" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: certificatesData,
      actions: ["Generate certificate", "Verify certificate", "Download PDF"]
    },
    complaints: {
      title: "Compliance and Complaint Management",
      role: "regulator",
      active: "Messages",
      columns: [
        { key: "report", label: "Report" },
        { key: "company", label: "Company" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" }
      ],
      rows: managementRows.complaints,
      actions: ["Open investigation", "Assign reviewer", "Close report"]
    },
    addMaterial: {
      title: "Add Waste Material",
      role: "industry",
      active: "Materials",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: materialsData,
      formFields: ["Material name", "Category", "Quantity", "Unit", "Condition", "Price", "District", "Sector", "Safety notes"],
      actions: ["Upload photos", "Save draft", "Submit for approval"]
    },
    myMaterials: {
      title: "My Waste Listings",
      role: "industry",
      active: "Materials",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: materialsData,
      actions: ["Mark reserved", "Mark sold", "Extend expiry"]
    },
    buyerRequests: {
      title: "Buyer Requests",
      role: "industry",
      active: "Requests",
      columns: [
        { key: "material", label: "Material" },
        { key: "company", label: "Buyer" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: requestsData,
      actions: ["Approve request", "Negotiate price", "Reject request"]
    },
    marketplace: {
      title: "Waste Marketplace",
      role: "buyer",
      active: "Marketplace",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "location", label: "Location" },
        { key: "status", label: "Status" }
      ],
      rows: materialsData,
      actions: ["Request material", "Save favorite", "Arrange transport"]
    },
    smartMatching: {
      title: "Smart Matching",
      role: "buyer",
      active: "Marketplace",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Match" }
      ],
      rows: (payload.materials || []).map((item) => ({ id: item.id, material: item.title, category: item.category, quantity: `${item.quantity} ${item.unit || ""}`, status: `${item.match || 70}%` })),
      actions: ["Update preferences", "Request best match", "Save recommendations"]
    },
    deliveryTracking: {
      title: "Delivery Tracking",
      role: "buyer",
      active: "Transport",
      columns: [
        { key: "job", label: "Material" },
        { key: "route", label: "Route" },
        { key: "offer", label: "Offer" },
        { key: "status", label: "Status" }
      ],
      rows: transportData,
      actions: ["Track delivery", "Confirm receipt", "Rate transporter"]
    },
    transportJobs: {
      title: "Available Delivery Jobs",
      role: "transporter",
      active: "Transport",
      columns: [
        { key: "job", label: "Material" },
        { key: "route", label: "Route" },
        { key: "offer", label: "Offer" },
        { key: "status", label: "Action" }
      ],
      rows: transportData,
      actions: ["Accept job", "View route", "Update capacity"]
    },
    earnings: {
      title: "Earnings",
      role: "transporter",
      active: "Transport",
      columns: [
        { key: "material", label: "Material" },
        { key: "seller", label: "Pickup" },
        { key: "buyer", label: "Delivery" },
        { key: "status", label: "Payment" }
      ],
      rows: transactionData,
      actions: ["Export payment record", "Request payout", "View completed jobs"]
    },
    sustainability: {
      title: "Sustainability Score",
      role: "industry",
      active: "Analytics",
      columns: [
        { key: "company", label: "Metric" },
        { key: "type", label: "Weight" },
        { key: "district", label: "Score" },
        { key: "status", label: "Level" }
      ],
      rows: [
        { company: "Reuse rate", type: "30%", district: "88", status: "Gold" },
        { company: "Quality uploads", type: "20%", district: "72", status: "Silver" },
        { company: "Delivery completion", type: "25%", district: "94", status: "Green Champion" },
        { company: "Certificate history", type: "25%", district: "86", status: "Gold" }
      ],
      actions: ["Export score report", "View certificate history", "Improve listing quality"]
    },
    impactReports: {
      title: "Impact Analytics",
      role: "regulator",
      active: "Analytics",
      columns: [
        { key: "material", label: "Material" },
        { key: "category", label: "Category" },
        { key: "quantity", label: "Quantity" },
        { key: "status", label: "Status" }
      ],
      rows: materialsData,
      actions: ["Export environmental report", "View region map", "Review high-risk waste"]
    },
    companyRanking: {
      title: "Company Sustainability Ranking",
      role: "regulator",
      active: "Analytics",
      columns: [
        { key: "company", label: "Company" },
        { key: "type", label: "Type" },
        { key: "district", label: "District" },
        { key: "status", label: "Status" }
      ],
      rows: companiesData,
      actions: ["View score", "Download ranking", "Flag for review"]
    },
    complianceAlerts: {
      title: "Compliance Alerts",
      role: "regulator",
      active: "Analytics",
      columns: [
        { key: "report", label: "Alert" },
        { key: "company", label: "Company" },
        { key: "priority", label: "Risk" },
        { key: "status", label: "Status" }
      ],
      rows: managementRows.complaints,
      actions: ["Assign inspection", "Request evidence", "Close alert"]
    }
  };
}

async function loadResources() {
  const [materialsPayload, requestsPayload, transportPayload, certificatesPayload, transactionsPayload, usersPayload, companiesPayload] = await Promise.all([
    api.get("/materials"),
    api.get("/requests"),
    api.get("/transport/jobs"),
    api.get("/certificates"),
    api.get("/transactions"),
    api.get("/admin/users"),
    api.get("/companies")
  ]);

  return {
    materials: materialsPayload.materials,
    requests: requestsPayload.materialRequests,
    transportJobs: transportPayload.transportJobs,
    certificates: certificatesPayload.certificates,
    transactions: transactionsPayload.transactions,
    users: usersPayload.users,
    companies: companiesPayload.companies
  };
}

export default function ResourcePage({ page }) {
  const { data, error, reload } = useApiResource(loadResources, emptyPayload, []);
  const action = useAction();
  const config = buildConfigs(data)[page] || buildConfigs(data).marketplace;
  const firstRow = config.rows[0] || {};

  async function submitForm(form) {
    if (page !== "addMaterial") {
      action.setMessage("Form captured locally for prototype review.");
      return true;
    }

    const payload = await action.run(() => api.post("/materials", {
      title: form.material_name,
      category: form.category,
      quantity: form.quantity,
      unit: form.unit,
      condition: form.condition,
      price: form.price,
      district: form.district,
      sector: form.sector,
      safetyNotes: form.safety_notes,
      seller: "Waste Producer"
    }), "Material submitted for admin approval");

    if (payload) reload();
    return Boolean(payload);
  }

  async function handleAction(label) {
    const success = `${label} completed`;
    const id = firstRow.id || 1;

    if (page === "adminMaterialApprovals") {
      await action.run(() => api.patch(`/materials/${id}/status`, { status: label.includes("Reject") ? "rejected" : "approved" }), success);
    } else if (page === "buyerRequests") {
      await action.run(() => api.patch(`/requests/${id}/status`, { status: label.includes("Reject") ? "rejected" : "approved" }), success);
    } else if (page === "transportJobs") {
      await action.run(() => api.patch(`/transport/jobs/${id}/status`, { status: "accepted" }), success);
    } else if (page === "adminCompanies") {
      await action.run(() => api.patch(`/companies/${id}/verify`, { status: label.includes("Reject") ? "rejected" : "verified" }), success);
    } else if (page === "transactions") {
      await action.run(() => api.patch(`/transactions/${id}/status`, { status: label.includes("Assign") ? "transport assigned" : "verified" }), success);
    } else if (page === "marketplace" || page === "smartMatching") {
      await action.run(() => api.post("/requests", {
        materialId: id,
        material: firstRow.material,
        buyer: "Recycler / SME",
        quantity: firstRow.quantity
      }), "Material request sent");
    } else if (page === "certificates") {
      await action.run(() => api.post("/certificates/generate", {
        material: firstRow.material || "Reusable waste material",
        quantity: firstRow.quantity || "Pending",
        seller: "Waste Producer",
        buyer: "Recycler / SME",
        transporter: "Transport Provider"
      }), "Digital certificate generated");
    } else {
      action.setMessage(success);
    }

    reload();
  }

  return (
    <ManagementPage
      {...config}
      onSubmit={submitForm}
      onAction={handleAction}
      message={action.message}
      error={error || action.error}
      busy={action.busy}
    />
  );
}
