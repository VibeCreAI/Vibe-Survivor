# PHASE 5 INPUT EXTRACTION - COMPREHENSIVE LINE-BY-LINE ANALYSIS

File: js/vibe-survivor-game.js
Date: 2025-11-06
Thoroughness: VERY THOROUGH

## 1. KEYBOARD INPUT

LINE 34: this.keys = {} 
- Key state object, tracks all pressed keys

LINES 3091-3222: document.addEventListener('keydown')
- Primary keyboard handler
- 131 lines total
- Menu navigation priority (lines 3093-3177)
- Key bindings: WASD, Arrows, Space, Enter, Escape

LINES 3224-3227: document.addEventListener('keyup')
- Clears key states

LINES 4354-4368: this.helpKeydownHandler
- Dynamic handler, created when help opens
- Handles scroll keys for help menu
- Attached: Line 3367, Removed: Line 4421

LINES 12174-12187: this.victoryKeydownHandler
- Dynamic handler for victory screen
- Attached: Line 12187, Removed: Lines 12204/12231

LINES 3952-3963: Player movement (keydown checks)
- Uses this.keys to check WASD/Arrow states

LINE 3983: Dash trigger
- this.keys[' '] || this.touchControls.dashButton.pressed

LINES 4004-4015: Dash direction fallback
- Handles keyboard ghosting

LINES 3229-3238: window.addEventListener('resize')
- Handles canvas resize and dash button positioning

## 2. MOUSE INPUT

NO MOUSE AIMING (uses nearest enemy targeting)

LINES 5527-5542: Dash button mouse handlers
- mousedown: Sets pressed=true, adds CSS class
- mouseup/mouseleave: Sets pressed=false, removes CSS class

## 3. TOUCH INPUT

LINES 181-200: this.touchControls initialization
- joystick: {active, startX, startY, moveX, moveY, floating, visible, centerX, centerY, touchId}
- dashButton: {pressed, position}

LINE 125: this.isMobile = this.detectMobile()

LINES 5165-5169: detectMobile() method
- UserAgent check, ontouchstart check, maxTouchPoints check

LINES 5373-5523: setupVirtualJoystick()
- Helper: getTouchPos() (lines 5384-5390)
- Helper: isTouchNearDashButton() (lines 5392-5402)
- touchstart (lines 5404-5448): Starts floating joystick
- touchmove (lines 5450-5485): Updates movement values (-1 to 1)
- touchend (lines 5504-5512): Resets joystick state
- touchcancel (lines 5514-5522): Same as touchend

LINES 5545-5562: Dash button touch handlers
- touchstart: Sets pressed=true
- touchend/touchcancel: Sets pressed=false

LINES 3966-3968: Joystick movement integration
- Adds joystick values to movement

LINES 4062-4064: Joystick aiming integration
- Uses joystick angle for weapon aiming

LINES 3757-3762, 11935-11940, 12267-12272: Joystick reset points
- When game state changes

## 4. SCROLL HANDLERS

All follow pattern: create object with start/move/end methods

LINE 4248: enablePauseScrolling() / disablePauseScrolling() (line 4272)
LINES 4249-4280: this.pauseScrollHandler

LINES 4516-4556: enableHelpScrolling() / disableHelpScrolling()
LINES 4517-4556: this.helpScrollHandler

LINES 4558-4596: enableLevelUpScrolling() / disableLevelUpScrolling()
LINES 4565-4596: this.levelUpScrollHandler

LINES 4746-4790: enableGameOverScrolling() / disableGameOverScrolling()
LINES 4753-4790: this.gameOverScrollHandler

LINES 4797-4831: enableVictoryScrolling() / disableVictoryScrolling()
LINES 4803-4831: this.victoryScrollHandler

LINES 4839-4873: enableAboutScrolling() / disableAboutScrolling()
LINES 4845-4873: this.aboutScrollHandler

LINES 4881-4915: enableOptionsScrolling() / disableOptionsScrolling()
LINES 4887-4915: this.optionsScrollHandler

## 5. UI BUTTON LISTENERS

LINES 2881-3091: All button event listeners

Desktop only (click): start, restart, exit, pause, resume, mute, exit-to-menu, confirmations, options, about
Mobile-friendly (click+touchstart): help, dash-position, close-options, close-about, options-mute, options-dash, close-help, help-tabs
Special (change/touch): language-select

LINES 5278-5280: Modal touch prevention
- preventTouchDefault for touchstart, touchmove, touchend

## 6. INITIALIZATION

LINES 28-250: Constructor
- Line 34: this.keys
- Line 125: this.isMobile
- Lines 181-200: this.touchControls
- Line 129: this.pauseScrollHandler = null
- Line 130: this.levelUpScrollHandler = null

LINES 2881-3240: Main setup
- All listeners and setupMobileControls() call at line 3241

LINES 5313-5345: setupMobileControls()
- Called: lines 3241, 3693
- Sets up joystick, dash button

LINES 5525-5563: setupDashButton()
- Mouse and touch handlers

LINES 4309-4333: Settings
- loadSettings() (4309-4323)
- saveSettings() (4325-4333)

LINES 4282-4307: toggleDashButtonPosition()
- Toggle left/right, save to localStorage

## 7. MENU NAVIGATION

LINES 243-249: this.menuNavigationState
- active, selectedIndex, menuType, menuButtons, keyboardUsed

LINES 4994-5000: activateMenuNavigation()

LINES 5097-5111: navigateMenu()

LINES 5115-5140: selectCurrentMenuItem()

LINES 5141-5145: resetMenuNavigation()

LINES 5005-5028: updateMenuSelection()

## TOTAL: ~1,087 lines of input-related code
