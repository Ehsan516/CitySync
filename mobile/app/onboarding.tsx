import React, {useState} from "react";
import {View, Text, Pressable, StyleSheet, Linking, Alert} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {router} from "expo-router";
import {PrimBtn, SecBtn} from "@/components/home/ActionBtns"
import {getUserId} from "@/lib/api";

// const storageKey = "citysync_has_onboarded";

async function markOnboarded(){//for each user onboarding separate
    const uid = await getUserId();
    await AsyncStorage.setItem(`citysync.hasOnboarded.${uid}`, "true");
}

type Step = 0 | 1 | 2 | 3;

/*Onboarding screen when user logs in
with multiple steps so they can navigate if they;re using the app for the first time*/


export default function OnBoardingScreen() {
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
                    <Text style = {styles.bullet}> •View your timetable and travel info</Text>
                    <Text style = {styles.bullet}> •Track coursework deadlines</Text>
                    <Text style = {styles.bullet}> •Get reminders before deadlines</Text>
                    <PrimBtn title = "Get started" onPress={nextStep}/>
                </>
            );

        case 1:
            return(
                <>
                    <Text style={styles.title}> Connect your timetable</Text>
                    <Text style ={styles.body}>
                        CitySync reads timetable events from the calendars on your phone. To get started, subscribe to your City's timetable ICS feed
                    </Text>
                    <Text style = {styles.bullet}>1. Tap the link below to open the myTimetable setup page</Text>
                    <Text style = {styles.bullet}> Follow the instructions to subscribe to your timetable in your phone's calendar </Text>
                    <Text style = {styles.bullet}> Come back and select it in CitySync </Text>
                    <Text style = {styles.bullet}> •Subscribe to your city timetable in your phone calendar</Text>
                    <Text style = {styles.bullet}> Then choose that calendar in CitySync</Text>

                    <Pressable style ={styles.linkBtn} onPress={() =>
                        Linking.openURL("https://mytimetable.city.ac.uk/help").catch(() =>
                            Alert.alert("Couldn't open link","Visit https://mytimetable.city.ac.uk/help on your browser."))
                    }>

                    <Text style = {styles.linkText}> Open my timetable help </Text>
                    </Pressable>

                    <View styles={styles.btnGap}>

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
                    <Text style = {styles.bullet}> •Add modules</Text>
                    <Text style = {styles.bullet}> •Add coursework deadlines</Text>
                    <Text style = {styles.bullet}> •View grade predictions</Text>
                    <PrimBtn title = "Continue" onPress={nextStep}/>
                </>
            );
        case 3:
            return(
                <>
                    <Text style={styles.title}> You're ready </Text>
                    <Text style ={styles.body}>
                        Your time cand coursework can be managed in one place
                    </Text>
                    <PrimBtn title = "Go to app" onPress={finOnboard}/>
                </>
            );

        default:
            return null;
        }

    }
    return (
        <View style={styles.container}>{renderStep()}</View>
    );

}

const styles = StyleSheet.create({
    container:{
        flex:1, padding: 24, justifyContent: "center",
    },
    title:{
        fontSize: 24, fontWeight: "bold", marginBottom: 16, color: "white",
    },
    body: {
        fontSize: 16,
        marginBottom: 16,
        color: "white",
    },
    bullet: {
        fontSize: 14, marginBottom: 8,color: "white",
    },

    linkBtn:{
    marginTop: 8,marginBottom: 4,
    paddingVertical: 12,paddingHorizontal: 16,
    backgroundColor:"#1e1e30",
    borderRadius: 10, borderWidth: 1, borderColor: "#1e1e30",
    alignItems: "center",
    },

    linkText:{
    color:"#3b4adb", fontWeight:"700",
    fontSize:14,},

    btnGap:{marginTop: 16, gap: 10,},

});