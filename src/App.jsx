import React, { useState, useEffect, useRef } from 'react';

// --- GAME DATA: WORD LISTS ---
// INSTRUCTIONS: Add the names of your PNG files here (without .png).
// The game will automatically look for them in the /public/datasets/ folders.
const WORD_BANKS = {
    1: ["the", "in", "can", "of", "it", "to", "in", "that", "was"], // Brief forms
    2: ["go", "he", "good", "put", "be", "are", "have", "will"], // Common words
    3: ["time", "day", "come", "take", "make", "know", "like"], 
    4: ["receive", "payment", "attention", "business", "gentlemen"], // Complex
    5: ["i will not", "it is not", "i have not", "there is not", "i can not"] // Phrases (will look in phrases folder)
};

// --- COMPONENTS ---

const GameHUD = ({ level, score, lives, mode }) => (
    <div className="game-hud">
        <div className="hud-section">
            <span className="hud-label">Realm</span>
            <span className="hud-value text-glow-gold">{mode === 'practice' ? '∞' : level}</span>
        </div>
        <div className="hud-center">
            <div className="shield-mini"></div>
            <span className="hud-score">{score}</span>
        </div>
        <div className="hud-section">
            <span className="hud-label">Spirit</span>
            <div className="lives-container">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className={`life-orb ${i < lives ? 'active' : 'broken'}`} />
                ))}
            </div>
        </div>
    </div>
);

// --- SMART DRAWING CANVAS ---
const DrawingCanvas = ({ imageSrc, onSuccess }) => {
    const canvasRef = useRef(null);
    const [targetPixels, setTargetPixels] = useState([]); 
    const [touchedPixels, setTouchedPixels] = useState(new Set()); 
    const [isFading, setIsFading] = useState(false);
    const [imgError, setImgError] = useState(false); 
    const CANVAS_SIZE = 500; 

    // Reset error when image changes
    useEffect(() => {
        setImgError(false);
    }, [imageSrc]);

    // 1. Analyze the PNG when it loads
    useEffect(() => {
        if (!imageSrc || imgError) return;

        const img = new Image();
        img.src = imageSrc;
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = CANVAS_SIZE;
            canvas.height = CANVAS_SIZE;
            const ctx = canvas.getContext('2d');
            
            // Draw image to hidden canvas to read pixels
            ctx.drawImage(img, 50, 50, CANVAS_SIZE - 100, CANVAS_SIZE - 100); 
            
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const data = imageData.data;
            const targets = [];

            // Scan for strokes (Looking for non-transparent pixels)
            for(let i = 0; i < data.length; i += 4) {
                const alpha = data[i+3];
                // Threshold: If pixel is not transparent, it's part of the line
                if (alpha > 50) {
                    targets.push(i / 4); 
                }
            }
            setTargetPixels(targets);
            clearVisibleCanvas();
        };

        img.onerror = () => {
            console.error("FAILED TO LOAD IMAGE:", imageSrc);
            setImgError(true);
        }
    }, [imageSrc, imgError]);

    const clearVisibleCanvas = () => {
        const mainCanvas = canvasRef.current;
        if(mainCanvas) {
            const mainCtx = mainCanvas.getContext('2d');
            mainCtx.clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
        }
        setTouchedPixels(new Set());
        setIsFading(false);
    };

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    };

    const draw = (e) => {
        if (isFading) return; 
        if (e.buttons !== 1 && e.type !== 'touchmove') return;
        e.preventDefault();
        
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2); 
        ctx.fillStyle = "rgba(0, 255, 170, 0.5)"; 
        ctx.fill();

        // Hit detection
        const width = CANVAS_SIZE;
        const pixelIndex = Math.floor(y) * width + Math.floor(x);
        
        // Check neighborhood for target pixels
        const hitRange = 1000; 
        for (let i = pixelIndex - hitRange; i < pixelIndex + hitRange; i++) {
            if (targetPixels.includes(i)) { 
                setTouchedPixels(prev => {
                    const next = new Set(prev);
                    next.add(i);
                    return next;
                });
            }
        }
    };

    const endDraw = () => {
        if (targetPixels.length === 0 || isFading) return;
        
        // Verification Logic:
        const coverage = touchedPixels.size / targetPixels.length;
        
        // Lowered threshold to 15% to be more forgiving
        if (coverage > 0.15) { 
            onSuccess();
        } else {
            // Fail Condition: Fade out after 1 second if attempted
            if (touchedPixels.size > 0) {
                setTimeout(() => {
                    setIsFading(true); 
                    setTimeout(() => {
                        clearVisibleCanvas();
                    }, 500); 
                }, 1000); 
            }
        }
    };

    return (
        <div className="canvas-wrapper">
            {imgError ? (
                <div style={{color: 'red', textAlign: 'center', marginTop: '150px'}}>
                    <b>IMAGE NOT FOUND</b><br/>
                    <small style={{fontSize:'0.6rem'}}>{imageSrc}</small>
                </div>
            ) : (
                <img 
                    src={imageSrc} 
                    alt="Trace Guide" 
                    className="trace-image"
                    draggable="false"
                    onError={() => setImgError(true)}
                />
            )}
            
            <canvas 
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className={`magic-canvas ${isFading ? 'fading' : ''}`}
                onMouseDown={draw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
            />
        </div>
    );
};

// --- GAMEPLAY SCREEN ---
const GameScreen = ({ level, setLevel, onGameOver, onWin, mode, onExit }) => {
    const [currentWordObj, setCurrentWordObj] = useState(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [enemyState, setEnemyState] = useState('idle');
    
    // Updated Spawner: Generates path dynamically from word list
    const spawnWord = () => {
        // 1. Get word list for current level (or fallback to level 1)
        const wordList = WORD_BANKS[level] || WORD_BANKS[1];
        
        // 2. Pick a random word
        const randomWord = wordList[Math.floor(Math.random() * wordList.length)];
        
        // 3. Construct filename (replace spaces with underscores for phrases)
        const filename = randomWord.replace(/ /g, "_") + ".png";
        
        // 4. Determine folder based on level (Phrases are usually Level 5 in this logic)
        // Adjust this logic if your phrases start earlier
        const folder = level >= 5 ? "gregg-preanniversary-phrases" : "gregg-preanniversary-words";
        
        const newWordObj = {
            word: randomWord,
            imageSrc: `/datasets/images/${folder}/train/${filename}`,
            hint: "Trace the Outline"
        };

        setCurrentWordObj(newWordObj);
        setEnemyState('idle');
    };

    useEffect(() => { spawnWord(); }, [level]);

    const handleSuccess = () => {
        if(enemyState === 'hit') return; 
        setEnemyState('hit');
        setScore(s => s + 150);
        setTimeout(() => {
            if (mode === 'campaign' && score > 0 && score % 450 === 0) {
                if (level < 5) setLevel(l => l + 1);
                else onWin();
            } else {
                spawnWord();
            }
        }, 600);
    };

    return (
        <section className="screen game-screen fade-in">
            <div className="hellframe hellframe-game">
                <GameHUD level={level} score={score} lives={lives} mode={mode} />
                <div className="battle-arena">
                    <div className={`enemy-container ${enemyState}`}>
                        <div className="enemy-sprite">
                            <div className="demon-body"></div>
                            <div className="demon-eyes"></div>
                        </div>
                        <div className="enemy-word-bubble">
                            Write: <span className="highlight-word">{currentWordObj?.word}</span>
                        </div>
                    </div>
                    <div className="drawing-area">
                        {currentWordObj && (
                            <DrawingCanvas 
                                imageSrc={currentWordObj.imageSrc} 
                                onSuccess={handleSuccess}
                            />
                        )}
                        <p className="glyph-hint">{currentWordObj?.hint}</p>
                    </div>
                </div>
                <div className="game-footer">
                    <button className="btn-text" onClick={onExit}>Retreat (Exit)</button>
                </div>
            </div>
        </section>
    );
};

// --- MENU SCREEN ---
const MainMenu = ({ onStart, onPractice, onSettings, onLogout }) => (
    <section className="screen menu-screen fade-in">
        <div className="hellframe-menu">
            <div className="menu-internal-container">
                <header className="menu-header">
                    <h1 className="hellframe-title text-glow-red">GRIMOIRE OF GREGG</h1>
                    <div className="separator-line"></div>
                    <p className="hellframe-kicker">Draw Runes to Defeat Darkness</p>
                </header>
                <div className="menu-grid">
                    <button className="btn-menu-large" onClick={onStart}>
                        <div className="btn-icon-left">⚔️</div>
                        <div className="btn-content">
                            <span className="btn-title">Campaign</span>
                            <span className="btn-desc">Draw to Survive</span>
                        </div>
                    </button>
                    <button className="btn-menu-large" onClick={onPractice}>
                        <div className="btn-icon-left">🔮</div>
                        <div className="btn-content">
                            <span className="btn-title">Practice</span>
                            <span className="btn-desc">Free Drawing</span>
                        </div>
                    </button>
                    <div className="menu-row">
                        <button className="btn-menu-small" onClick={onSettings}>SETTINGS</button>
                        <button className="btn-menu-small" onClick={onLogout}>LOGOUT</button>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// --- SETTINGS ---
const SettingsScreen = ({ goBack }) => (
    <section className="screen settings-screen fade-in">
        <div className="hellframe hellframe-medium">
            <header className="hellframe-header"><h2 className="hellframe-title">SETTINGS</h2></header>
            <div className="settings-layout">
                <div className="settings-row"><span>Sensitivity</span><input type="range" className="gothic-range" /></div>
            </div>
            <div className="settings-footer"><button className="btn-text" onClick={goBack}>Back</button></div>
        </div>
    </section>
);

// --- LOGIN ---
const LoginScreen = ({ onLogin }) => (
    <section className="screen login-screen fade-in">
        <div className="banner-release"><span>RELEASE</span></div>
        <div className="hellframe hellframe-login">
            <div className="gem gem-tl"></div><div className="gem gem-tr"></div>
            <div className="gem gem-bl"></div><div className="gem gem-br"></div>
            <div className="hellframe-top-crest" />
            <header className="hellframe-header">
                <div className="shield-icon"></div>
                <h2 className="hellframe-title text-glow-red">SIGN IN</h2>
            </header>
            <div className="login-form">
                <div className="input-group"><input type="text" placeholder="Mage Name" className="gothic-input" /></div>
                <div className="input-group"><input type="password" placeholder="Password" className="gothic-input" /></div>
                <div className="login-options">
                    <label className="checkbox-container"><input type="checkbox" defaultChecked /><span className="checkmark"></span>Remember Me</label>
                    <button className="btn-text small-link">Forgot?</button>
                </div>
                <div className="action-area">
                    <button className="btn-diamond" onClick={onLogin}><div className="diamond-shape"><span className="btn-label">ENTER</span></div></button>
                </div>
            </div>
            <div className="hellframe-bottom-crest" />
        </div>
    </section>
);

// --- ROOT ---
export default function App() {
    const [screen, setScreen] = useState('login');
    const [level, setLevel] = useState(1);
    const [gameMode, setGameMode] = useState('campaign');

    const startGame = (mode) => {
        setGameMode(mode);
        setLevel(1);
        setScreen('game');
    };

    return (
        <div className="app-root">
            <link rel="stylesheet" href="Fixed_Gothic_Theme.css" />
            <div className="app-container">
                {screen === 'login' && <LoginScreen onLogin={() => setScreen('menu')} />}
                {screen === 'menu' && <MainMenu onStart={() => startGame('campaign')} onPractice={() => startGame('practice')} onSettings={() => setScreen('settings')} onLogout={() => setScreen('login')} />}
                {screen === 'game' && <GameScreen level={level} setLevel={setLevel} mode={gameMode} onGameOver={() => setScreen('menu')} onWin={() => setScreen('menu')} onExit={() => setScreen('menu')} />}
                {screen === 'settings' && <SettingsScreen goBack={() => setScreen('menu')} />}
            </div>
        </div>
    );
}