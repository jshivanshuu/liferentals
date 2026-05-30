import React from "react";

export default function PropertySummary({ property, currency }) {
  const getGradientForType = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("apartment") || t.includes("flat") || t.includes("condo")) {
      return "linear-gradient(135deg, #a5c3df 0%, #7b9ac6 100%)";
    }
    if (t.includes("villa") || t.includes("mansion") || t.includes("penthouse")) {
      return "linear-gradient(135deg, #8cadd6 0%, #7392be 100%)";
    }
    if (t.includes("house") || t.includes("cottage") || t.includes("home")) {
      return "linear-gradient(135deg, #94b5de 0%, #7b9ac6 100%)";
    }
    return "linear-gradient(135deg, #b0c9e8 0%, #7b9ac6 100%)";
  };

  const getIconForType = (type) => {
    const t = (type || "").toLowerCase();
    if (t.includes("apartment") || t.includes("flat") || t.includes("condo")) {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="property-type-icon">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="9" y1="22" x2="9" y2="16" />
          <line x1="15" y1="22" x2="15" y2="16" />
          <line x1="9" y1="16" x2="15" y2="16" />
          <line x1="9" y1="6" x2="15" y2="6" />
          <line x1="9" y1="10" x2="15" y2="10" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="property-type-icon">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  };

  return (
    <>
      <div className="property-card-image" style={{ background: getGradientForType(property.type) }}>
        <div className="property-card-icon-badge">
          {getIconForType(property.type)}
        </div>
        <span className={`listing-badge ${property.listing_type}`}>
          {property.listing_type === "sale" ? "For Sale" : "For Rent"}
        </span>
      </div>
      <div className="property-card-body">
        <div className="card-topline">
          <span className="property-type-tag">{property.type}</span>
        </div>
        <h3 className="property-title">{property.title}</h3>
        <p className="property-address">{property.address}, {property.city}</p>
        <div className="property-meta">
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><path d="M2 4v16M2 8h18M2 12h18M2 16h18M22 4v16"/></svg>
            {property.bedrooms} bed
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M9 9h6v6H9z"/></svg>
            {property.bathrooms} bath
          </span>
          <span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px', verticalAlign: 'middle'}}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/></svg>
            {property.area} sqft
          </span>
        </div>
        <div className="price-line">
          <strong className="property-price">{currency(property.price)}</strong>
          <span className="property-owner">Owner #{property.owner_id}</span>
        </div>
      </div>
    </>
  );
}
