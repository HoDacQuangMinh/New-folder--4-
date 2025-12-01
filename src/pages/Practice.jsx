import React from "react";

export default function Practice({ level, goBack }) {
  return (
    <section className="screen practice-screen fade-in">
      <div className="hellframe hellframe-large">
        <div className="hellframe-top-crest" />
        <div className="hellframe-bottom-crest" />

        <header className="hellframe-header">
          <p className="hellframe-kicker">Training Chamber</p>
          <h2 className="hellframe-title">Falling Words · {level.name}</h2>
        </header>

        <p className="hellframe-subtitle">
          A shorthand glyph descends from the void. Type the matching English
          word before it burns out.
        </p>

        <div className="practice-layout">
          <div className="practice-panel practice-left">
            <div className="falling-area">
              <div className="falling-word falling-anim">
                <span className="shorthand-symbol">ꝸ</span>
              </div>
              <div className="timer-bar">
                <div className="timer-bar-fill" />
              </div>
              <div className="ember ember-1" />
              <div className="ember ember-2" />
              <div className="ember ember-3" />
            </div>
          </div>

          <div className="practice-panel practice-right">
            <div className="practice-stats">
              <div>HP: ♥♥♥♥♥</div>
              <div>Score: 0</div>
              <div>Misses: 0</div>
              <div>Mode: English</div>
            </div>

            <form
              className="practice-form"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="form-label">
                Your Answer
                <input
                  className="form-input"
                  placeholder="Type the English word…"
                />
              </label>
              <div className="practice-buttons">
                <button className="btn btn-primary">
                  <span className="btn-inner">Cast Spell</span>
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={goBack}
                >
                  <span className="btn-inner">Back to Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
