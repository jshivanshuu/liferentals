import React from "react";

export default function ProfileDropdown({
  currentUser,
  isProfileDropdownOpen,
  setIsProfileDropdownOpen,
  wishlist,
  removeWishlist,
  currency,
  setActiveView,
  logout
}) {
  return (
    <div className={`profile-dropdown-container ${isProfileDropdownOpen ? "open" : ""}`}>
      <button
        className="profile-trigger"
        type="button"
        onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
      >
        {currentUser.name}
      </button>
      <div className="profile-dropdown-menu">
        <div className="dropdown-user-info">
          <h4>{currentUser.name}</h4>
          <p>{currentUser.email}</p>
          <p>{currentUser.phone}</p>
          <span className={currentUser.role === "admin" ? "admin" : ""}>
            {currentUser.role}
          </span>
        </div>

        <div className="dropdown-section-title">My Wishlist</div>
        <div className="dropdown-wishlist">
          {wishlist.length === 0 ? (
            <div className="dropdown-wishlist-item" style={{ color: "#667085", justifyContent: "center" }}>
              No saved properties.
            </div>
          ) : (
            wishlist.map((item) => (
              <div className="dropdown-wishlist-item" key={item.id}>
                <div>
                  <span title={item.property?.title || `Property #${item.property_id}`}>
                    {item.property?.title || `Property #${item.property_id}`}
                  </span>
                  {item.property && (
                    <div className="price">{currency(item.property.price)}</div>
                  )}
                </div>
                <button
                  className="remove-btn"
                  type="button"
                  onClick={() => removeWishlist(item.id)}
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="dropdown-actions">
          <button
            className="dropdown-link-btn"
            type="button"
            onClick={() => {
              setActiveView("transactions");
              setIsProfileDropdownOpen(false);
            }}
          >
            My Transactions
          </button>

          {currentUser.role === "admin" && (
            <button
              className="dropdown-link-btn"
              type="button"
              onClick={() => {
                setActiveView("admin");
                setIsProfileDropdownOpen(false);
              }}
            >
              Admin Dashboard
            </button>
          )}

          <button
            className="dropdown-logout-btn"
            type="button"
            onClick={() => {
              logout();
              setIsProfileDropdownOpen(false);
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
