import React from "react";
import PropertySummary from "./PropertySummary";

export default function PropertyGrid({ properties, onWishlist, onBuy, currency, compact = false }) {
  if (!properties.length) {
    return <div className="empty-state">No properties to show.</div>;
  }

  return (
    <div className={`property-grid ${compact ? "compact" : ""}`}>
      {properties.map((property) => (
        <article className="property-card" key={property.id}>
          <PropertySummary property={property} currency={currency} />
          <div className="card-actions">
            <button type="button" onClick={() => onBuy(property)}>
              {property.listing_type === "rent" ? "Rent" : "Buy"}
            </button>
            <button type="button" onClick={() => onWishlist(property.id)}>Save</button>
          </div>
        </article>
      ))}
    </div>
  );
}
