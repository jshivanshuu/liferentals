import React from "react";

export default function PropertySummary({ property, currency }) {
  return (
    <>
      <div className="card-topline">
        <span>{property.type}</span>
        <strong className={property.status}>{property.status}</strong>
      </div>
      <h3>{property.title}</h3>
      <p>{property.address}, {property.city}</p>
      <div className="property-meta">
        <span>{property.bedrooms} bed</span>
        <span>{property.bathrooms} bath</span>
        <span>{property.area} sqft</span>
      </div>
      <div className="price-line">
        <strong>{currency(property.price)}</strong>
        <span>Owner #{property.owner_id}</span>
      </div>
    </>
  );
}
