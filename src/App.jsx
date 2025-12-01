import React, { useState, useEffect, useRef } from 'react';

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
    
    // INCREASED CANVAS SIZE
    const CANVAS_SIZE = 600; 

    useEffect(() => { setImgError(false); }, [imageSrc]);

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
            
            // --- SCALING LOGIC ---
            // Draw image smaller and centered (e.g., 50% size)
            // This makes it easier to trace and looks less pixelated if the source is small.
            const scale = 0.6; // 60% of canvas size
            const imgWidth = CANVAS_SIZE * scale;
            const imgHeight = CANVAS_SIZE * scale;
            const offsetX = (CANVAS_SIZE - imgWidth) / 2;
            const offsetY = (CANVAS_SIZE - imgHeight) / 2;

            ctx.drawImage(img, offsetX, offsetY, imgWidth, imgHeight); 
            
            const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            const data = imageData.data;
            const targets = [];
            
            // Scan for non-transparent pixels
            for(let i = 0; i < data.length; i += 4) {
                if (data[i+3] > 50) targets.push(i / 4); 
            }
            setTargetPixels(targets);
            
            const mainCanvas = canvasRef.current;
            if(mainCanvas) mainCanvas.getContext('2d').clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
            setTouchedPixels(new Set());
            setIsFading(false);
        };
        img.onerror = () => { console.error("Error loading:", imageSrc); setImgError(true); }
    }, [imageSrc, imgError]);

    const getCoords = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: (clientX - rect.left) * (canvas.width / rect.width),
            y: (clientY - rect.top) * (canvas.height / rect.height)
        };
    };

    const draw = (e) => {
        if (isFading || (e.buttons !== 1 && e.type !== 'touchmove')) return;
        e.preventDefault();
        const { x, y } = getCoords(e);
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        
        // Brush size
        ctx.arc(x, y, 12, 0, Math.PI * 2); 
        ctx.fillStyle = "rgba(0, 255, 170, 0.6)"; 
        ctx.fill();

        const pixelIndex = Math.floor(y) * CANVAS_SIZE + Math.floor(x);
        
        // Hit detection range (larger for smaller image targets)
        const hitRange = 1500; 
        for (let i = pixelIndex - hitRange; i < pixelIndex + hitRange; i++) {
            if (targetPixels.includes(i)) { 
                setTouchedPixels(prev => { const n = new Set(prev); n.add(i); return n; });
            }
        }
    };

    const endDraw = () => {
        if (targetPixels.length === 0 || isFading) return;
        
        // Coverage threshold
        if ((touchedPixels.size / targetPixels.length) > 0.15) { 
            onSuccess();
        } else if (touchedPixels.size > 0) {
            setTimeout(() => {
                setIsFading(true); 
                setTimeout(() => {
                    const mainCanvas = canvasRef.current;
                    if(mainCanvas) mainCanvas.getContext('2d').clearRect(0,0, CANVAS_SIZE, CANVAS_SIZE);
                    setTouchedPixels(new Set());
                    setIsFading(false);
                }, 500); 
            }, 1000); 
        }
    };

    return (
        <div className="canvas-wrapper" style={{width: 400, height: 400}}>
            {imgError ? (
                <div style={{color: 'red', textAlign: 'center', marginTop: '150px'}}>
                    <b>IMAGE NOT FOUND</b><br/>
                    <small style={{fontSize:'0.6rem'}}>{imageSrc}</small>
                </div>
            ) : (
                // Use inline style to force the image to be smaller and centered visually
                // to match the hitbox logic above (60% scale)
                <img 
                    src={imageSrc} 
                    className="trace-image" 
                    draggable="false" 
                    onError={() => setImgError(true)}
                    style={{
                        width: '60%', 
                        height: '60%', 
                        objectFit: 'contain'
                    }}
                />
            )}
            <canvas ref={canvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} className={`magic-canvas ${isFading ? 'fading' : ''}`}
                onMouseDown={draw} onMouseMove={draw} onMouseUp={endDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
        </div>
    );
};

// --- GAMEPLAY SCREEN ---
const GameScreen = ({ level, setLevel, onGameOver, onWin, mode, onExit, fullWordList }) => {
    const [currentWordObj, setCurrentWordObj] = useState(null);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [enemyState, setEnemyState] = useState('idle');
    
    // UPDATED SPAWNER: Uses the exact path from the JSON file
    const spawnWord = () => {
        if (!fullWordList.words || fullWordList.words.length === 0) return;

        let category = "words";
        if (level >= 5) category = "phrases";

        const list = fullWordList[category];
        const randomItem = list[Math.floor(Math.random() * list.length)];
        
        if (randomItem) {
            setCurrentWordObj({
                word: randomItem.word,
                imageSrc: randomItem.path, 
                hint: category === "words" ? "Word Glyph" : "Phrase Glyph"
            });
            setEnemyState('idle');
        }
    };

    // Initial Spawn
    useEffect(() => { spawnWord(); }, [level, fullWordList]);

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

    if (!fullWordList.words || fullWordList.words.length === 0) return <div className="loading-text">Loading Grimoire...</div>;

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
                            <DrawingCanvas imageSrc={currentWordObj.imageSrc} onSuccess={handleSuccess} />
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
    
    const [fullWordList, setFullWordList] = useState({ words: [], phrases: [] });

    useEffect(() => {
        fetch('/game_data.json')
            .then(res => res.json())
            .then(data => {
                console.log("Grimoire Loaded:", data.words.length, "words found.");
                setFullWordList(data);
            })
            .catch(err => console.error("Failed to load Grimoire Index. Run 'node scan_images.js' first!", err));
    }, []);

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
                {screen === 'game' && (
                    <GameScreen 
                        level={level} 
                        setLevel={setLevel} 
                        mode={gameMode} 
                        onGameOver={() => setScreen('menu')} 
                        onWin={() => setScreen('menu')} 
                        onExit={() => setScreen('menu')}
                        fullWordList={fullWordList}
                    />
                )}
                {screen === 'settings' && <SettingsScreen goBack={() => setScreen('menu')} />}
            </div>
        </div>
    );
}