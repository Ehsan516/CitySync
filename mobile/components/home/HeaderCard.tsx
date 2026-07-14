import React from "react";
import { View, Text, StyleSheet} from "react-native";
import { SecBtn } from "./ActionBtns";

type Props ={
    userId: number | null;
    status: string;
    stats: {modules: number; coursework: number; pending: number;};
    onRefresh: () => void;
    onLogout: () => void;
}


function Pill({ label }: { label: string }){
//using pill for stats for modules, cw, and pending
  return (

    <View style={styles.pill}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );

}

export default function HeaderCard({ userId, status, stats, onRefresh, onLogout}: Props){
    return(
        <View style={styles.header}>
            <Text style={styles.title}>CitySync</Text>
            <Text style={styles.subTitle}>User {userId ?? "?"} • {status}</Text>
            <View style={styles.pillRow}>
              <Pill label={`Modules: ${stats.modules}`} />
              <Pill label={`Coursework: ${stats.coursework}`} />
              <Pill label={`Pending: ${stats.pending}`} />
            </View>

            <View style={styles.headerBtns}>
              <SecBtn title="Refresh" onPress={onRefresh} />
              <SecBtn title ="Logout" onPress = {onLogout} />
            </View>
        </View>
 );
}

const styles = StyleSheet.create({

  safe: { flex: 1, backgroundColor: "#0b0b0f" },container: { padding: 16, paddingBottom: 40, gap: 14 },//page padding/spacing
                   //^app bg
  header: { padding: 16, borderRadius: 18, backgroundColor: "#14141a", borderWidth: 1, borderColor: "#232331" },
  title: { fontSize: 28, fontWeight: "800", color: "white" },//title text
  subTitle: { marginTop: 6, color: "#a9a9b6" }, //subtitle text

  pillRow: { marginTop: 12, flexDirection: "row", gap: 10, flexWrap: "wrap" },
  pill: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: "#1f1f2a", borderWidth: 1, borderColor: "#2b2b3b" },//container
  pillText: { color: "#d6d6df", fontWeight: "600" },//pill label

  headerBtns: { marginTop: 12, flexDirection: "row", gap: 10 },
  //^header button row
  });