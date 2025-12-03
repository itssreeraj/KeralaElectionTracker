"use client";

export default function AdminHome() {
  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Panel</h1>
      <button onClick={logout} style={logoutBtn}>
        Logout
      </button>

      <div style={{ marginTop: 20 }}>
        <a href="/" style={{ fontSize: 20 }}>← Back to Home</a>
      </div>
    </div>
  );
}

const logoutBtn: React.CSSProperties = {
  padding: "10px 16px",
  background: "red",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
