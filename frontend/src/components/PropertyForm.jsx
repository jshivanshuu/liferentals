import React from "react";

export default function PropertyForm({ form, setForm, onSubmit }) {
  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <input placeholder="Title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
      <div className="form-row">
        <input placeholder="Type" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} required />
        <select value={form.listing_type} onChange={(event) => setForm({ ...form, listing_type: event.target.value })}>
          <option value="rent">Rent</option>
          <option value="sale">Sale</option>
        </select>
      </div>
      <input placeholder="Address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
      <div className="form-row">
        <input placeholder="City" value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} required />
        <input type="number" min="0" placeholder="Price" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required />
      </div>
      <div className="form-row">
        <input type="number" min="0" placeholder="Beds" value={form.bedrooms} onChange={(event) => setForm({ ...form, bedrooms: event.target.value })} required />
        <input type="number" min="0" placeholder="Baths" value={form.bathrooms} onChange={(event) => setForm({ ...form, bathrooms: event.target.value })} required />
        <input type="number" min="0" placeholder="Area" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} required />
      </div>
      <button type="submit">Submit listing</button>
    </form>
  );
}
