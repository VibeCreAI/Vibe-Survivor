PHASE 5: INPUT HANDLING CODE EXTRACTION ANALYSIS
================================================

File: js/vibe-survivor-game.js
Date: 2025-11-06
Thoroughness: VERY THOROUGH - All input-related code identified

========================================
1. KEYBOARD INPUT HANDLING
========================================

1.1 KEY STATE OBJECT
- Location: Line 34
- Property: this.keys = {}
- Purpose: Tracks currently pressed keys

1.2 PRIMARY KEYDOWN LISTENER
- Location: Lines 3091-3222
- Event: document.addEventListener('keydown')
- Key Bindings:
  * Arrow Up / W (Lines 3096-3097): Menu up, scroll up
  * Arrow Down / S (Lines 3113-3114): Menu down, scroll down  
  * Arrow Left / A (Lines 3130-3131): Menu left, cycle tabs
  * Arrow Right / D (Lines 3140-3141): Menu right, cycle tabs
  * Enter (Line 3150): Select menu item
  * Escape (Line 3155): Close menus / toggle pause
  * Space (Line 3203): Dash trigger (this.keys[' '])

1.3 KEYUP LISTENER
- Location: Lines 3224-3227
- Event: document.addEventListener('keyup')
- Clears: this.keys[key.toLowerCase()] and this.keys[key]

1.4 HELP MENU KEYDOWN HANDLER (Dynamic)
- Location: Lines 4354-4368
- Property: this.helpKeydownHandler
- Created: Line 4355
- Attached: Line 3367
- Removed: Line 4421
- Handles: ArrowUp/W/Up, ArrowDown/S/Down for scrolling

1.5 VICTORY SCREEN KEYDOWN HANDLER (Dynamic)
- Location: Lines 12174-12187
- Property: this.victoryKeydownHandler
- Attached: Line 12187
- Removed: Lines 12204, 12231

1.6 KEYBOARD USAGE IN GAME LOGIC
- Player Movement: Lines 3952-3963
  * Keys: 'w'/'arrowup', 's'/'arrowdown', 'a'/'arrowleft', 'd'/'arrowright'
- Dash Mechanic: Line 3983
  * Trigger: this.keys[' '] || this.touchControls.dashButton.pressed
- Dash Direction Fallback: Lines 4004-4015
  * Handles keyboard ghosting with individual key checks

1.7 WINDOW RESIZE HANDLER
- Location: Lines 3229-3238
- Event: window.addEventListener('resize')

========================================
2. MOUSE INPUT HANDLING
========================================

2.1 NOTE: Game uses NEAREST ENEMY TARGETING
- No direct mouse position tracking (clientX/clientY not used for aiming)

2.2 MOUSE DASH BUTTON
- Location: Lines 5527-5542
- Mousedown Handler: Lines 5527-5532
  * Sets: this.touchControls.dashButton.pressed = true
- Mouseup/Mouseleave: Lines 5534-5542
  * Clears: this.touchControls.dashButton.pressed = false

========================================
3. TOUCH INPUT HANDLING
========================================

3.1 TOUCH CONTROLS INITIALIZATION
- Location: Lines 181-200 (Constructor)
- Property: this.touchControls
- Joystick: active, startX, startY, currentX, currentY, moveX, moveY, floating, visible, centerX, centerY, touchId
- Dash Button: pressed, position

3.2 MOBILE DETECTION
- Location: Lines 5165-5169
- Method: detectMobile()
- Property: this.isMobile (set Line 125)

3.3 VIRTUAL JOYSTICK SETUP
- Location: Lines 5373-5523
- Method: setupVirtualJoystick(joystick)

Touchstart (Lines 5404-5448):
- Checks interactive elements, joystick already active, dash button zone
- Sets: active=true, centerX/Y, startX/Y, visible=true, touchId

Touchmove (Lines 5450-5485):
- Finds touch by touchId, calculates delta
- Normalizes to -1 to 1 range for moveX/moveY

Touchend (Lines 5504-5512):
- Resets all joystick state via endTouch()

Touchcancel (Lines 5514-5522):
- Same as touchend

3.4 VIRTUAL DASH BUTTON (Touch)
- Location: Lines 5545-5562
- Touchstart (Lines 5545-5551): Sets pressed=true
- Touchend/Touchcancel: Clears pressed=false

3.5 TOUCH CONTROLS USAGE
- Movement: Lines 3966-3968
- Dash: Line 3983
- Aiming: Lines 4062-4064
- Reset Points: Lines 3757-3762, 11935-11940, 12267-12272

========================================
4. TOUCH SCROLLING HANDLERS
========================================

All follow same pattern with start/move/end methods:

4.1 Pause Scrolling: Lines 4249-4280
4.2 Help Scrolling: Lines 4517-4556
4.3 Level Up Scrolling: Lines 4558-4596
4.4 Game Over Scrolling: Lines 4746-4790
4.5 Victory Scrolling: Lines 4797-4831
4.6 About Scrolling: Lines 4839-4873
4.7 Options Scrolling: Lines 4881-4915

========================================
5. UI BUTTON EVENT LISTENERS
========================================

All Located: Lines 2881-3091

Buttons with both click and touchstart:
- Help: #help-btn (lines 2902-2911)
- Dash Position: #dash-position-btn (lines 2922-2934)
- Close Options: #close-options-btn (lines 2976-2985)
- Close About: #close-about-btn (lines 2993-3002)
- Options Mute: #options-mute-btn (lines 3028-3040)
- Options Dash: #options-dash-btn (lines 3043-3055)
- Close Help: #close-help-btn (lines 3057-3068)
- Help Tabs: #help-guide-tab, #help-status-tab (lines 3078-3089)

Other UI buttons (click only):
- Start: #start-survivor (line 2881)
- Restart: #restart-survivor (line 2886)
- Exit: #exit-survivor (line 2891)
- Pause: #pause-btn (line 2897)
- Resume: #resume-btn (line 2914)
- Mute: #mute-btn (line 2918)
- Exit to Menu: #exit-to-menu-btn (line 2936)
- Confirmations: #exit-confirm-yes/no, #restart-confirm-yes/no
- Options: #options-btn (line 2971)
- About: #about-btn (line 2988)
- Language Select: #language-select (lines 3005-3025)

========================================
6. INPUT INITIALIZATION
========================================

Constructor Setup (Lines 28-250):
- Line 34: this.keys = {}
- Line 125: this.isMobile = this.detectMobile()
- Lines 181-200: this.touchControls object
- Line 129: this.pauseScrollHandler = null
- Line 130: this.levelUpScrollHandler = null

Main Setup (Lines 2881-3240):
- UI button listeners (2881-3091)
- Keyboard listeners (3091-3227)
- Resize listener (3229-3238)
- Mobile controls setup call (3241)

Mobile Controls (Lines 5313-5345):
- Method: setupMobileControls()
- Called: Line 3241 (init), Line 3693 (game start)

========================================
7. MENU NAVIGATION
========================================

State Object (Lines 243-249):
- Properties: active, selectedIndex, menuType, menuButtons, keyboardUsed

Methods:
- activateMenuNavigation() (Lines 4994-5000)
- navigateMenu(direction) (Lines 5097-5111)
- selectCurrentMenuItem() (Lines 5115-5140)
- resetMenuNavigation() (Lines 5141-5145)
- updateMenuSelection() (Lines 5005-5028)

========================================
8. SETTINGS MANAGEMENT
========================================

- Load Settings: Lines 4309-4323
- Save Settings: Lines 4325-4333
- Toggle Dash Position: Lines 4282-4307

========================================
9. EXTRACTION SUMMARY
========================================

HIGH PRIORITY:
1. Keyboard Input (Lines 3091-3227): ~137 lines
2. Touch Input (Lines 5313-5563): ~250 lines
3. Menu Navigation (Lines 4994-5145): ~150 lines
4. Dynamic Handlers (Lines 4354-4422, 12174-12231): ~100 lines

MEDIUM PRIORITY:
5. Settings (Lines 4282-4333): ~50 lines
6. Scroll Handlers (Lines 4249-4915): ~170 lines

LOW PRIORITY:
7. Initialization (Lines 34, 125, 181-200): ~20 lines
8. UI Listeners (Lines 2881-3091): ~210 lines

TOTAL: ~1,087 lines of extractable input code
