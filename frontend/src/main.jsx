import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const baseNavItems = [
  { id: "explore", label: "Buy" },
  { id: "explore", label: "Rent" },
  { id: "list", label: "Sell" },
  { id: "wishlist", label: "Wishlist" },
  { id: "transactions", label: "Transactions" },
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
};

const emptyUser = {
  email: "",
  name: "",
  phone: "",
  password: "",
  role: "user",
};

function App() {
  const [activeView, setActiveView] = useState("explore");
  const [authMode, setAuthMode] = useState("login");
  const [properties, setProperties] = useState([]);
  const [pendingProperties, setPendingProperties] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("liferentals_token") || "");
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminListings, setAdminListings] = useState([]);
  const [cityFilter, setCityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [listingTypeFilter, setListingTypeFilter] = useState("buy");
  const [typeFilter, setTypeFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [propertyForm, setPropertyForm] = useState(emptyProperty);
  const [transactionForm, setTransactionForm] = useState({
    property_id: "",
    amount: "",
  });
  const [userForm, setUserForm] = useState(emptyUser);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [notice, setNotice] = useState({ type: "info", text: "Ready to connect to the LifeRentals API." });
  const [loading, setLoading] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  const navItems = useMemo(
    () => (isAdmin ? [...baseNavItems, { id: "admin", label: "Admin" }] : baseNavItems),
    [isAdmin],
  );

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
  }, []);

  useEffect(() => {
    if (!authToken || currentUser) return;

    runAction(async () => {
      const user = await request("/auth/me");
      setCurrentUser(user);
    }, "Session restored.");
  }, [authToken, currentUser]);

  useEffect(() => {
    if (currentUser?.id) {
      loadWishlist(currentUser.id);
      loadTransactions();
    }

    if (currentUser?.role === "admin") {
      loadAdminDashboard();
      loadAdminListings();
      loadPendingProperties();
    }
  }, [currentUser]);

  async function request(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      headers,
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
    const cityValue = Object.prototype.hasOwnProperty.call(filters, "city") ? filters.city : cityFilter;
    const statusValue = Object.prototype.hasOwnProperty.call(filters, "status") ? filters.status : statusFilter;

    if (cityValue) params.set("city", cityValue);
    if (statusValue) params.set("status", statusValue);
    const query = params.toString();
    const data = await request(`/properties${query ? `?${query}` : ""}`);
    setProperties(data);
  }

  async function loadTransactions() {
    if (!authToken) return;
    const data = await request("/transactions");
    setTransactions(data);
  }

  async function loadPendingProperties() {
    if (!isAdmin) return;
    const data = await request("/admin/properties/pending");
    setPendingProperties(data);
  }

  async function loadAdminDashboard() {
    if (!isAdmin) return;
    const data = await request("/admin/dashboard");
    setAdminDashboard(data);
  }

  async function loadAdminListings() {
    if (!isAdmin) return;
    const data = await request("/admin/properties");
    setAdminListings(data);
  }

  async function loadWishlist(userId = currentUser?.id) {
    if (!authToken || !userId) {
      setNotice({ type: "error", text: "Login to load your wishlist." });
      return;
    }

    await runAction(async () => {
      const data = await request(`/wishlists/users/${userId}`);
      setWishlist(data);
    }, "Wishlist refreshed.");
  }

  async function registerUser(event) {
    event.preventDefault();
    const auth = await runAction(async () => {
      return request("/auth/register", {
        method: "POST",
        body: JSON.stringify(userForm),
      });
    }, "Account created.");

    if (auth) {
      setAuthToken(auth.access_token);
      localStorage.setItem("liferentals_token", auth.access_token);
      setCurrentUser(auth.user);
      setUserForm(emptyUser);
    }
  }

  async function login(event) {
    event.preventDefault();
    const auth = await runAction(async () => {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });
    }, "Signed in.");

    if (auth) {
      setAuthToken(auth.access_token);
      localStorage.setItem("liferentals_token", auth.access_token);
      setCurrentUser(auth.user);
      setLoginPassword("");
    }
  }

  function logout() {
    localStorage.removeItem("liferentals_token");
    setAuthToken("");
    setCurrentUser(null);
    setWishlist([]);
    setTransactions([]);
    setPendingProperties([]);
    setAdminDashboard(null);
    setAdminListings([]);
    setActiveView("explore");
    setNotice({ type: "success", text: "Signed out." });
  }

  async function createProperty(event) {
    event.preventDefault();
    if (!currentUser) {
      setNotice({ type: "error", text: "Login before posting a property." });
      setAuthMode("login");
      setActiveView("account");
      return;
    }

    const created = await runAction(async () => {
      return request("/properties", {
        method: "POST",
        body: JSON.stringify({
          ...propertyForm,
          price: Number(propertyForm.price),
          bedrooms: Number(propertyForm.bedrooms),
          bathrooms: Number(propertyForm.bathrooms),
          area: Number(propertyForm.area),
        }),
      });
    }, "Property submitted for approval.");

    if (created) {
      setPropertyForm(emptyProperty);
      await loadProperties();
      if (isAdmin) await loadPendingProperties();
      if (isAdmin) await loadAdminListings();
      if (isAdmin) await loadAdminDashboard();
    }
  }

  async function addWishlist(propertyId) {
    if (!currentUser) {
      setNotice({ type: "error", text: "Login before saving properties." });
      setAuthMode("login");
      setActiveView("account");
      return;
    }

    await runAction(async () => {
      await request("/wishlists", {
        method: "POST",
        body: JSON.stringify({ property_id: Number(propertyId) }),
      });
      await loadWishlist();
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
    if (!currentUser) {
      setNotice({ type: "error", text: "Login before completing a transaction." });
      setAuthMode("login");
      setActiveView("account");
      return;
    }

    const created = await runAction(async () => {
      return request("/transactions", {
        method: "POST",
        body: JSON.stringify({
          property_id: Number(transactionForm.property_id),
          amount: Number(transactionForm.amount),
        }),
      });
    }, "Transaction completed.");

    if (created) {
      setTransactionForm({ property_id: "", amount: "" });
      await loadTransactions();
      if (isAdmin) await loadAdminDashboard();
    }
  }

  async function buyProperty(property) {
    if (!currentUser?.id) {
      setNotice({ type: "error", text: "Login before buying or renting a property." });
      setAuthMode("login");
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
          amount: Number(property.price),
        }),
      });
    }, `${property.listing_type === "rent" ? "Rental" : "Purchase"} transaction completed.`);

    if (created) await loadTransactions();
  }

  async function updateStatus(propertyId, status) {
    if (!isAdmin) {
      setNotice({ type: "error", text: "Admin privileges required." });
      return;
    }

    await runAction(async () => {
      await request(`/admin/properties/${propertyId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadProperties();
      await loadPendingProperties();
      await loadAdminListings();
      await loadAdminDashboard();
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
          <button
            className="plain-link"
            type="button"
            onClick={() => {
              setAuthMode("login");
              setActiveView("account");
            }}
          >
            {currentUser ? `${currentUser.name} #${currentUser.id}` : "Login"}
          </button>
          {!currentUser && (
            <button
              className="plain-link"
              type="button"
              onClick={() => {
                setAuthMode("register");
                setActiveView("account");
              }}
            >
              Register
            </button>
          )}
          {currentUser && (
            <button className="plain-link" type="button" onClick={logout}>
              Logout
            </button>
          )}
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
          {!currentUser && (
            <div className="hero-auth-actions">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setActiveView("account");
                }}
              >
                Login
              </button>
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setActiveView("account");
                }}
              >
                Register
              </button>
            </div>
          )}
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
            <button type="button" onClick={() => loadWishlist()}>
              Load my wishlist
            </button>
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
          <Panel title="Admin dashboard">
            <div className="metric-grid">
              <Metric label="Users" value={adminDashboard?.analytics?.users || 0} />
              <Metric label="Listings" value={adminDashboard?.analytics?.properties || 0} />
              <Metric label="Pending" value={adminDashboard?.analytics?.pending_properties || 0} />
              <Metric label="Transactions" value={adminDashboard?.analytics?.transactions || 0} />
              <Metric label="Revenue" value={currency(adminDashboard?.analytics?.revenue || 0)} />
            </div>
            <button type="button" onClick={() => runAction(async () => {
              await loadAdminDashboard();
              await loadAdminListings();
              await loadPendingProperties();
            }, "Admin dashboard refreshed.")}>
              Refresh dashboard
            </button>
          </Panel>

          <Panel title="All listings">
            <Table
              headers={["ID", "Title", "City", "Owner", "Type", "Status", "Price"]}
              rows={adminListings.map((property) => [
                property.id,
                property.title,
                property.city,
                property.owner_id,
                property.listing_type,
                property.status,
                currency(property.price),
              ])}
            />
          </Panel>

          <Panel title="Pending approvals">
            <button type="button" onClick={() => runAction(() => loadPendingProperties(), "Pending listings refreshed.")}>
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
        <section className="content-section auth-section">
          <Panel title={authMode === "login" ? "Sign in" : "Create account"}>
            <div className="auth-switch">
              <button
                className={authMode === "login" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                className={authMode === "register" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            {authMode === "register" ? (
              <form className="stack-form" onSubmit={registerUser}>
                <input placeholder="Name" value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} required />
                <input type="email" placeholder="Email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} required />
                <input placeholder="Phone" value={userForm.phone} onChange={(event) => setUserForm({ ...userForm, phone: event.target.value })} required />
                <input type="password" placeholder="Password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} required />
                <button type="submit">Register</button>
              </form>
            ) : (
              <form className="stack-form" onSubmit={login}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(event) => setLoginEmail(event.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(event) => setLoginPassword(event.target.value)}
                  required
                />
                <button type="submit">Login</button>
              </form>
            )}

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

function Metric({ label, value }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
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
      <button type="submit">Submit listing</button>
    </form>
  );
}

function TransactionForm({ form, setForm, onSubmit }) {
  return (
    <form className="stack-form" onSubmit={onSubmit}>
      <input type="number" min="1" placeholder="Property ID" value={form.property_id} onChange={(event) => setForm({ ...form, property_id: event.target.value })} required />
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
