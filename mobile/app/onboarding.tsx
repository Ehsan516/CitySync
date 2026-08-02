import React, {useMemo, useState} from "react";
import {View, Text, Pressable, StyleSheet, Linking, Alert, SafeAreaView} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router} from "expo-router";
import {PrimBtn, SecBtn} from "@/components/home/ActionBtns"
import {getUserId} from "@/lib/api";
import { FontFamily, Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

// const storageKey = "citysync_has_onboarded";

async function markOnboarded(){//for each user onboarding separate
    const uid = await getUserId();
    await AsyncStorage.setItem(`citysync.hasOnboarded.${uid}`, "true");
}

type Step = 0 | 1 | 2 | 3;
const TOTAL_STEPS = 4;

/*Onboarding screen when user logs in
with multiple steps so they can navigate if they;re using the app for the first time*/

function StepDots({ step, colors }: { step: Step; colors: ColorTokens }) {
    const styles = useMemo(() => makeStyles(colors), [colors]);
    return (
        <View style={styles.dots}>
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
            ))}
        </View>
    );
}

export default function OnBoardingScreen() {
    const { colors } = useTheme();
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const [step, setStep] = useState<Step>(0);

    async function finOnboard(){
        await markOnboarded();
        router.replace("/(tabs)");
    }

    function nextStep(){
        if(step < 3){
            setStep((prev) => (prev +1) as Step);
        }

    }

    function renderStep() {
        switch(step){
        case 0:
            return(
                <>
                    <Text style={styles.title}> Welcome to CitySync</Text>
                    <Text style ={styles.body}>
                        Manage uni life in one place!
                    </Text>
                    <Text style = {styles.bullet}> •  View your timetable and travel info</Text>
                    <Text style = {styles.bullet}> •  Track coursework deadlines</Text>
                    <Text style = {styles.bullet}> •  Get reminders before deadlines</Text>
                    <View style={styles.btnGap}>
                        <PrimBtn title = "Get started" onPress={nextStep}/>
                    </View>
                </>
            );

        case 1:
            return(
                <>
                    <Text style={styles.title}> Connect your timetable</Text>
                    <Text style ={styles.body}>
                        CitySync reads timetable events from the calendars on your phone. To get started, subscribe to your City&apos;s timetable ICS feed
                    </Text>
                    <Text style = {styles.bullet}>1. Tap the link below to open the myTimetable setup page</Text>
                    <Text style = {styles.bullet}> Follow the instructions to subscribe to your timetable in your phone&apos;s calendar </Text>
                    <Text style = {styles.bullet}> Come back and select it in CitySync </Text>
                    <Text style = {styles.bullet}> •  Subscribe to your city timetable in your phone calendar</Text>
                    <Text style = {styles.bullet}> Then choose that calendar in CitySync</Text>

                    <Pressable style ={({ pressed }) => [styles.linkBtn, pressed && { opacity: 0.7 }]} onPress={() =>
                        Linking.openURL("https://mytimetable.city.ac.uk/help").catch(() =>
                            Alert.alert("Couldn't open link","Visit https://mytimetable.city.ac.uk/help on your browser."))
                    }>

                    <Text style = {styles.linkText}> Open my timetable help </Text>
                    </Pressable>

                    <View style={styles.btnGap}>

                    <PrimBtn title = "Select my uni calendar" onPress={() => router.push("/(tabs)/calendarSettings")}/>
                    <SecBtn title = "I'll do this later" onPress={nextStep}/>
                    </View>
                </>
            );
        case 2:
            return(
                <>
                    <Text style={styles.title}> Track your coursework</Text>
                    <Text style ={styles.body}>
                        Add modules and deadlines for coursework/exams so CitySync can help you stay organised
                    </Text>
                    <Text style = {styles.bullet}> •  Add modules</Text>
                    <Text style = {styles.bullet}> •  Add coursework deadlines</Text>
                    <Text style = {styles.bullet}> •  View grade predictions</Text>
                    <View style={styles.btnGap}>
                        <PrimBtn title = "Continue" onPress={nextStep}/>
                    </View>
                </>
            );
        case 3:
            return(
                <>
                    <Text style={styles.title}> You&apos;re ready </Text>
                    <Text style ={styles.body}>
                        Your time cand coursework can be managed in one place
                    </Text>
                    <View style={styles.btnGap}>
                        <PrimBtn title = "Go to app" onPress={finOnboard}/>
                    </View>
                </>
            );

        default:
            return null;
        }

    }
    return (
        <SafeAreaView style={styles.safe}>
            <View style={styles.container}>{renderStep()}</View>
            <StepDots step={step} colors={colors} />
        </SafeAreaView>
    );

}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: colors.background,
    },
    container:{
        flex:1, padding: Spacing.xl, justifyContent: "center",
    },
    title:{
        ...Type.title1, marginBottom: Spacing.md, color: colors.text,
    },
    body: {
        fontSize: 16,
        lineHeight: 22,
        marginBottom: Spacing.md,
        color: colors.textSecondary,
    },
    bullet: {
        fontSize: 14, marginBottom: 8, color: colors.textSecondary, lineHeight: 20,
    },

    linkBtn:{
    marginTop: 8,marginBottom: 4,
    paddingVertical: 12,paddingHorizontal: 16,
    backgroundColor: colors.accentMuted,
    borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: "center",
    },

    linkText:{
    color: colors.accent, fontWeight:"700", fontFamily: FontFamily.bold,
    fontSize:14,},

    btnGap:{marginTop: 16, gap: 10,},

    dots: {
        flexDirection: "row",
        justifyContent: "center",
        gap: 8,
        paddingBottom: Spacing.xl,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.fill,
    },
    dotActive: {
        backgroundColor: colors.primary,
        width: 18,
    },

  });
}
