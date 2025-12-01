import React from "react";
import { LEVELS } from "../levels.js";

export default function Settings({ level, setLevel, goBack }) {
  return (
    <section className="screen settings-screen fade-in">
      <div className="hellframe hellframe-medium">
        <div className="hellframe-top-crest" />
        <div className="hellframe-bottom-crest" />

        <header className="hellframe-header">
          <p className="hellframe-kicker">Game Options</p>
          <h2 className="hellframe-title">Bindings &amp; Arcane Settings</h2>
        </header>

        <div className="settings-layout">
          <section className="settings-section">
            <h3>Sound &amp; Music</h3>
            <div className="settings-row">
              <label>
                <input type="checkbox" defaultChecked /> Sound effects
              </label>
            </div>
            <div className="settings-row">
              <label>
                <input type="checkbox" defaultChecked /> Background music
              </label>
            </div>
          </section>

          <section className="settings-section">
            <h3>Difficulty &amp; Speed</h3>
            <div className="settings-row">
              <label>Difficulty</label>
              <select defaultValue="normal">
                <option value="easy">Novice</option>
                <option value="normal">Adept</option>
                <option value="hard">Master</option>
              </select>
            </div>
            <div className="settings-row">
              <label>Drop speed multiplier</label>
              <input type="range" min="0.5" max="2.5" step="0.1" defaultValue="1" />
              <span>1.0×</span>
            </div>
          </section>

          <section className="settings-section">
            <h3>Input Mode</h3>
            <div className="settings-row">
              <label>
                <input type="radio" name="inputMode" defaultChecked /> English
                word
              </label>
            </div>
            <div className="settings-row">
              <label>
                <input type="radio" name="inputMode" /> Shorthand keystrokes
              </label>
            </div>
          </section>

          <section className="settings-section settings-realms">
            <h3>Realm Preview</h3>
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
          </section>
        </div>

        <div className="settings-footer">
          <button className="btn btn-ghost">
            <span className="btn-inner">Reset to Defaults</span>
          </button>
          <button className="btn btn-primary" onClick={goBack}>
            <span className="btn-inner">Back to Menu</span>
          </button>
        </div>
      </div>
    </section>
  );
}
