import React from "react";
import { LEVELS } from "../levels.js";

export default function Menu({ user, level, setLevel, goPractice, goSettings }) {
  return (
    <section className="screen menu-screen fade-in">
      <div className="hellframe hellframe-medium">
        <div className="hellframe-top-crest" />
        <div className="hellframe-bottom-crest" />

        <header className="hellframe-header">
          <p className="hellframe-kicker">Main Menu</p>
          <h2 className="hellframe-title">
            {user ? `Apprentice ${user}` : "Apprentice"} · Hellfire Console
          </h2>
        </header>

        <div className="menu-layout">
          <div className="menu-actions">
            <button className="btn btn-primary" onClick={goPractice}>
              <span className="btn-inner">Continue Quest</span>
            </button>
            <button className="btn btn-secondary" onClick={goPractice}>
              <span className="btn-inner">Practice Sigils</span>
            </button>
            <button className="btn btn-ghost" onClick={goSettings}>
              <span className="btn-inner">Game Options</span>
            </button>
          </div>

          <div className="menu-levels">
            <h3 className="levels-title">Realms of Study</h3>
            <div className="levels-list">
              {LEVELS.map((lvl) => (
                <div
                  key={lvl.id}
                  className={
                    "level-badge " +
                    (lvl.id === level.id ? "level-badge-active" : "")
                  }
                  onClick={() => setLevel(lvl)}
                >
                  <div className="level-badge-title">Level {lvl.id}</div>
                  <div className="level-badge-name">{lvl.name}</div>
                </div>
              ))}
            </div>
            <p className="levels-hint">
              Each realm shifts the ambience and the speed of falling glyphs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
