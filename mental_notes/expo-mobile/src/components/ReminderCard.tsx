import { useEffect, useState } from "react";
import { Platform, Pressable, Switch, Text, View } from "react-native";
import {
  DEFAULT_REMINDER,
  ReminderSettings,
  applyReminder,
  formatTime,
  loadReminder,
  sendTestReminder,
} from "../lib/reminder";
import { colors, common } from "../theme/styles";

const TIMES = [
  { hour: 7, minute: 0 },
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 22, minute: 0 },
];

export default function ReminderCard() {
  const [settings, setSettings] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadReminder().then(setSettings);
  }, []);

  async function update(next: ReminderSettings) {
    setMessage("");
    const result = await applyReminder(next);
    if (result === "denied") {
      setSettings({ ...next, enabled: false });
      setMessage(
        Platform.OS === "web"
          ? "Reminders are only available in the phone app."
          : "Notifications are turned off for PranatiX. Allow them in your phone settings to get reminders.",
      );
      return;
    }
    setSettings(next);
  }

  async function test() {
    setMessage("");
    const ok = await sendTestReminder();
    setMessage(
      ok
        ? "A test reminder will arrive in about 5 seconds."
        : "Could not send a test. Check that notifications are allowed.",
    );
  }

  return (
    <View style={common.card}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{ color: colors.brandDark, fontSize: 21, fontWeight: "700" }}
        >
          Daily reminder
        </Text>
        <Switch
          value={settings.enabled}
          onValueChange={(enabled) => void update({ ...settings, enabled })}
          trackColor={{ true: colors.brand, false: colors.line }}
        />
      </View>
      <Text style={[common.subtitle, { fontSize: 15 }]}>
        A gentle nudge to check in with yourself each day.
      </Text>

      {settings.enabled && (
        <>
          <Text style={[common.label, { marginTop: 16 }]}>Remind me at</Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 8,
            }}
          >
            {TIMES.map((t) => {
              const active =
                t.hour === settings.hour && t.minute === settings.minute;
              return (
                <Pressable
                  key={t.hour}
                  onPress={() => void update({ ...settings, ...t })}
                  style={{
                    borderWidth: 1,
                    borderColor: active ? colors.brand : colors.line,
                    backgroundColor: active ? colors.brandSoft : colors.paper,
                    borderRadius: 999,
                    paddingVertical: 8,
                    paddingHorizontal: 14,
                  }}
                >
                  <Text
                    style={{ color: active ? colors.brandDark : colors.ink }}
                  >
                    {formatTime(t.hour, t.minute)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={() => void test()} style={{ marginTop: 16 }}>
            <Text style={common.link}>Send a test reminder</Text>
          </Pressable>
        </>
      )}

      {!!message && (
        <Text style={{ color: colors.muted, marginTop: 12 }}>{message}</Text>
      )}
    </View>
  );
}
