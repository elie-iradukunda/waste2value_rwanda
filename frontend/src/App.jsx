import { Navigate, Route, Routes } from "react-router-dom";
import Home from "./pages/public/Home";
import MarketplacePreview from "./pages/public/MarketplacePreview";
import HowItWorks from "./pages/public/HowItWorks";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import IndustryDashboard from "./pages/industry/IndustryDashboard";
import BuyerDashboard from "./pages/buyer/BuyerDashboard";
import TransportDashboard from "./pages/transporter/TransportDashboard";
import RegulatorDashboard from "./pages/regulator/RegulatorDashboard";
import AnalyticsPrediction from "./pages/AnalyticsPrediction";
import DigitalCertificate from "./pages/DigitalCertificate";
import Messages from "./pages/Messages";
import MaterialsIndex from "./pages/MaterialsIndex";
import Settings from "./pages/Settings";
import ResourcePage from "./pages/ResourcePage";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/marketplace-preview" element={<MarketplacePreview />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<ResourcePage page="adminUsers" />} />
      <Route path="/admin/companies" element={<ResourcePage page="adminCompanies" />} />
      <Route path="/admin/material-approvals" element={<ResourcePage page="adminMaterialApprovals" />} />
      <Route path="/admin/transactions" element={<ResourcePage page="transactions" />} />
      <Route path="/admin/certificates" element={<ResourcePage page="certificates" />} />
      <Route path="/admin/reports" element={<AnalyticsPrediction />} />
      <Route path="/admin/complaints" element={<ResourcePage page="complaints" />} />
      <Route path="/admin/settings" element={<Settings role="admin" />} />

      <Route path="/industry" element={<IndustryDashboard />} />
      <Route path="/industry/add-material" element={<ResourcePage page="addMaterial" />} />
      <Route path="/industry/materials" element={<ResourcePage page="myMaterials" />} />
      <Route path="/industry/requests" element={<ResourcePage page="buyerRequests" />} />
      <Route path="/industry/transactions" element={<ResourcePage page="transactions" />} />
      <Route path="/industry/transport-request" element={<ResourcePage page="transportJobs" />} />
      <Route path="/industry/sustainability" element={<ResourcePage page="sustainability" />} />
      <Route path="/industry/certificates" element={<ResourcePage page="certificates" />} />
      <Route path="/industry/settings" element={<Settings role="industry" />} />

      <Route path="/buyer" element={<BuyerDashboard />} />
      <Route path="/buyer/marketplace" element={<ResourcePage page="marketplace" />} />
      <Route path="/buyer/material/:id" element={<ResourcePage page="marketplace" />} />
      <Route path="/buyer/smart-matching" element={<ResourcePage page="smartMatching" />} />
      <Route path="/buyer/requests" element={<ResourcePage page="buyerRequests" />} />
      <Route path="/buyer/transactions" element={<ResourcePage page="transactions" />} />
      <Route path="/buyer/delivery-tracking" element={<ResourcePage page="deliveryTracking" />} />
      <Route path="/buyer/certificates" element={<ResourcePage page="certificates" />} />
      <Route path="/buyer/favorites" element={<ResourcePage page="marketplace" />} />
      <Route path="/buyer/settings" element={<Settings role="buyer" />} />

      <Route path="/transport" element={<TransportDashboard />} />
      <Route path="/transport/jobs" element={<ResourcePage page="transportJobs" />} />
      <Route path="/transport/active" element={<ResourcePage page="deliveryTracking" />} />
      <Route path="/transport/details" element={<ResourcePage page="deliveryTracking" />} />
      <Route path="/transport/route-optimization" element={<TransportDashboard />} />
      <Route path="/transport/proof-upload" element={<ResourcePage page="transportJobs" />} />
      <Route path="/transport/earnings" element={<ResourcePage page="earnings" />} />
      <Route path="/transport/ratings" element={<ResourcePage page="companyRanking" />} />
      <Route path="/transport/settings" element={<Settings role="transporter" />} />

      <Route path="/regulator" element={<RegulatorDashboard />} />
      <Route path="/regulator/impact" element={<ResourcePage page="impactReports" />} />
      <Route path="/regulator/ranking" element={<ResourcePage page="companyRanking" />} />
      <Route path="/regulator/certificates" element={<ResourcePage page="certificates" />} />
      <Route path="/regulator/waste-reports" element={<ResourcePage page="impactReports" />} />
      <Route path="/regulator/compliance" element={<ResourcePage page="complianceAlerts" />} />
      <Route path="/regulator/settings" element={<Settings role="regulator" />} />

      <Route path="/materials" element={<MaterialsIndex />} />
      <Route path="/marketplace" element={<Navigate to="/buyer/marketplace" replace />} />
      <Route path="/requests" element={<ResourcePage page="buyerRequests" />} />
      <Route path="/certificates" element={<DigitalCertificate />} />
      <Route path="/analytics" element={<AnalyticsPrediction />} />
      <Route path="/messages" element={<Messages />} />
      <Route path="/settings" element={<Settings />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
