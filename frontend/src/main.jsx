import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const navItems = [
  { id: "explore", label: "Buy" },
  { id: "explore", label: "Rent" },
  { id: "list", label: "Sell" },
  { id: "wishlist", label: "Wishlist" },
  { id: "transactions", label: "Transactions" },
  { id: "admin", label: "Admin" },
  { id: "account", label: "Account" },
];

const emptyProperty = {
  title: "",
  type: "Apartment",
  listing_type: "rent",
  price: "",
  address: "",
  city: "",
  bedrooms: 1,
  bathrooms: 1,
  area: "",
  owner_id: "",
};

const emptyUser = {
  email: "",
  name: "",
  phone: "",
  role: "user",
};

function App() {
  const [activeView, setActiveView] = useState("explore");
  const [properties, setProperties] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("buy");
  const [typeFilter, setTypeFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [transactionForm, setTransactionForm] = useState({
    property_id: "",
    buyer_id: "",
    seller_id: "",
    amount: "",
  });
  const [userForm, setUserForm] = useState(emptyUser);
  const [loginEmail, setLoginEmail] = useState("");
  const [wishlistUserId, setWishlistUserId] = useState("");
  const [notice, setNotice] = useState({ type: "info", text: "Ready to connect to the LifeRentals API." });
  const [loading, setLoading] = useState(false);

  const filteredProperties = useMemo(
    () => properties.filter((property) => {
      const expectedListingType = listingTypeFilter === "buy" ? "sale" : "rent";
      const matchesListingType = property.listing_type === expectedListingType;
      const matchesType = !typeFilter || property.type.toLowerCase().includes(typeFilter.toLowerCase());
      const matchesBudget = !budgetFilter || Number(property.price) <= Number(budgetFilter);

      return matchesListingType && matchesType && matchesBudget;
    }),
    [budgetFilter, listingTypeFilter, properties, typeFilter],
  );

  useEffect(() => {
    loadProperties();
    loadTransactions();
    loadPendingProperties();
  }, []);

  useEffect(() => {
    if (currentUser?.id) {
      setWishlistUserId(String(currentUser.id));
      loadWishlist(currentUser.id);
    }
  }, [currentUser]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json") ? await response.json() : null;

    if (!response.ok) {
      throw new Error(data?.detail || "Request failed");
    }

    return data;
  }

  async function runAction(action, successMessage) {
    setLoading(true);
    try {
      const result = await action();
      setNotice({ type: "success", text: successMessage });
      return result;
    } catch (error) {
      setNotice({ type: "error", text: error.message });
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function loadProperties(filters = {}) {
    const params = new URLSearchParams();
    if (filters.city || cityFilter) params.set("city", filters.city || cityFilter);
    if (filters.status || statusFilter) params.set("status", filters.status || statusFilter);
    const query = params.toString();
    const data = await request(`/properties${query ? `?${query}` : ""}`);
    setProperties(data);
  }

  async function loadTransactions() {
    const data = await request("/transactions");
    setTransactions(data);
  }

  async function loadPendingProperties() {
    const data = await request("/admin/properties/pending");
    setPendingProperties(data);
  }

  async function loadWishlist(userId = wishlistUserId) {
    if (!userId) {
      setNotice({ type: "error", text: "Enter a user ID to load wishlist items." });
      return;
    }

    await runAction(async () => {
      const data = await request(`/wishlists/users/${userId}`);
      setWishlist(data);
    }, "Wishlist refreshed.");
  }

  async function registerUser(event) {
    event.preventDefault();
    const user = await runAction(async () => {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userForm),
      });
    }, "Account created.");

    if (user) {
      setCurrentUser(user);
      setUserForm(emptyUser);
    }
  }

  async function login(event) {
    event.preventDefault();
    const user = await runAction(async () => {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail }),
      });
    }, "Signed in.");

    if (user) setCurrentUser(user);
  }

  async function createProperty(event) {
    event.preventDefault();
    const created = await runAction(async () => {
      return request("/properties", {
        method: "POST",
        body: JSON.stringify({
          ...propertyForm,
          price: Number(propertyForm.price),
          bedrooms: Number(propertyForm.bedrooms),
          bathrooms: Number(propertyForm.bathrooms),
          area: Number(propertyForm.area),
          owner_id: Number(propertyForm.owner_id),
        }),
      });
    }, "Property submitted for approval.");

    if (created) {
      setPropertyForm(emptyProperty);
      await loadProperties();
      await loadPendingProperties();
    }
  }

  async function addWishlist(propertyId) {
    const userId = currentUser?.id || wishlistUserId;
    if (!userId) {
      setNotice({ type: "error", text: "Sign in or enter a wishlist user ID first." });
      return;
    }

    await runAction(async () => {
      await request("/wishlists", {
        method: "POST",
        body: JSON.stringify({ user_id: Number(userId), property_id: Number(propertyId) }),
      });
      await loadWishlist(userId);
    }, "Property added to wishlist.");
  }

  async function removeWishlist(wishlistId) {
    await runAction(async () => {
      await request(`/wishlists/${wishlistId}`, { method: "DELETE" });
      await loadWishlist();
    }, "Wishlist item removed.");
  }

  async function createTransaction(event) {
    event.preventDefault();
    const created = await runAction(async () => {
      return request("/transactions", {
        method: "POST",
        body: JSON.stringify({
          property_id: Number(transactionForm.property_id),
          buyer_id: Number(transactionForm.buyer_id),
          seller_id: Number(transactionForm.seller_id),
          amount: Number(transactionForm.amount),
        }),
      });
    }, "Transaction completed.");

    if (created) {
      setTransactionForm({ property_id: "", buyer_id: "", seller_id: "", amount: "" });
      await loadTransactions();
    }
  }

  async function buyProperty(property) {
    if (!currentUser?.id) {
      setNotice({ type: "error", text: "Login before buying or renting a property." });
      setActiveView("account");
      return;
    }

    if (currentUser.id === property.owner_id) {
      setNotice({ type: "error", text: "You cannot buy or rent your own property." });
      return;
    }

    const created = await runAction(async () => {
      return request("/transactions", {
        method: "POST",
        body: JSON.stringify({
          property_id: Number(property.id),
          buyer_id: Number(currentUser.id),
          seller_id: Number(property.owner_id),
          amount: Number(property.price),
        }),
      });
    }, `${property.listing_type === "rent" ? "Rental" : "Purchase"} transaction completed.`);

    if (created) await loadTransactions();
  }

  async function updateStatus(propertyId, status) {
    await runAction(async () => {
      await request(`/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadProperties();
      await loadPendingProperties();
    }, `Property ${status}.`);
  }

  async function applyFilters(event) {
    event.preventDefault();
    await runAction(() => loadProperties({ city: cityFilter, status: statusFilter }), "Listings refreshed.");
  }

  return (
    <main>
      <header className="topbar">
        <button className="brand" type="button" onClick={() => setActiveView("explore")}>
          LifeRentals
        </button>
        <button className="location-button" type="button" onClick={() => setActiveView("explore")}>
          {cityFilter || "Select city"}
        </button>
        <div className="topbar-actions">
          <button className="plain-link" type="button" onClick={() => setActiveView("account")}>
            {currentUser ? `${currentUser.name} #${currentUser.id}` : "Login"}
          </button>
          <button className="post-pill" type="button" onClick={() => setActiveView("list")}>
            Post Property
          </button>
        </div>
      </header>

      <nav className="category-nav">
        {navItems.map((item) => (
          <button
            className={
              (item.label === "Buy" && activeView === "explore" && listingTypeFilter === "buy") ||
              (item.label === "Rent" && activeView === "explore" && listingTypeFilter === "rent") ||
              (!["Buy", "Rent"].includes(item.label) && activeView === item.id)
                ? "active"
                : ""
            }
            key={`${item.id}-${item.label}`}
            type="button"
            onClick={() => {
              if (item.label === "Buy") setListingTypeFilter("buy");
              if (item.label === "Rent") setListingTypeFilter("rent");
              setActiveView(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {activeView === "explore" && (
        <section className="hero-search">
          <h1>Start your LifeRentals journey</h1>
          <div className="search-tabs">
            {["buy", "rent"].map((tab) => (
              <button
                className={listingTypeFilter === tab ? "active" : ""}
                key={tab}
                type="button"
                onClick={() => {
                  setListingTypeFilter(tab);
                  setActiveView("explore");
                }}
              >
                {tab === "buy" ? "Buy" : "Rent"}
              </button>
            ))}
            <button type="button" onClick={() => setActiveView("list")}>Post Property</button>
          </div>

          <form className="search-bar" onSubmit={applyFilters}>
            <label>
              <span>City</span>
              <input
                aria-label="City filter"
                placeholder="Bangalore"
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
              />
            </label>
            <label>
              <span>Property type</span>
              <input
                aria-label="Property type filter"
                placeholder="Flat, Villa"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
              />
            </label>
            <label>
              <span>Budget</span>
              <input
                aria-label="Budget filter"
                min="0"
                placeholder="Max price"
                type="number"
                value={budgetFilter}
                onChange={(event) => setBudgetFilter(event.target.value)}
              />
            </label>
            <button type="submit">Search</button>
          </form>
        </section>
      )}

      <div className={`notice ${notice.type}`}>{loading ? "Working..." : notice.text}</div>

      {activeView === "explore" && (
        <section className="content-section">
          <div className="section-heading">
            <h2>We've got properties for everyone</h2>
            <select
              aria-label="Status filter"
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                runAction(() => loadProperties({ status: event.target.value }), "Listings refreshed.");
              }}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <PropertyGrid properties={filteredProperties} onWishlist={addWishlist} onBuy={buyProperty} />
        </section>
      )}

      {activeView === "list" && (
        <section className="content-section two-column">
          <Panel title="Submit a property">
            <PropertyForm form={propertyForm} setForm={setPropertyForm} onSubmit={createProperty} />
          </Panel>
          <PropertyGrid properties={pendingProperties} compact onWishlist={addWishlist} onBuy={buyProperty} />
        </section>
      )}

      {activeView === "wishlist" && (
        <section className="content-section">
          <Panel title="Wishlist manager">
            <form className="inline-form" onSubmit={(event) => {
              event.preventDefault();
              loadWishlist();
            }}>
              <input
                aria-label="Wishlist user ID"
                placeholder="User ID"
                value={wishlistUserId}
                onChange={(event) => setWishlistUserId(event.target.value)}
              />
              <button type="submit">Load wishlist</button>
            </form>
          </Panel>
          <div className="table-panel">
            <Table
              headers={["Wishlist ID", "User", "Property", "Created", ""]}
              rows={wishlist.map((item) => [
                item.id,
                item.user_id,
                item.property_id,
                formatDate(item.created_at),
                <button className="danger" type="button" onClick={() => removeWishlist(item.id)}>Remove</button>,
              ])}
            />
          </div>
        </section>
      )}

      {activeView === "transactions" && (
        <section className="content-section two-column">
          <Panel title="Complete buy or rent transaction">
            <TransactionForm form={transactionForm} setForm={setTransactionForm} onSubmit={createTransaction} />
          </Panel>
          <div className="table-panel">
            <Table
              headers={["ID", "Property", "Buying user", "Selling user", "Amount", "Status"]}
              rows={transactions.map((item) => [
                item.id,
                item.property_id,
                item.buyer_id,
                item.seller_id,
                currency(item.amount),
                item.status,
              ])}
            />
          </div>
        </section>
      )}

      {activeView === "admin" && (
        <section className="content-section">
          <Panel title="Pending approvals">
            <button type="button" onClick={() => runAction(loadPendingProperties, "Pending listings refreshed.")}>
              Refresh pending
            </button>
          </Panel>
          <div className="property-grid">
            {pendingProperties.map((property) => (
              <article className="property-card" key={property.id}>
                <PropertySummary property={property} />
                <div className="card-actions">
                  <button type="button" onClick={() => updateStatus(property.id, "approved")}>Approve</button>
                  <button className="danger" type="button" onClick={() => updateStatus(property.id, "rejected")}>
                    Reject
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeView === "account" && (
        <section className="content-section two-column">
          <Panel title="Create account">
            <form className="stack-form" onSubmit={registerUser}>
              <input placeholder="Name" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required />
              <input type="email" placeholder="Email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
              <input placeholder="Phone" value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} required />
              <button type="submit">Register</button>
            </form>
          </Panel>

          <Panel title="Sign in">
            <form className="stack-form" onSubmit={login}>
              <input
                type="email"
                placeholder="Email"
                value={loginEmail}
                onChange={(event) => setLoginEmail(event.target.value)}
                required
              />
              <button type="submit">Login</button>
            </form>
            {currentUser && (
              <div className="profile-card">
                <span>{currentUser.role}</span>
                <strong>{currentUser.name}</strong>
                <small>{currentUser.email}</small>
                <small>User ID: {currentUser.id}</small>
              </div>
            )}
          </Panel>
        </section>
      )}
    </main>
  );
}

function Panel({ title, children }) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

function PropertyForm({ form, setForm, onSubmit }) {
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
      <input type="number" min="1" placeholder="Owner user ID" value={form.owner_id} onChange={(event) => setForm({ ...form, owner_id: event.target.value })} required />
      <button type="submit">Submit listing</button>
    </form>
  );
}

function TransactionForm({ form, setForm, onSubmit }) {
  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <input type="number" min="1" placeholder="Property ID" value={form.property_id} onChange={(event) => setForm({ ...form, property_id: event.target.value })} required />
      <input type="number" min="1" placeholder="Buying user ID" value={form.buyer_id} onChange={(event) => setForm({ ...form, buyer_id: event.target.value })} required />
      <input type="number" min="1" placeholder="Selling user ID" value={form.seller_id} onChange={(event) => setForm({ ...form, seller_id: event.target.value })} required />
      <input type="number" min="0" placeholder="Amount" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
      <button type="submit">Complete transaction</button>
    </form>
  );
}

function PropertyGrid({ properties, onWishlist, onBuy, compact = false }) {
  if (!properties.length) {
    return <div className="empty-state">No properties to show.</div>;
  }

  return (
    <div className={`property-grid ${compact ? "compact" : ""}`}>
      {properties.map((property) => (
        <article className="property-card" key={property.id}>
          <PropertySummary property={property} />
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

function PropertySummary({ property }) {
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

function Table({ headers, rows }) {
  if (!rows.length) return <div className="empty-state">Nothing here yet.</div>;

  return (
    <table>
      <thead>
        <tr>
          {headers.map((header) => <th key={header}>{header}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function currency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

createRoot(document.getElementById("root")).render(<App />);
