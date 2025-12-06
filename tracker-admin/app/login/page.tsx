"use client";

import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: any) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      window.location.href = "/admin";
    } else {
      setError("Invalid username or password");
    }
  }

  return (
    <div style={{ padding: 40, maxWidth: 400, margin: "80px auto" }}>
      <h2>Admin Login</h2>

      <form onSubmit={onSubmit} style={{ marginTop: 20 }}>
        <input
          type="text"
          placeholder="Username"
          style={inputStyle}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          style={inputStyle}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div style={{ color: "red", marginBottom: 10 }}>{error}</div>}

        <button type="submit" style={btnStyle}>
          Login
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  marginBottom: 12,
  fontSize: 16,
  borderRadius: 6,
  border: "1px solid #999",
};

const btnStyle: React.CSSProperties = {
  width: "100%",
  padding: 12,
  background: "#0d6efd",
  color: "white",
  borderRadius: 6,
  border: "none",
  fontSize: 16,
  cursor: "pointer",
};
