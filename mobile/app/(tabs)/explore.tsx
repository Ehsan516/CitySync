import React, { useEffect, useMemo, useState } from "react";
import {Alert, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,StyleSheet,
  Text, TextInput, View, Switch} from "react-native";
import Animated from "react-native-reanimated";
import { getUserId, preferencesApi, accountApi, delUserId } from "@/lib/api";
import {PrimBtn, DangerBtn} from "@/components/home/ActionBtns";
import ScreenHeader from "@/components/ui/ScreenHeader";
import Card from "@/components/ui/Card";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useTabBarPadding } from "@/hooks/use-tab-bar-padding";
import {useAuth} from "@/hooks/useAuth";
import { Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

function SectionCard({ title, children, colors }: { title: string; children: React.ReactNode; colors: ColorTokens }) {
//card wrpper for each section
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Card style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </Card>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: ColorTokens }) {
//for from fields
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Text style={styles.fieldLabel}>{label}</Text>;
}

function errorMessage(e: any, fallback: string): string {
  //account endpoints return {"error": "..."} bodies, other endpoints return plain text
  try {
    const parsed = e?.bodyText ? JSON.parse(e.bodyText) : null;
    return parsed?.error ?? fallback;
  } catch {
    return e?.bodyText ?? e?.message ?? fallback;
  }
}

export default function SettingsScreen() {
  const { colors, scheme, glass, setScheme, setGlass } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tabBarPadding = useTabBarPadding();

  const [homeAddress, setHomeAddress] = useState("");//what the user can change is home address
  const [uniAddress, setUniAddress] = useState(
    "City St George's, University of London, Northampton Square, London EC1V 0HB"//uni address is fixed
  );
  const [bufferMins, setBufferMins] = useState("10");

  //shows status to user like loading or ok or error
  const [status, setStatus] = useState<{ msg: string; type: "idle" | "ok" | "error" | "loading" }>({
    msg: "",
    type: "idle",
  });

const [deleteCode, setDeleteCode] = useState("");
const [showDeleteCodeInput, setShowDeleteCodeInput] = useState(false);

const {logout} = useAuth();

  useEffect(() => {
    loadPrefs();  //load saved prefs from backend on mount
  }, []);

  async function loadPrefs() {
    setStatus({ msg: "Loading preferences...", type: "loading" });
    try {

      const USER_ID = await getUserId();
      const data = await preferencesApi.get(USER_ID);

      //Ui shows data it got from backend
      if (data.homeAddress) setHomeAddress(data.homeAddress);
      if (data.UniLoc) setUniAddress(data.UniLoc);
      if (data.bufferMins != null) setBufferMins(String(data.bufferMins));

      setStatus({ msg: "Preferences loaded", type: "ok" });

    } catch (e: any) {

      setStatus({ msg: `Load error: ${e?.bodyText ?? e?.message ?? e}`, type: "error" });
        //^only if it cant load the data
    }
  }

  async function savePrefs() {
    const bufferNum = parseInt(bufferMins, 10);//parsing buffer string to num for backend

    if (isNaN(bufferNum) || bufferNum < 0 || bufferNum > 300) {
      Alert.alert("Buffer has to be a number", "Buffer can be between 0 and 300 minutes");
      return;
    }

    if (!homeAddress.trim()) {
      Alert.alert("Home address required", "Enter your home address/postcode to get travel time");
      return;
    }

    setStatus({ msg: "Saving...", type: "loading" });

    try {

      const USER_ID = await getUserId();

      const saved = await preferencesApi.update(USER_ID, {
        homeAddress: homeAddress.trim(),
        UniLoc: uniAddress.trim(),
        bufferMins: bufferNum,
      });

      if (saved.bufferMins != null) setBufferMins(String(saved.bufferMins));
      setStatus({ msg: "Preferences saved ", type: "ok" });
      Alert.alert("Saved", "Your preferences have been updated reload the Calendar tab to recalculate leave times.");
    } catch (e: any) {
      setStatus({ msg: `Save error: ${e?.bodyText ?? e?.message ?? e}`, type: "error" });
      Alert.alert("Save failed", String(e?.bodyText ?? e?.message ?? e));
    }
  }

  function confSavePrefs(){
  //function to show a pop up so users know that their location will be saved
    Alert.alert(
    "Use saved location details?",
    "CitySync will use your saved location for travel time esitmates and generating leave-soon alerts",[
    { text: "Cancel",style: "cancel",},
    {
        text: "Continue",
        onPress: () => { savePrefs().catch((e) => Alert.alert("Save error",String(e?.message ?? e)));
        //gets saved
        },
    },
    ]
    );
  }

    function confirmDeleteStart() {
      // first confirmation before sending the delete code
      Alert.alert(
        "Delete account?",
        "This will remove your CitySync account and associated stored data. Do you want to continue?",
        [{
            text: "No, nevermind",
            style: "cancel",
          },
          {
            text: "Yes I'm sure",
            style: "destructive",
            onPress: () => {
              requestDeleteCode().catch((e) =>
                Alert.alert("Delete code error", errorMessage(e, "Failed to request delete code"))
              );
            },
          },
        ]
      );
    }

    async function requestDeleteCode() {
      //to delete verification code to logged-in user's email
      const USER_ID = await getUserId();

      try {
        await accountApi.requestDeleteCode(USER_ID);
      } catch (e: any) {
        throw new Error(errorMessage(e, "Failed to request delete code"));
      }

      //reveal code input after email is sent successfully
      setShowDeleteCodeInput(true);

      Alert.alert("Code sent", "a delete verification code has been sent to your email");
    }

    function confirmDeleteFinal() {
      // second/final confirmation before actual deletion
      Alert.alert(
        "Final confirmation",
        "This action can't be undone, do you want your account and its stored data erased?",
        [
          {
            text: "No!",
            style: "cancel",
          },
          {
            text: "Yes, delete account",
            style: "destructive",
            onPress: () => {
              deleteAccount().catch((e) =>
                Alert.alert("Delete error", errorMessage(e, "Failed to delete account"))
              );
            },
          },
        ]
      );
    }

    async function deleteAccount() {
      if (!deleteCode.trim()) {
        Alert.alert("Enter code", "Please enter the verification code sent to your email.");    //validates code input first
        return;
      }

      const USER_ID = await getUserId();

      try {
        await accountApi.deleteAccount(USER_ID, deleteCode.trim());
      } catch (e: any) {
        throw new Error(errorMessage(e, "Failed to delete account"));
      }

      //clears local ui state
      setDeleteCode("");
      setShowDeleteCodeInput(false);

      //auth path cleared
      await delUserId();
      logout();//auth state update and then login screen

      Alert.alert("Account deleted", "Your CitySync account has been permanently removed.");

    }

  function adjustBuffer(delta: number) {
    const current = parseInt(bufferMins, 10) || 0;
    const next = Math.max(0, Math.min(300, current + delta));
    setBufferMins(String(next));
  }

  const { scrollY, onScroll } = useScrollHeader();

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Settings" subtitle={status.msg || undefined} scrollY={scrollY} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Animated.ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Spacing.lg + tabBarPadding }]}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >

          {/*Appearance */}
          <SectionCard title="Appearance" colors={colors}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Dark Mode</Text>
                <Text style={styles.hint}>Switch between light and dark appearance.</Text>
              </View>
              <Switch
                value={scheme === "dark"}
                onValueChange={(v) => setScheme(v ? "dark" : "light")}
                trackColor={{ false: colors.fill, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            <View style={[styles.toggleRow, { marginTop: Spacing.md }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Liquid Glass</Text>
                <Text style={styles.hint}>
                  iOS 26-style translucent glass for the tab bar, nav bar and buttons.
                </Text>
              </View>
              <Switch
                value={glass}
                onValueChange={setGlass}
                trackColor={{ false: colors.fill, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>
          </SectionCard>

          {/*Travel settings */}
          <SectionCard title="Travel Settings" colors={colors}>
            <Text style={styles.sub}>
                Citysync uses your saved location details to calculate travel timea and generate leave-soon alerts.
            </Text>
            <FieldLabel label="Home address or postcode" colors={colors} />

            <TextInput

              value={homeAddress}
              onChangeText={setHomeAddress}
              placeholder="e.g. LU4 8AY or 123 Portland road, Luton"
              //^example address for users which is mine
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}

            />
            <Text style={styles.hint}>
              Used to calculate your travel time to City University A postcode also works.
            </Text>

            <FieldLabel label="Destination (pre-filled)" colors={colors} />

            <TextInput

              value={uniAddress}
              onChangeText={setUniAddress}
              placeholderTextColor={colors.textTertiary}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
            />
            <Text style={styles.hint}>
              Change this if your lectures are at different location.
            </Text>
          </SectionCard>

          {/* Buffer settings */}
          <SectionCard title="Leave buffer" colors={colors}>

            <Text style={styles.sub}>
              Extra minutes added on top of travel time before your lecture starts.
            </Text>

            <View style={styles.bufferRow}>
              <Pressable
                onPress={() => adjustBuffer(-5)}
                style={({ pressed }) => [styles.bufferBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.bufferBtnText}>−5</Text>
              </Pressable>

              <View style={styles.bufferDisplay}>
                <Text style={styles.bufferValue}>{bufferMins}</Text>
                <Text style={styles.bufferUnit}>mins</Text>
              </View>

              <Pressable
                onPress={() => adjustBuffer(5)}
                style={({ pressed }) => [styles.bufferBtn, { opacity: pressed ? 0.7 : 1 }]}
              >
                <Text style={styles.bufferBtnText}>+5</Text>
              </Pressable>
            </View>

            <TextInput
              value={bufferMins}
              onChangeText={setBufferMins}
              keyboardType="numeric"
              placeholder="or type a number"
              placeholderTextColor={colors.textTertiary}
              style={[styles.input, { textAlign: "center" }]}
            />
            <Text style={styles.hint}>Max 300 minutes(5 hours), default is 10 mins.</Text>
          </SectionCard>

          {/*talks how leave-soon works */}
          <SectionCard title="How leave soon alerts work" colors={colors}>
            <Text style={styles.sub}>
              {"CitySync calculates your leave time as:\n\n"}
            </Text>

            <Text style={{ color: colors.primary, fontWeight: "700", fontSize: 13 }}>
              {"Lecture start − (travel time + your buffer)"}
            </Text>

            <Text style={styles.sub}>
              {"\nA push notification fires at exactly that time, even if the app is closed. Travel time is fetched live from Google Routes API. If unavailable, CitySync uses a static estimate based on your postcode."}
            </Text>
          </SectionCard>

                    <SectionCard title="Account and data" colors={colors}>
                      <Text style={styles.sub}>
                        Deleting your account will remove your CitySync account and stored data from the backend
                      </Text>

                      <DangerBtn title="Delete account" onPress={confirmDeleteStart} disabled={status.type === "loading"} />

                      {showDeleteCodeInput ? (
                        <>
                          <FieldLabel label="Enter delete verification code" colors={colors} />

                          <TextInput
                            value={deleteCode}
                            onChangeText={setDeleteCode}
                            placeholder="Enter the code sent to your email"
                            placeholderTextColor={colors.textTertiary}
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={styles.input}
                          />

                          <Text style={styles.hint}>
                            Enter the verification code sent to your email then confirm delete.
                          </Text>

                          <DangerBtn title="Confirm delete account" onPress={confirmDeleteFinal} disabled={status.type === "loading"}/>
                        </>
                      ) : null}
                    </SectionCard>

          {/*Save button */}
          <PrimBtn title="Save Preferences" onPress={confSavePrefs} disabled={status.type === "loading"} />

          <View style={{ height: 40 }} />
        </Animated.ScrollView>

      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({

  safe: {flex: 1,backgroundColor: colors.background,},
  scroll: {padding: Spacing.xl,gap: Spacing.lg,},
  card: {gap: 10,},
  cardTitle: { ...Type.headline, color: colors.text, marginBottom: 4,
  },fieldLabel: {fontSize: 13,fontWeight: "600",color: colors.textSecondary,},

  input: {backgroundColor: colors.card2,borderWidth: StyleSheet.hairlineWidth,borderColor: colors.border,borderRadius: Radius.sm,padding: 12,color: colors.text,fontSize: 15,},
  hint: {fontSize: 12,color: colors.textMuted,},
  sub: {fontSize: 13,color: colors.textSecondary,lineHeight: 20,},

  toggleRow: {flexDirection: "row",alignItems: "center",gap: Spacing.md,},
  toggleLabel: {fontSize: 15,fontWeight: "700",color: colors.text,},

  bufferRow: {flexDirection: "row",alignItems: "center",justifyContent: "center",gap: 20,marginVertical: 8,},
  bufferBtn: {backgroundColor: colors.card2,borderWidth: StyleSheet.hairlineWidth,borderColor: colors.border,borderRadius: Radius.sm,width: 56,height: 56,
    alignItems: "center",justifyContent: "center",},
  bufferBtnText: {color: colors.text,fontSize: 20,fontWeight: "700",},

  bufferDisplay: {alignItems: "center",minWidth: 80,},
  bufferValue: {color: colors.primary,fontSize: 40,fontWeight: "800",},
  bufferUnit: {color: colors.textMuted, fontSize: 13,},
  });
}
