import React, { useState } from "react";
import { ActivityIndicator,Alert,KeyboardAvoidingView,Platform,Pressable,SafeAreaView,
  StyleSheet,Text,TextInput,View,} from "react-native";
import {API_BASE, authHeaders, getUserId} from "@/lib/api";


type Props = {
  onLogin: (userId: number) => void;};//store logged in user

/**two step email login screen
 *1 enter email, backend verification code sent
 *2 enter 6 digit code, tap verify to POST /auth/verify-code to returns userId */
export default function LoginScreen({ onLogin }: Props) {
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

      const res = await fetch(`${API_BASE}/auth/request-code`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const json = await res.json();
      if (!res.ok) { Alert.alert("Error", json.error ?? "Failed to send code.");
        return;
      }

      //move to verif after backend accepts email
      setSentTo(trimmed);
      setStep("code");
    } catch (e: any) {Alert.alert("Network error", String(e?.message ?? e));
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
      const res = await fetch(`${API_BASE}/auth/verify-code`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, code: trimmedCode }),

      });
      const json = await res.json();
      if (!res.ok) {Alert.alert("error", "Can't sent verification cocde, check your entered email and try again");
        return;
      }

      //successful verf returns userId to pass into auth state
      onLogin(Number(json.userId));
    } catch (e: any) {Alert.alert("Network error", "Can't connect to the backend, run it and try again");
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

            <View style={s.card}>

              <Text style={s.cardTitle}>Sign in</Text>

              <Text style={s.hint}>
                Enter your email and you'll get a 6 digit code
              </Text>
              <Text style={s.label}>Email address</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                placeholder="youremaillol@city.ac.uk"
                placeholderTextColor="#555"
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
                editable={!loading}
              />

              <Pressable

                style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
                onPress={handleRequestCode}

                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={s.btnText}>Send Code</Text>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={s.card}>
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
                placeholderTextColor="#555"
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <Pressable
                style={({ pressed }) => [s.btn, pressed && { opacity: 0.85 }]}
                onPress={handleVerifyCode}
                disabled={loading}
              >
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
            </View>
          )}

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

    const s = StyleSheet.create({

        safe:{ flex: 1, backgroundColor: "#0b0b0f" },
        flex:{ flex: 1 },

        //login card centers vertically
        container: {flex: 1, justifyContent: "center", padding: 24, gap: 24,},
        hero: { alignItems: "center", gap: 6 },
        appName: {fontSize: 36, fontWeight: "800", color: "white",letterSpacing: -0.5,},
        tagline: { color: "#a9a9b6", fontSize: 14 },

        card: {backgroundColor: "#14141a", borderRadius: 20,borderWidth: 1, borderColor: "#232331",padding: 20,gap: 12,},
        cardTitle: { color: "white", fontSize: 18, fontWeight: "800" },
        hint:  { color: "#a9a9b6", fontSize: 13, lineHeight: 20 },
        label: { color: "#a9a9b6", fontWeight: "600", fontSize: 13 },

        input: {
          backgroundColor: "#0f0f14",
          borderWidth: 1,
          borderColor: "#2a2a3a",
          borderRadius: 12,
          padding: 14,
          color: "white",
          fontSize: 16,
        },
        codeInput: {
          fontSize: 28,
          fontWeight: "800",
          letterSpacing: 10,
          textAlign: "center",
        },
        emailHighlight: { color: "white", fontWeight: "700" },

        btn: {
          backgroundColor: "#D70E20",
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: "center",
          marginTop: 4,
        },
        btnText: { color: "white", fontWeight: "800", fontSize: 16 },

        back: { alignItems: "center", paddingVertical: 8 },
        backText: { color: "#a9a9b6", fontSize: 13 },
      });
