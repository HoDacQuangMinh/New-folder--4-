import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onLogin(trimmed);
  };

  return (
    <section className="screen login-screen fade-in">
      <div className="hellframe hellframe-large">
        <div className="hellframe-top-crest" />
        <div className="hellframe-bottom-crest" />

        <header className="hellframe-header">
          <p className="hellframe-kicker">UI · LOGIN SCREEN · FANTASY</p>
          <h2 className="hellframe-title">Welcome, Apprentice Scribe</h2>
        </header>

        <p className="hellframe-subtitle">
          Speak your name, that it may be etched into the Ledger of Gregg.
        </p>

        <form className="hellframe-form" onSubmit={handleSubmit}>
          <label className="form-label">
            Name
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Minh of the Ember Quill"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <button type="submit" className="btn btn-primary">
            <span className="btn-inner">Enter the Archives</span>
          </button>
        </form>
      </div>
    </section>
  );
}
