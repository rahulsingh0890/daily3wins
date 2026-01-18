# Daily3Wins

A beautiful iOS widget for tracking your daily wins across three key areas of life: **Physical**, **Intellectual**, and **Spiritual**.

![Daily3Wins Preview](Preview%20Images/preview-2.png)

## Inspiration

The Daily3Wins widget is inspired by the concept of achieving balance in life by focusing on three fundamental pillars each day:

- **Physical** - Exercise, movement, health-related activities
- **Intellectual** - Learning, reading, problem-solving, creative work
- **Spiritual** - Meditation, gratitude, mindfulness, reflection

By tracking just three simple wins each day, you build momentum and create lasting habits without feeling overwhelmed. The widget sits on your home screen as a daily reminder and visual tracker of your progress throughout the month.

## Features

- Clean, minimal calendar view showing the current month
- Colored dots under each date indicating completed habits
- Location display (auto-detected)
- Beautiful status indicators for today's wins
- Tap to toggle habits through a simple menu
- Auto-return to home screen after toggling

![Widget Preview](Preview%20Images/preview-1.png)

## Requirements

- iPhone with iOS 14 or later
- [Scriptable app](https://apps.apple.com/app/scriptable/id1405459188) (free)
- Shortcuts app (built into iOS)

## Installation

### Step 1: Install Scriptable

Download and install [Scriptable](https://apps.apple.com/app/scriptable/id1405459188) from the App Store.

### Step 2: Add the Script

1. Open Scriptable
2. Tap the **+** button to create a new script
3. Copy the entire contents of `daily3-widget-v1.js` from this repository
4. Paste it into the new script
5. Tap the script name at the top and rename it to **Daily3Wins** (or any name you prefer)
6. Tap **Done** to save

### Step 3: Create the GoHome Shortcut

This shortcut automatically returns you to the home screen after toggling habits.

1. Open the **Shortcuts** app
2. Tap **+** to create a new shortcut
3. Search for and add the action: **"Go to Home Screen"**
4. Tap the shortcut name at the top and rename it to exactly: **GoHome**
5. Tap **Done** to save

> **Important:** The shortcut must be named exactly `GoHome` for the widget to work correctly.

### Step 4: Add the Widget to Your Home Screen

1. Long-press on your home screen until apps start jiggling
2. Tap the **+** button in the top-left corner
3. Search for **Scriptable**
4. Select the **Large** widget size
5. Tap **Add Widget**
6. Tap the widget to configure it
7. Under "Script", select **Daily3Wins** (or whatever you named it)
8. Tap outside to save

## Usage

### Toggling Habits

1. **Tap anywhere on the widget** to open the habit toggle menu
2. Tap a habit to toggle it on/off (checkmark = completed)
3. Tap **Done** when finished
4. You'll automatically return to your home screen

### Understanding the Display

- **Colored dots** under dates show which habits were completed that day:
  - Green = Physical
  - Yellow = Intellectual
  - Purple = Spiritual
- **Filled circles with checkmarks** = habit completed today
- **Outlined circles** = habit not yet completed today

## Customization

### Changing Habit Names

Edit the `HABITS` array near the top of the script:

```javascript
const HABITS = [
  { key: "physical", label: "Physical", color: COLORS.physical },
  { key: "intellectual", label: "Intellectual", color: COLORS.intellectual },
  { key: "spiritual", label: "Spiritual", color: COLORS.spiritual }
];
```

### Changing Colors

Edit the `COLORS` object at the top of the script:

```javascript
const COLORS = {
  background: new Color("#FFFFFF"),
  textPrimary: new Color("#1A1A1A"),
  textSecondary: new Color("#8E8E93"),
  physical: new Color("#34C759"),      // Green
  intellectual: new Color("#FFCC00"),  // Yellow
  spiritual: new Color("#AF52DE"),     // Purple
  // ...
};
```

## Data Storage

Your habit data is stored locally on your device in Scriptable's documents directory. The data persists across app restarts and widget refreshes.

## Troubleshooting

### Widget shows old data
iOS widgets refresh on their own schedule. Tap the widget to open the app, which forces a refresh.

### GoHome shortcut not working
Make sure the shortcut is named exactly `GoHome` (case-sensitive).

### Location not showing
The widget needs location permissions. Go to Settings > Privacy > Location Services > Scriptable and allow location access.

## License

MIT License - feel free to modify and share!

## Credits

Built with [Scriptable](https://scriptable.app/) for iOS.
