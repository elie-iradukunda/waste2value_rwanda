import { Fragment, useState } from "react";
import { PIPE, categoryName, formatDate, formatPrice, formatQuantity, listingImages, listingStage } from "./data.js";

export function Badge({ map, status }) {
  const key = String(status || "").toUpperCase();
  const meta = map[key] || { t: key || "Unknown", c: "b-gray" };

  return (
    <span className={`badge ${meta.c}`}>
      <span className="dot" />
      {meta.t}
    </span>
  );
}

export function Tabs({ tabs, active, set }) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button key={tab.k} className={`tab ${active === tab.k ? "active" : ""}`} onClick={() => set(tab.k)}>
          {tab.label}
          {tab.count != null && <span className="count">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Empty({ title, sub }) {
  return (
    <div className="empty">
      <b>{title}</b>
      {sub}
    </div>
  );
}

export function Pipeline({ listing }) {
  const stage = listingStage(listing);

  return (
    <div className="pipe">
      {PIPE.map((step, index) => (
        <Fragment key={step.k}>
          {index > 0 && <div className="pipe-line" />}
          <div className={`pipe-step ${index < stage ? "done" : index === stage ? "current" : ""}`}>
            <span className="pd">{index < stage ? "OK" : index + 1}</span>
            {step.t}
          </div>
        </Fragment>
      ))}
    </div>
  );
}

export function MaterialPhoto({ listing, compact = false }) {
  const images = listingImages(listing);
  const hasImage = Boolean(images.length);
  const label = categoryName(listing);

  return (
    <div className={`material-photo ${compact ? "compact" : ""} ${hasImage ? "has-image" : ""}`}>
      {hasImage ? (
        <>
          <img src={images[0]} alt={`${listing.title || label} material`} />
          {images.length > 1 && <span className="photo-count">{images.length} photos</span>}
        </>
      ) : (
        <div className="material-photo-empty">
          <span>{label}</span>
        </div>
      )}
    </div>
  );
}

export function MaterialGallery({ listing, compact = false }) {
  const [active, setActive] = useState(0);
  const images = listingImages(listing);
  const label = categoryName(listing);

  if (!images.length) return <MaterialPhoto listing={listing} compact={compact} />;

  const activeIndex = Math.min(active, images.length - 1);

  return (
    <div className="material-gallery">
      <div className={`material-photo gallery-main ${compact ? "compact" : ""}`}>
        <img src={images[activeIndex]} alt={`${listing?.title || label} material ${activeIndex + 1}`} />
        {images.length > 1 && <span className="photo-count">{activeIndex + 1} / {images.length}</span>}
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={`${image.slice(0, 48)}-${index}`}
              className={index === activeIndex ? "active" : ""}
              onClick={() => setActive(index)}
              type="button"
            >
              <img src={image} alt={`${listing?.title || label} thumbnail ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CertCard({ certificate }) {
  const [open, setOpen] = useState(false);
  const listing = certificate.listing || {};
  const producerName = certificate.producerCompany?.name || listing.producerCompany?.name || "Waste Producer";
  const recyclerName = certificate.recyclerCompany?.name || "Recycler / SME";
  const category = certificate.category || categoryName(listing);

  return (
    <>
      <div className="card cert">
        <div className="cert-card-top">
          <div>
            <div className="cert-kicker">System generated</div>
            <div className="card-t">Waste Diversion Certificate</div>
          </div>
          <span className="badge b-green">
            <span className="dot" />
            Verified
          </span>
        </div>
        <div className="cert-summary-grid">
          <CertSummary label="Material" value={listing.title || category} />
          <CertSummary label="Quantity" value={formatQuantity(certificate)} />
          <CertSummary label="Price" value={listing.id ? formatPrice(listing) : "Not provided"} />
          <CertSummary label="Receipt" value={receiptCondition(certificate.receiptCondition)} />
          <CertSummary label="Producer" value={producerName} />
          <CertSummary label="Recycler" value={recyclerName} />
        </div>
        <div className="cert-id">Certificate No: {certificate.id}</div>
        <div className="row-actions">
          <button className="btn ghost sm" onClick={() => setOpen(true)}>View certificate</button>
        </div>
      </div>

      {open && <CertificateModal certificate={certificate} onClose={() => setOpen(false)} />}
    </>
  );
}

function CertSummary({ label, value }) {
  return (
    <span>
      <b>{label}</b>
      {value || "Not provided"}
    </span>
  );
}

function CertificateModal({ certificate, onClose }) {
  const listing = certificate.listing || {};
  const producer = certificate.producerCompany || listing.producerCompany || {};
  const recycler = certificate.recyclerCompany || {};
  const transportJob = listing.job || {};
  const category = certificate.category || categoryName(listing);
  const quantity = formatQuantity(certificate);
  const issuedDate = formatDate(certificate.issuedAt);
  const producerName = producer.name || "Waste Producer";
  const recyclerName = recycler.name || "Recycler / SME";
  const transportProviderName = transportJob.providerCompany?.name || transportJob.handledBy?.name || "Transport staff";

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Waste diversion certificate">
      <div className="certificate-modal">
        <div className="modal-head certificate-modal-head">
          <div>
            <div className="modal-kicker">Certificate Preview</div>
            <h2>System Generated Certificate</h2>
            <p>This document is generated from the verified Waste to Value workflow after delivery and recycler confirmation.</p>
          </div>
          <div className="certificate-actions">
            <button className="btn ghost sm" onClick={() => window.print()}>Print / Save PDF</button>
            <button className="btn ghost sm" onClick={onClose}>Close</button>
          </div>
        </div>

        <article className="certificate-document">
          <div className="certificate-topline">
            <div className="certificate-brand">
              <div className="certificate-logo">W2V</div>
              <div>
                <b>Waste to Value Rwanda</b>
                <span>Circular exchange verification system</span>
              </div>
            </div>
            <div className="certificate-seal">
              <span>Verified</span>
              <b>W2V</b>
            </div>
          </div>

          <div className="certificate-kicker">Circular Economy Verification</div>
          <h1>Waste Diversion Certificate</h1>
          <p className="certificate-lede">
            This certifies that verified waste material has been diverted from disposal and transferred through the Waste to Value system.
          </p>

          <div className="certificate-number">
            <span>Certificate No.</span>
            <b>{certificate.id}</b>
          </div>

          <div className="certificate-statement">
            <span>Issued to</span>
            <strong>{recyclerName}</strong>
            <p>
              for receiving and recovering <b>{quantity}</b> of <b>{category}</b> material supplied by <b>{producerName}</b>.
            </p>
          </div>

          {listing.id && (
            <div className="certificate-material">
              <MaterialPhoto listing={listing} compact />
            </div>
          )}

          <div className="certificate-grid">
            <CertificateField label="Material" value={listing.title || category} />
            <CertificateField label="Category" value={category} />
            <CertificateField label="Quantity" value={quantity} />
            <CertificateField label="Price" value={listing.id ? formatPrice(listing) : "Not provided"} />
            <CertificateField label="Receipt condition" value={receiptCondition(certificate.receiptCondition)} />
            <CertificateField label="Receiver" value={certificate.receiverName} />
            <CertificateField label="Quality grade" value={listing.quality || "Verified"} />
            <CertificateField label="Source location" value={listing.location || "Not provided"} />
            <CertificateField label="Receipt location" value={certificate.receiptLocation} />
            <CertificateField label="Issue date" value={issuedDate} />
            <CertificateField label="Producer" value={producerName} />
            <CertificateField label="Recycler" value={recyclerName} />
            <CertificateField label="Transport team" value={transportJob.id ? transportProviderName : "Not provided"} />
            <CertificateField label="Driver" value={transportJob.driverName || transportJob.handledBy?.name} />
            <CertificateField label="Vehicle plate" value={transportJob.vehiclePlate} />
            <CertificateField label="Picked up" value={transportJob.pickedUpAt ? formatDate(transportJob.pickedUpAt) : ""} />
            <CertificateField label="Delivered" value={transportJob.deliveredAt ? formatDate(transportJob.deliveredAt) : ""} />
            <CertificateField label="Delivery condition" value={receiptCondition(transportJob.deliveryCondition)} />
          </div>

          {listing.description && (
            <div className="certificate-section">
              <span>Material notes</span>
              <p>{listing.description}</p>
            </div>
          )}

          {(transportJob.id || transportJob.driverName || transportJob.deliveredAt) && (
            <div className="certificate-section">
              <span>Transport movement proof</span>
              <p>
                Transported by {transportProviderName}
                {transportJob.driverName ? ` with driver ${transportJob.driverName}` : ""}
                {transportJob.driverPhone ? ` (${transportJob.driverPhone})` : ""}.
                {transportJob.vehiclePlate ? ` Vehicle ${transportJob.vehiclePlate}.` : ""}
                {transportJob.pickedUpAt ? ` Picked up on ${formatDate(transportJob.pickedUpAt)} from ${transportJob.pickupLocation || listing.location || "the producer location"}.` : ""}
                {transportJob.deliveredAt ? ` Delivered on ${formatDate(transportJob.deliveredAt)} to ${transportJob.deliveryLocation || transportJob.dropoffLocation || certificate.receiptLocation || "the recycler location"}.` : ""}
                {transportJob.deliveryCondition ? ` Delivery condition: ${receiptCondition(transportJob.deliveryCondition)}.` : ""}
                {transportJob.deliveryNotes ? ` ${transportJob.deliveryNotes}` : ""}
              </p>
              {(transportJob.pickupPhotoDataUrl || transportJob.deliveryPhotoDataUrl) && (
                <div className="certificate-proof-images">
                  {transportJob.pickupPhotoDataUrl && <img src={transportJob.pickupPhotoDataUrl} alt="Pickup proof" />}
                  {transportJob.deliveryPhotoDataUrl && <img src={transportJob.deliveryPhotoDataUrl} alt="Delivery proof" />}
                </div>
              )}
            </div>
          )}

          {(certificate.receiptNotes || certificate.receiptConfirmedAt || certificate.receiverPhone) && (
            <div className="certificate-section">
              <span>Final receipt approval</span>
              <p>
                Received by {certificate.receiverName || recyclerName}
                {certificate.receiverPhone ? ` (${certificate.receiverPhone})` : ""}.
                {certificate.receiptConfirmedAt ? ` Confirmed on ${formatDate(certificate.receiptConfirmedAt)}.` : ""}
                {certificate.receiptNotes ? ` ${certificate.receiptNotes}` : ""}
              </p>
            </div>
          )}

          <div className="certificate-verify">
            <div className="certificate-qr" aria-hidden="true" />
            <div>
              <span>Verification</span>
              <p>
                Generated automatically from listing #{listing.id || certificate.listingId}, certificate record {certificate.id}, and platform company records.
              </p>
            </div>
          </div>

          <div className="certificate-signatures">
            <div>
              <span className="signature-line" />
              <b>Waste to Value System</b>
              <small>Automated verification authority</small>
            </div>
            <div>
              <span className="signature-line" />
              <b>{issuedDate}</b>
              <small>Date issued</small>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function CertificateField({ label, value }) {
  return (
    <div className="certificate-field">
      <span>{label}</span>
      <b>{value || "Not provided"}</b>
    </div>
  );
}

function receiptCondition(value) {
  const label = String(value || "").toUpperCase();
  if (label === "GOOD") return "Good and accepted";
  if (label === "PARTIAL") return "Partial quantity accepted";
  if (label === "DAMAGED") return "Damaged but accepted";
  if (label === "CONTAMINATED") return "Contaminated but accepted";
  return value || "Not provided";
}
