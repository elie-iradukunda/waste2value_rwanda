import ManagementPage from "../components/dashboard/ManagementPage";
import { useNavigate } from "react-router-dom";
import { useAction, useApiResource } from "../hooks/useApi";
import { useAuth } from "../hooks/useAuth";
import { api, normalizeMaterial } from "../lib/api";

function materialRows(items) {
  return items.map((raw) => {
    const item = normalizeMaterial(raw);
    return {
      id: item.id,
      material: item.title,
      category: item.category,
      quantity: item.quantity,
      location: item.location,
      status: item.status,
      quality: item.qualityVerified ? "Verified" : "Not verified",
      condition: raw.condition,
      price: raw.price,
      seller: raw.seller,
      description: raw.description,
      safetyNotes: raw.safetyNotes,
      rejectionReason: raw.rejectionReason,
      rawQuantity: raw.quantity,
      district: raw.district,
      sector: raw.sector
    };
  });
}

function requestRows(items, perspective = "seller") {
  return items.map((item) => ({
    id: item.id,
    material: item.material,
    company: perspective === "buyer" ? item.seller : item.buyer,
    quantity: item.quantity,
    status: item.status,
    offeredPrice: item.offeredPrice,
    message: item.message,
    rejectionReason: item.rejectionReason
  }));
}

function certificateRows(items) {
  return items.map((item) => ({
    id: item.id,
    number: item.certificateNumber,
    material: item.materialType,
    quantity: item.quantityReused,
    status: item.verificationStatus || "Verified",
    seller: item.sellerCompanyName,
    buyer: item.buyerCompanyName,
    transporter: item.transporterName,
    issueDate: item.issueDate
  }));
}

function transportRows(items) {
  return items.map((job) => ({
    id: job.id,
    job: job.title || job.material,
    route: job.route,
    quantity: job.quantity,
    status: job.status,
    offer: job.offer,
    pickupLocation: job.pickupLocation,
    deliveryLocation: job.deliveryLocation
  }));
}

function categoryRows(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || "-",
    status: item.status
  }));
}

function userRows(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.fullName,
    email: item.email,
    role: item.role,
    company: item.companyName || "-",
    status: item.status,
    phone: item.phone,
    statusReason: item.statusReason,
    companyVerificationStatus: item.companyVerificationStatus
  }));
}

const PAGES = {
  adminUsers: {
    title: "User Management",
    role: "admin",
    active: "Users",
    columns: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "company", label: "Company" },
      { key: "status", label: "Status" }
    ],
    load: async () => userRows((await api.get("/admin/users")).users),
    actions: ["Approve account", "Suspend user", "Verify company"],
    isActionDisabled: (label, row) => {
      if (label === "Approve account") return row.status === "active";
      if (label === "Suspend user") return row.status === "suspended";
      if (label === "Verify company") return row.companyVerificationStatus === "verified" || !row.companyVerificationStatus;
      return false;
    },
    noteConfig: (label) => label === "Suspend user"
      ? { required: true, label: "Reason for suspension", placeholder: "e.g. Repeated late deliveries, policy violation..." }
      : null
  },
  adminMaterials: {
    title: "Waste Listing Approval",
    role: "admin",
    active: "Materials",
    columns: [
      { key: "material", label: "Material" },
      { key: "category", label: "Category" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => materialRows((await api.get("/materials/pending-approval")).materials),
    actions: ["Approve listing", "Reject listing"],
    noteConfig: (label) => label === "Reject listing"
      ? { required: true, label: "Reason for rejection", placeholder: "e.g. Missing quality details, hazardous material..." }
      : null
  },
  adminCategories: {
    title: "Manage Categories",
    role: "admin",
    active: "Categories",
    columns: [
      { key: "name", label: "Category" },
      { key: "description", label: "Description" },
      { key: "status", label: "Status" }
    ],
    load: async () => categoryRows((await api.get("/categories")).categories),
    actions: ["Toggle active status"],
    formFields: ["Name", "Description"]
  },
  industryMaterials: {
    title: "My Waste Listings",
    role: "industry",
    active: "My Materials",
    columns: [
      { key: "material", label: "Material" },
      { key: "category", label: "Category" },
      { key: "quantity", label: "Quantity" },
      { key: "location", label: "Location" },
      { key: "status", label: "Status" }
    ],
    load: async () => materialRows((await api.get("/materials/mine")).materials),
    actions: [],
    formFields: ["Quantity", "District", "Sector"],
    mapRowToForm: (row) => ({ quantity: row.rawQuantity ?? "", district: row.district ?? "", sector: row.sector ?? "" })
  },
  industryRequests: {
    title: "Buyer Requests",
    role: "industry",
    active: "Requests",
    columns: [
      { key: "material", label: "Material" },
      { key: "company", label: "Buyer" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => requestRows((await api.get("/requests")).materialRequests),
    actions: ["Approve request", "Reject request"],
    isActionDisabled: (label, row) => {
      if (label === "Approve request") return row.status !== "pending" && row.status !== "negotiating";
      if (label === "Reject request") return row.status === "rejected" || row.status === "cancelled";
      return false;
    },
    noteConfig: (label) => label === "Reject request"
      ? { required: true, label: "Reason for rejection", placeholder: "e.g. Quantity no longer available, price too low..." }
      : null
  },
  industryCertificates: {
    title: "Reuse Certificates",
    role: "industry",
    active: "Certificates",
    columns: [
      { key: "number", label: "Certificate" },
      { key: "material", label: "Material" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async (companyName) => certificateRows((await api.get(`/certificates?company=${encodeURIComponent(companyName || "")}`)).certificates),
    actions: []
  },
  buyerMarketplace: {
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
    load: async () => materialRows((await api.get("/materials")).materials),
    actions: ["View details", "Request material"],
    isActionDisabled: (label, row) => label === "Request material" && row.status !== "Available",
    noteConfig: (label) => label === "Request material"
      ? { required: false, label: "Offered price in RWF", placeholder: "e.g. 50000 — leave blank to request at the listed price" }
      : null,
    searchable: true,
    searchPlaceholder: "Search by material, category or location..."
  },
  buyerRequests: {
    title: "My Requests",
    role: "buyer",
    active: "My Requests",
    columns: [
      { key: "material", label: "Material" },
      { key: "company", label: "Supplier" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => requestRows((await api.get("/requests")).materialRequests, "buyer"),
    actions: ["Cancel request"],
    isActionDisabled: (label, row) => label === "Cancel request" && !["pending", "negotiating"].includes(row.status)
  },
  buyerDelivery: {
    title: "Confirm Deliveries",
    role: "buyer",
    active: "Delivery",
    columns: [
      { key: "job", label: "Material" },
      { key: "route", label: "Route" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => transportRows((await api.get("/transport/jobs")).transportJobs),
    actions: ["Confirm received"],
    isActionDisabled: (label, row) => label === "Confirm received" && row.status !== "delivered"
  },
  transportJobs: {
    title: "Available Delivery Requests",
    role: "transporter",
    active: "Jobs",
    columns: [
      { key: "job", label: "Material" },
      { key: "route", label: "Route" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => transportRows((await api.get("/transport/jobs")).transportJobs.filter((job) => job.status === "pending")),
    actions: ["Accept pickup job"]
  },
  transportDelivery: {
    title: "My Deliveries",
    role: "transporter",
    active: "Delivery",
    columns: [
      { key: "job", label: "Material" },
      { key: "route", label: "Route" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => transportRows((await api.get("/transport/jobs")).transportJobs.filter((job) => job.status !== "pending")),
    actions: ["Mark picked up", "Mark in transit", "Confirm delivery"],
    isActionDisabled: (label, row) => {
      if (label === "Mark picked up") return row.status !== "accepted";
      if (label === "Mark in transit") return row.status !== "picked_up";
      if (label === "Confirm delivery") return row.status !== "in_transit";
      return false;
    }
  },
  regulatorQuality: {
    title: "Verify Material Quality",
    role: "regulator",
    active: "Quality Verification",
    columns: [
      { key: "material", label: "Material" },
      { key: "category", label: "Category" },
      { key: "quantity", label: "Quantity" },
      { key: "quality", label: "Quality" }
    ],
    load: async () => materialRows((await api.get("/materials/quality-queue")).materials),
    actions: ["Verify quality"],
    isActionDisabled: (label, row) => label === "Verify quality" && row.quality === "Verified"
  },
  regulatorCollection: {
    title: "Collection Overview",
    role: "regulator",
    active: "Collection Overview",
    columns: [
      { key: "job", label: "Material" },
      { key: "route", label: "Route" },
      { key: "quantity", label: "Quantity" },
      { key: "status", label: "Status" }
    ],
    load: async () => transportRows((await api.get("/transport/jobs")).transportJobs),
    actions: []
  }
};

export default function ResourcePage({ page }) {
  const { role: currentRole, user } = useAuth();
  const navigate = useNavigate();
  const config = PAGES[page] || PAGES.buyerMarketplace;
  const { data: rows, error, reload } = useApiResource(() => config.load(user?.company?.companyName), [], [page]);
  const action = useAction();

  async function submitForm(form, selectedRow) {
    if (page === "adminCategories") {
      const payload = await action.run(() => api.post("/categories", { name: form.name, description: form.description }), "Category created");
      if (payload) reload();
      return Boolean(payload);
    }

    if (page === "industryMaterials" && selectedRow) {
      const payload = await action.run(() => api.patch(`/materials/${selectedRow.id}`, {
        quantity: form.quantity,
        district: form.district,
        sector: form.sector
      }), "Quantity and location updated");
      if (payload) reload();
      return Boolean(payload);
    }

    action.setMessage("Form captured locally for prototype review.");
    return true;
  }

  async function handleAction(label, row, note) {
    const id = row?.id;
    if (!id) {
      action.setError("Select a row first");
      return;
    }

    if (page === "adminUsers") {
      if (label === "Approve account") {
        await action.run(() => api.patch(`/admin/users/${id}/status`, { status: "active" }), "User approved");
      } else if (label === "Suspend user") {
        await action.run(() => api.patch(`/admin/users/${id}/status`, { status: "suspended", reason: note }), "User suspended");
      } else if (label === "Verify company") {
        await action.run(() => api.patch(`/admin/users/${id}/company-verification`, { status: "verified" }), "Company verified");
      }
    } else if (page === "adminMaterials") {
      const rejecting = label.includes("Reject");
      await action.run(() => api.patch(`/materials/${id}/status`, { status: rejecting ? "rejected" : "available", reason: rejecting ? note : undefined }), `${label} completed`);
    } else if (page === "adminCategories") {
      await action.run(() => api.patch(`/categories/${id}/status`, {}), "Category status updated");
    } else if (page === "industryRequests") {
      const rejecting = label.includes("Reject");
      await action.run(() => api.patch(`/requests/${id}/status`, { status: rejecting ? "rejected" : "approved", reason: rejecting ? note : undefined }), `${label} completed`);
    } else if (page === "buyerMarketplace") {
      if (label === "View details") {
        navigate(`/buyer/material/${id}`);
        return;
      }
      const offeredPrice = note && note.trim() ? note.trim() : undefined;
      await action.run(() => api.post("/requests", { materialId: id, ...(offeredPrice ? { offeredPrice, message: `Offered price note: ${offeredPrice}` } : {}) }), "Material request sent");
    } else if (page === "buyerRequests") {
      await action.run(() => api.patch(`/requests/${id}/status`, { status: "cancelled" }), "Request cancelled");
    } else if (page === "buyerDelivery") {
      await action.run(() => api.patch(`/transport/jobs/${id}/status`, { status: "confirmed" }), "Delivery confirmed");
    } else if (page === "transportJobs") {
      await action.run(() => api.patch(`/transport/jobs/${id}/status`, { status: "accepted" }), "Pickup job accepted");
    } else if (page === "transportDelivery") {
      const status = label.includes("picked up") ? "picked_up" : label.includes("in transit") ? "in_transit" : "delivered";
      await action.run(() => api.patch(`/transport/jobs/${id}/status`, { status }), `${label} completed`);
    } else if (page === "regulatorQuality") {
      await action.run(() => api.patch(`/materials/${id}/quality`, {}), "Material quality verified");
    }

    reload();
  }

  return (
    <ManagementPage
      title={config.title}
      role={currentRole || config.role}
      active={config.active}
      columns={config.columns}
      rows={rows}
      formFields={config.formFields}
      actions={config.actions}
      mapRowToForm={config.mapRowToForm}
      isActionDisabled={config.isActionDisabled}
      noteConfig={config.noteConfig}
      onSubmit={submitForm}
      onAction={handleAction}
      message={action.message}
      error={error || action.error}
      busy={action.busy}
      searchable={config.searchable}
      searchPlaceholder={config.searchPlaceholder}
    />
  );
}
