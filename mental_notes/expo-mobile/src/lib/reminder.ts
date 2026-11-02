import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const KEY = "pranatix-reminder";
const ID = "daily-reminder";
const CHANNEL = "reminders";

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
};

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

const CONTENT = {
  title: "A quiet moment for you",
  body: "How are you feeling today? Take a minute to check in.",
};

export function formatTime(hour: number, minute: number) {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const m = String(minute).padStart(2, "0");
  return `${h}:${m} ${hour < 12 ? "AM" : "PM"}`;
}

export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? { ...DEFAULT_REMINDER, ...JSON.parse(raw) } : DEFAULT_REMINDER;
  } catch {
    return DEFAULT_REMINDER;
  }
}

// True only if the Android channel was created successfully.
// If channel creation fails, notifications use Android's default channel.
let channelReady = false;

async function ensurePermission() {
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync(CHANNEL, {
        name: "Daily reminder",
        importance: Notifications.AndroidImportance.DEFAULT ?? 3,
      });
      channelReady = true;
    } catch {
      channelReady = false;
    }
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Saves settings and (re)schedules. Returns "denied" if permission is refused. */
export async function applyReminder(
  next: ReminderSettings,
): Promise<"ok" | "denied"> {
  if (Platform.OS === "web") return "denied";

  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});

  if (next.enabled) {
    const allowed = await ensurePermission();
    if (!allowed) {
      await AsyncStorage.setItem(
        KEY,
        JSON.stringify({ ...next, enabled: false }),
      );
      return "denied";
    }
    await Notifications.scheduleNotificationAsync({
      identifier: ID,
      content: CONTENT,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: next.hour,
        minute: next.minute,
        ...(channelReady ? { channelId: CHANNEL } : {}),
      },
    });
  }

  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return "ok";
}

export async function sendTestReminder(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  if (!(await ensurePermission())) return false;
  await Notifications.scheduleNotificationAsync({
    content: CONTENT,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      ...(channelReady ? { channelId: CHANNEL } : {}),
    },
  });
  return true;
}
