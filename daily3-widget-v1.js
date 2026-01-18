// Daily Habit Tracker Widget for Scriptable
// A large-sized iOS widget displaying monthly calendar with habit tracking

// ============================================
// CONFIGURATION & CONSTANTS
// ============================================

const COLORS = {
  background: new Color("#FFFFFF"),
  textPrimary: new Color("#1A1A1A"),
  textSecondary: new Color("#8E8E93"),
  physical: new Color("#34C759"),
  intellectual: new Color("#FFCC00"),
  spiritual: new Color("#AF52DE"),
  highlight: new Color("#E5E5EA"),
  divider: new Color("#C6C6C8")
};

const HABITS = [
  { key: "physical", label: "Physical", color: COLORS.physical },
  { key: "intellectual", label: "Intellectual", color: COLORS.intellectual },
  { key: "spiritual", label: "Spiritual", color: COLORS.spiritual }
];

const DATA_FILE = "habit-tracker-data.json";
const LOCATION_CACHE_FILE = "habit-tracker-location.json";
const LOCATION_CACHE_DURATION = 3600000; // 1 hour in milliseconds

// ============================================
// DATA LAYER
// ============================================

function getDataPath() {
  const fm = FileManager.local();
  const dir = fm.documentsDirectory();
  return fm.joinPath(dir, DATA_FILE);
}

function loadHabitData() {
  const fm = FileManager.local();
  const path = getDataPath();

  if (fm.fileExists(path)) {
    try {
      const data = fm.readString(path);
      return JSON.parse(data);
    } catch (e) {
      console.error("Error loading habit data:", e);
      return {};
    }
  }
  return {};
}

function saveHabitData(data) {
  const fm = FileManager.local();
  const path = getDataPath();

  try {
    fm.writeString(path, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error("Error saving habit data:", e);
    return false;
  }
}

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayHabits(data) {
  const key = getDateKey(new Date());
  return data[key] || { physical: false, intellectual: false, spiritual: false };
}

function setTodayHabits(data, habits) {
  const key = getDateKey(new Date());
  data[key] = habits;
  return data;
}

// ============================================
// LOCATION SERVICE
// ============================================

function getLocationCachePath() {
  const fm = FileManager.local();
  const dir = fm.documentsDirectory();
  return fm.joinPath(dir, LOCATION_CACHE_FILE);
}

async function getCachedLocation() {
  const fm = FileManager.local();
  const path = getLocationCachePath();

  if (fm.fileExists(path)) {
    try {
      const data = JSON.parse(fm.readString(path));
      const age = Date.now() - data.timestamp;
      if (age < LOCATION_CACHE_DURATION) {
        return data.city;
      }
    } catch (e) {
      console.error("Error reading location cache:", e);
    }
  }
  return null;
}

function cacheLocation(city) {
  const fm = FileManager.local();
  const path = getLocationCachePath();

  try {
    const data = { city: city, timestamp: Date.now() };
    fm.writeString(path, JSON.stringify(data));
  } catch (e) {
    console.error("Error caching location:", e);
  }
}

async function getCurrentCity() {
  // Try cached location first
  const cached = await getCachedLocation();
  if (cached) {
    return cached;
  }

  try {
    Location.setAccuracyToThreeKilometers();
    const coords = await Location.current();
    const geo = await Location.reverseGeocode(coords.latitude, coords.longitude);

    if (geo && geo.length > 0) {
      const city = geo[0].locality || geo[0].administrativeArea || "Location";
      cacheLocation(city);
      return city;
    }
  } catch (e) {
    console.error("Error getting location:", e);
  }

  return "Location";
}

// ============================================
// CALENDAR HELPERS
// ============================================

function getMonthName(month) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month];
}

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

// ============================================
// WIDGET UI (DrawContext)
// ============================================

async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(0, 0, 0, 0);

  // Get data
  const habitData = loadHabitData();
  const city = await getCurrentCity();
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  // Dynamic widget dimensions based on device (LARGE widget sizes)
  const screenWidth = Device.screenSize().width;
  let widgetWidth, widgetHeight;

  if (screenWidth >= 428) {
    // iPhone Pro Max / Plus models
    widgetWidth = 364;
    widgetHeight = 382;
  } else if (screenWidth >= 390) {
    // iPhone Pro / standard models
    widgetWidth = 338;
    widgetHeight = 354;
  } else if (screenWidth >= 375) {
    // iPhone mini / SE
    widgetWidth = 329;
    widgetHeight = 345;
  } else {
    // Fallback for smaller devices
    widgetWidth = 292;
    widgetHeight = 311;
  }

  // Create DrawContext with internal padding
  const padding = 12;
  const ctx = new DrawContext();
  ctx.size = new Size(widgetWidth, widgetHeight);
  ctx.opaque = false;
  ctx.respectScreenScale = true;
  ctx.setTextAlignedLeft();

  // Scale factor based on reference height (345px for large widget)
  const scale = widgetHeight / 345;
  const innerWidth = widgetWidth - (padding * 2);
  const innerHeight = widgetHeight - (padding * 2);

  // ---- HEADER ----
  // Month + Year (left)
  ctx.setFont(Font.boldSystemFont(Math.round(24 * scale)));
  ctx.setTextColor(COLORS.textPrimary);
  const monthYear = `${getMonthName(currentMonth)} ${currentYear}`;
  ctx.drawText(monthYear, new Point(padding, padding + 4));

  // City (right)
  ctx.setFont(Font.systemFont(Math.round(16 * scale)));
  ctx.setTextColor(COLORS.textSecondary);
  ctx.setTextAlignedRight();
  ctx.drawTextInRect(city, new Rect(widgetWidth - 140 - padding, padding + 8, 140, 20));
  ctx.setTextAlignedLeft();

  // ---- CALENDAR GRID ----
  const calendarTop = padding + Math.round(36 * scale);
  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];
  const cellWidth = innerWidth / 7;

  // Day labels
  ctx.setFont(Font.systemFont(Math.round(14 * scale)));
  ctx.setTextColor(COLORS.textSecondary);
  for (let i = 0; i < 7; i++) {
    const x = padding + i * cellWidth + (cellWidth / 2) - 5;
    ctx.drawText(dayLabels[i], new Point(x, calendarTop));
  }

  // Calendar dates
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  // Calculate how many weeks this month needs
  const totalCells = firstDay + daysInMonth;
  const weeksNeeded = Math.ceil(totalCells / 7);

  let dayNum = 1;
  let row = 0;

  ctx.setFont(Font.systemFont(Math.round(18 * scale)));
  const highlightSize = Math.round(28 * scale);
  const dotSize = Math.round(5 * scale);
  const dotSpacing = Math.round(6 * scale);

  // Calculate row height dynamically to fit available space
  // Reserve space for: header, day labels, divider, wins section
  const headerSpace = Math.round(36 * scale);
  const dayLabelSpace = Math.round(24 * scale);
  const bottomSectionSpace = Math.round(105 * scale); // divider + wins + indicators + labels + bottom padding
  const availableForCalendar = widgetHeight - padding - headerSpace - dayLabelSpace - bottomSectionSpace - padding;
  const dynamicRowHeight = Math.floor(availableForCalendar / weeksNeeded);

  for (let week = 0; week < weeksNeeded && dayNum <= daysInMonth; week++) {
    const rowY = calendarTop + Math.round(24 * scale) + (week * dynamicRowHeight);

    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      if (week === 0 && dayOfWeek < firstDay) {
        continue;
      }
      if (dayNum > daysInMonth) {
        break;
      }

      const x = padding + dayOfWeek * cellWidth + (cellWidth / 2);
      const y = rowY;

      // Highlight current day
      if (dayNum === currentDay) {
        ctx.setFillColor(COLORS.highlight);
        const circleX = x - highlightSize / 2;
        const circleY = y - 4;
        ctx.fillEllipse(new Rect(circleX, circleY, highlightSize, highlightSize));
      }

      // Draw date number
      ctx.setTextColor(COLORS.textPrimary);
      const dateStr = String(dayNum);
      const textX = x - (dateStr.length > 1 ? 10 : 5);
      ctx.drawText(dateStr, new Point(textX, y));

      // Draw habit dots for this day (centered under date)
      const dateObj = new Date(currentYear, currentMonth, dayNum);
      const dateKey = getDateKey(dateObj);
      const dayHabits = habitData[dateKey];

      if (dayHabits) {
        const dotY = y + Math.round(26 * scale);

        // Collect active habits to center them properly
        const activeHabits = [];
        if (dayHabits.physical) activeHabits.push(COLORS.physical);
        if (dayHabits.intellectual) activeHabits.push(COLORS.intellectual);
        if (dayHabits.spiritual) activeHabits.push(COLORS.spiritual);

        if (activeHabits.length > 0) {
          // Calculate total width of dots and center them
          const totalWidth = (activeHabits.length * dotSize) + ((activeHabits.length - 1) * dotSpacing);
          let dotX = x - (totalWidth / 2);

          for (const color of activeHabits) {
            ctx.setFillColor(color);
            ctx.fillEllipse(new Rect(dotX, dotY, dotSize, dotSize));
            dotX += dotSize + dotSpacing;
          }
        }
      }

      dayNum++;
    }
    row++;
  }

  // Calculate where calendar ends
  const calendarEndY = calendarTop + Math.round(24 * scale) + (weeksNeeded * dynamicRowHeight);

  // ---- DIVIDER LINE ----
  const dividerY = calendarEndY + Math.round(8 * scale);
  ctx.setFillColor(COLORS.divider);
  ctx.fillRect(new Rect(padding, dividerY, innerWidth, 1));

  // ---- TODAY'S WINS SECTION ----
  const winsY = dividerY + Math.round(12 * scale);

  // Label
  ctx.setFont(Font.boldSystemFont(Math.round(18 * scale)));
  ctx.setTextColor(COLORS.textPrimary);
  ctx.drawText("Today's Wins", new Point(padding, winsY));

  // Status indicators: filled circle with checkmark (active) or outlined circle (inactive)
  const todayHabits = getTodayHabits(habitData);
  const indicatorY = winsY + Math.round(28 * scale);
  const circleSize = Math.round(32 * scale);
  const indicatorSpacing = Math.round(70 * scale);
  const strokeWidth = Math.round(2 * scale);

  // Calculate total width to center the indicators
  const totalWidth = (HABITS.length * circleSize) + ((HABITS.length - 1) * indicatorSpacing);
  let indicatorX = (widgetWidth - totalWidth) / 2;

  for (const habit of HABITS) {
    const isActive = todayHabits[habit.key];
    const centerX = indicatorX + (circleSize / 2);

    if (isActive) {
      // Filled circle with checkmark
      ctx.setFillColor(habit.color);
      ctx.fillEllipse(new Rect(indicatorX, indicatorY, circleSize, circleSize));

      // White checkmark
      ctx.setFont(Font.boldSystemFont(Math.round(18 * scale)));
      ctx.setTextColor(new Color("#FFFFFF"));
      ctx.drawText("✓", new Point(indicatorX + Math.round(8 * scale), indicatorY + Math.round(6 * scale)));
    } else {
      // Outlined circle (draw filled then white center to create outline effect)
      ctx.setFillColor(habit.color);
      ctx.fillEllipse(new Rect(indicatorX, indicatorY, circleSize, circleSize));
      ctx.setFillColor(COLORS.background);
      ctx.fillEllipse(new Rect(
        indicatorX + strokeWidth,
        indicatorY + strokeWidth,
        circleSize - (strokeWidth * 2),
        circleSize - (strokeWidth * 2)
      ));
    }

    // Label below indicator (centered)
    ctx.setFont(Font.systemFont(Math.round(12 * scale)));
    ctx.setTextColor(COLORS.textPrimary);
    const estimatedCharWidth = Math.round(5.5 * scale);
    const labelWidth = habit.label.length * estimatedCharWidth;
    const labelX = centerX - (labelWidth / 2);
    ctx.drawText(habit.label, new Point(labelX, indicatorY + circleSize + Math.round(6 * scale)));

    indicatorX += circleSize + indicatorSpacing;
  }

  // Add image to widget
  const image = ctx.getImage();
  const imageStack = widget.addStack();
  imageStack.layoutHorizontally();
  imageStack.addSpacer();
  const widgetImage = imageStack.addImage(image);
  widgetImage.centerAlignImage();
  imageStack.addSpacer();

  // Set widget URL to run script when tapped
  widget.url = URLScheme.forRunningScript();

  return widget;
}

// ============================================
// TOGGLE INTERACTION (In-App)
// ============================================

async function showToggleMenu() {
  const habitData = loadHabitData();
  const todayHabits = getTodayHabits(habitData);

  const alert = new Alert();
  alert.title = "Today's Habits";
  alert.message = "Toggle your completed habits for today";

  for (const habit of HABITS) {
    const status = todayHabits[habit.key] ? "✓" : "○";
    alert.addAction(`${status} ${habit.label}`);
  }

  alert.addCancelAction("Done");

  const response = await alert.presentAlert();

  if (response !== -1) {
    // Toggle the selected habit
    const habitKey = HABITS[response].key;
    todayHabits[habitKey] = !todayHabits[habitKey];

    // Save and recurse to show updated menu
    const updatedData = setTodayHabits(habitData, todayHabits);
    saveHabitData(updatedData);

    // Show menu again to allow multiple toggles
    await showToggleMenu();
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  if (config.runsInWidget) {
    // Running as widget - just set the widget
    const widget = await createWidget();
    Script.setWidget(widget);
  } else if (config.runsInApp) {
    // Running in Scriptable app (tapped from widget)
    // Show toggle menu
    await showToggleMenu();

    // Update widget data so it refreshes on next timeline
    const widget = await createWidget();
    Script.setWidget(widget);

    // Return to home screen using Shortcuts
    // Requires a Shortcut named "GoHome" with "Go to Home Screen" action
    const goHomeURL = "shortcuts://run-shortcut?name=GoHome";
    Safari.open(goHomeURL);
  } else {
    // Preview mode (running from Scriptable editor)
    const widget = await createWidget();
    await widget.presentLarge();
  }

  Script.complete();
}

await main();
