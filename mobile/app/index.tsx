import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {getUserId} from "@/lib/api";

// const storageKey = "citysync_has_onboarded";//key to flag is user completes onboarding

export default function Index() {
    useEffect(() => {

        async function decideRoute(){//async function for user's route
          try{
            const uid = await getUserId();
            const hasOnboard = await AsyncStorage.getItem(`citysync.hasOnboarded.${uid}`);

            if(hasOnboard === "true"){
                router.replace("/(tabs)");//if onboarding done already then go to tabs
            } else {
                router.replace("/onboarding");}
          }catch{
            router.replace("/onboarding");
          }
        }

        decideRoute();
        },[]);

    return (
        <View
            style={{
                flex:1,
                backgroundColor: "#0b0b0f",
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            {/*Async check runs so loading indicator shown*/}
            <ActivityIndicator size = "large" color="#D70E20" />
        </View>
    );

}