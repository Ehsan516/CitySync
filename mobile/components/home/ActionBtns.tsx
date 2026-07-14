import React from "react";
import {Pressable, Text, StyleSheet} from "react-native";


export function PrimBtn({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }){
       //primary action button in app
         return (//reduces opacity when pressed

           <Pressable
             onPress={onPress}
             disabled={disabled}
             style={({ pressed }) => [styles.btnPrimary, disabled && styles.btnDisabled, pressed && !disabled && { opacity: 0.85 }]}
           >

             <Text style={styles.btnPrimaryText}>{title}</Text>
           </Pressable>

         );
       }

export function SecBtn({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }){
//secondary button as neutral
  return (

    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btnSecondary, disabled && styles.btnDisabled, pressed && !disabled && { opacity: 0.85 }]}
    >

      <Text style={styles.btnSecondaryText}>{title}</Text>
    </Pressable>

  );
}

export function DangerBtn({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }){
//for stuff like delete
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.btnDanger, disabled && styles.btnDisabled, pressed && !disabled && { opacity: 0.85 }]}
    >

      <Text style={styles.btnDangerText}>{title}</Text>

    </Pressable>
  );
}

const styles = StyleSheet.create({
  btnPrimary: { backgroundColor: "#D70E20", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  btnPrimaryText: { color: "white", fontWeight: "800" },//primary button text

  btnSecondary: { backgroundColor: "#1f1f2a", borderWidth: 1, borderColor: "#2b2b3b", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: "center" }, // secondary button
  btnSecondaryText: { color: "white", fontWeight: "700" }, //secondary button text

  btnDanger: { backgroundColor: "#2a1214", borderWidth: 1, borderColor: "#4b1c21", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, alignItems: "center" }, // destructive button
  btnDangerText: { color: "#ffb4bc", fontWeight: "800" },//delete buttons so it stands out

  btnDisabled: { opacity: 0.5 },
});