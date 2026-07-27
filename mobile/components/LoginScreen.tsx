import React, { useMemo, useState } from "react";
import { ActivityIndicator,Alert,KeyboardAvoidingView,Platform,Pressable,SafeAreaView,
  StyleSheet,Text,TextInput,View,} from "react-native";
import {authApi, ApiError} from "@/lib/api";
import Card from "@/components/ui/Card";
import { GlassLayer } from "@/components/home/ActionBtns";
import { Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";


type Props = {
  onLogin: (userId: number) => void;};//store logged in user

/**two step email login screen
 *1 enter email, backend verification code sent
 *2 enter 6 digit code, tap verify to POST /auth/verify-code to returns userId */
export default function LoginScreen({ onLogin }: Props) {
  const { colors, glass, radius } = useTheme();
  const s = useMemo(() => makeStyles(colors, radius), [colors, radius]);

  //where user is on email input or code verif
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);//disables input/buttons
  const [sentTo, setSentTo] = useState("");//stores email the code sent so second req uses same adress

  async function handleRequestCode() {
    //normalise email before to backend
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {

      await authApi.requestCode(trimmed);

      //move to verif after backend accepts email
      setSentTo(trimmed);
      setStep("code");
    } catch (e: any) {
      if (e instanceof ApiError) {
        const parsed = (() => { try { return JSON.parse(e.bodyText); } catch { return null; } })();
        Alert.alert("Error", parsed?.error ?? "Failed to send code.");
      } else {
        Alert.alert("Network error", String(e?.message ?? e));
      }
    } finally {setLoading(false);}
  }

  async function handleVerifyCode() {

  //validation before making verif req
    const trimmedCode = code.trim();
    const trimmedEmail = sentTo.trim().toLowerCase();
    if (trimmedCode.length !== 6) { Alert.alert("invalid code", "please enter the 6 digit code from your email");
      return;
    }

    if(!trimmedEmail.includes("@") || !trimmedEmail.includes(".")){
        Alert.alert("Invalid email","Please enter a valid email");
        return;
    }

    setLoading(true);
    try {
      const json = await authApi.verifyCode(trimmedEmail, trimmedCode);

      //successful verf returns userId to pass into auth state
      onLogin(Number(json.userId));
    } catch (e: any) {
      if (e instanceof ApiError) {
        Alert.alert("error", "Can't sent verification cocde, check your entered email and try again");
      } else {
        Alert.alert("Network error", "Can't connect to the backend, run it and try again");
      }
    } finally {setLoading(false);}
  }

  return (
    <SafeAreaView style={s.safe}>
    {/*stops keyboard covering input on app*/}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.container}>

          {/*logo/ heading */}
          <View style={s.hero}>
            <Text style={s.appName}>CitySync</Text>
            <Text style={s.tagline}>University lifestyle planner</Text>
          </View>

          {step === "email" ? (

            <Card style={s.card}>

              <Text style={s.cardTitle}>Sign in</Text>

              <Text style={s.hint}>
                Enter your email and you&apos;ll get a 6 digit code
              </Text>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="your email"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
              />

              <Pressable

                style={({ pressed }) => [
                  s.btn,
                  glass && { backgroundColor: "transparent", borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassStroke },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleRequestCode}

                disabled={loading}
              >
                {glass ? <GlassLayer colors={colors} tint={colors.primaryGlassBg} /> : null}
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={s.btnText}>Send Code</Text>
                )}
              </Pressable>
            </Card>
          ) : (
            <Card style={s.card}>
              <Text style={s.cardTitle}>check your email</Text>
              <Text style={s.hint}>
                I sent a 6-digit code to{"\n"}
                <Text style={s.emailHighlight}>{sentTo}</Text>
              </Text>
              <Text style={s.label}>Verification code</Text>
              <TextInput
                style={[s.input, s.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <Pressable
                style={({ pressed }) => [
                  s.btn,
                  glass && { backgroundColor: "transparent", borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.glassStroke },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
                {glass ? <GlassLayer colors={colors} tint={colors.primaryGlassBg} /> : null}
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={s.btnText}>Verify and sign in</Text>
                )}
              </Pressable>

              {/*go back to re-enter email again*/}
              <Pressable onPress={() => { setStep("email"); setCode(""); }} style={s.back}>
                <Text style={s.backText}> Use different email</Text>
              </Pressable>
            </Card>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

    function makeStyles(colors: ColorTokens, radius: typeof Radius) {
      return StyleSheet.create({

        safe:{ flex: 1, backgroundColor: colors.background },
        flex:{ flex: 1 },

        //login card centers vertically
        container: {flex: 1, justifyContent: "center", padding: Spacing.xl, gap: Spacing.xxl,},
        hero: { alignItems: "center", gap: 6 },
        appName: {fontSize: 36, fontWeight: "800", color: colors.text,letterSpacing: -0.5,},
        tagline: { color: colors.textMuted, fontSize: 14 },

        card: {gap: 12,},
        cardTitle: { color: colors.text, ...Type.title3 },
        hint:  { color: colors.textSecondary, fontSize: 13, lineHeight: 20 },
        label: { color: colors.textMuted, fontWeight: "600", fontSize: 13 },

        input: {
          backgroundColor: colors.card2,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          borderRadius: radius.sm,
          padding: 14,
          color: colors.text,
          fontSize: 16,
        },
        codeInput: {
          fontSize: 28,
          fontWeight: "800",
          letterSpacing: 10,
          textAlign: "center",
        },
        emailHighlight: { color: colors.text, fontWeight: "700" },

        btn: {
          backgroundColor: colors.primary,
          borderRadius: radius.md,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 4,
          overflow: "hidden",
        },
        btnText: { color: "white", fontWeight: "800", fontSize: 16 },

        back: { alignItems: "center", paddingVertical: 8 },
        backText: { color: colors.textMuted, fontSize: 13 },
      });
    }
