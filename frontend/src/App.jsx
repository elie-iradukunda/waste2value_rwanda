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
import Reports from "./pages/Reports";
import DigitalCertificate from "./pages/DigitalCertificate";
import MaterialDetail from "./pages/MaterialDetail";
import ResourcePage from "./pages/ResourcePage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

function Guard({ roles, children }) {
  return <ProtectedRoute roles={roles}>{children}</ProtectedRoute>;
}

const ADMIN = ["admin"];
const INDUSTRY = ["industry", "admin"];
const BUYER = ["buyer", "admin"];
const TRANSPORTER = ["transporter", "admin"];
const REGULATOR = ["regulator", "admin"];

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
      <Route path="/certificates" element={<DigitalCertificate />} />

      <Route path="/admin" element={<Guard roles={ADMIN}><AdminDashboard /></Guard>} />
      <Route path="/admin/users" element={<Guard roles={ADMIN}><ResourcePage page="adminUsers" /></Guard>} />
      <Route path="/admin/materials" element={<Guard roles={ADMIN}><ResourcePage page="adminMaterials" /></Guard>} />
      <Route path="/admin/categories" element={<Guard roles={ADMIN}><ResourcePage page="adminCategories" /></Guard>} />
      <Route path="/admin/reports" element={<Guard roles={ADMIN}><Reports role="admin" /></Guard>} />

      <Route path="/industry" element={<Guard roles={INDUSTRY}><IndustryDashboard /></Guard>} />
      <Route path="/industry/materials" element={<Guard roles={INDUSTRY}><ResourcePage page="industryMaterials" /></Guard>} />
      <Route path="/industry/requests" element={<Guard roles={INDUSTRY}><ResourcePage page="industryRequests" /></Guard>} />
      <Route path="/industry/certificates" element={<Guard roles={INDUSTRY}><ResourcePage page="industryCertificates" /></Guard>} />

      <Route path="/buyer" element={<Guard roles={BUYER}><BuyerDashboard /></Guard>} />
      <Route path="/buyer/marketplace" element={<Guard roles={BUYER}><ResourcePage page="buyerMarketplace" /></Guard>} />
      <Route path="/buyer/material/:id" element={<Guard roles={BUYER}><MaterialDetail /></Guard>} />
      <Route path="/buyer/requests" element={<Guard roles={BUYER}><ResourcePage page="buyerRequests" /></Guard>} />
      <Route path="/buyer/delivery" element={<Guard roles={BUYER}><ResourcePage page="buyerDelivery" /></Guard>} />

      <Route path="/transport" element={<Guard roles={TRANSPORTER}><TransportDashboard /></Guard>} />
      <Route path="/transport/jobs" element={<Guard roles={TRANSPORTER}><ResourcePage page="transportJobs" /></Guard>} />
      <Route path="/transport/delivery" element={<Guard roles={TRANSPORTER}><ResourcePage page="transportDelivery" /></Guard>} />

      <Route path="/regulator" element={<Guard roles={REGULATOR}><RegulatorDashboard /></Guard>} />
      <Route path="/regulator/quality" element={<Guard roles={REGULATOR}><ResourcePage page="regulatorQuality" /></Guard>} />
      <Route path="/regulator/collection" element={<Guard roles={REGULATOR}><ResourcePage page="regulatorCollection" /></Guard>} />
      <Route path="/regulator/reports" element={<Guard roles={REGULATOR}><Reports role="regulator" /></Guard>} />

      <Route path="/marketplace" element={<Navigate to="/buyer/marketplace" replace />} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
