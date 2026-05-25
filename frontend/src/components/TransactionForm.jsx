import React from "react";

export default function TransactionForm({ form, setForm, onSubmit }) {
  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <input type="number" min="1" placeholder="Property ID" value={form.property_id} onChange={(event) => setForm({ ...form, property_id: event.target.value })} required />
      <input type="number" min="0" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
      <button type="submit">Complete transaction</button>
    </form>
  );
}
