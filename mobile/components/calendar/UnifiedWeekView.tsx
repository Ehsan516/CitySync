import React from "react";
import {View, Text, SectionList,StyleSheet, Pressable, SafeAreaView} from "react-native";
import {PrimBtn, SecBtn} from "@/components/home/ActionBtns"

type UnifiedItem = {
//calendar or coursework items on cal view
  key: string;
  source: "timetable" | "coursework";
  title: string;
  start: Date;
  end: Date;
  location?: string;
  meta?: string;
  onSite?: boolean;
};

type SectionType ={
    title: string; data: UnifiedItem[];
};

type Props = {
    weekStartLabel: string; weekEndLabel: string;
    status: string;
    sections: SectionType[];
    onCurrentWeek: ()=> void;
    onNextWeek: () => void;
    onReload: () => void;
    onOpenRouteDetails: (item: UnifiedItem) => void;
};

function fmtSectionDate(ymd:string) : string {
//function to add weekday on the unified calendar
    const [y,m,d] = ymd.split("-").map(Number);//input string to year month day and then num

    const date = new Date(y, m-1, d);

    const weekDay = date.toLocaleDateString("en-GB", {weekday: "long"});//getting weekday name

    return `${weekDay} • ${ymd}`;
}

export default function UnifiedWeekView({
    weekStartLabel,weekEndLabel,
    status,sections,
    onCurrentWeek, onNextWeek,
    onReload, onOpenRouteDetails,
}: Props) {

return(
    <View style={styles.safe}>
    {/*week info and buttons*/}
      <View style={styles.container}>
        <View style={styles.hcard }>
        <Text style={styles.htitle}>Unified Week: </Text>
        <Text style = {styles.hsub}>Week: {weekStartLabel} to {weekEndLabel}</Text>
        <Text style={styles.hstatus}>Status: {status}</Text>

        {/*week navigation btns*/}
        <View style = {styles.weekBtnRow}>
            <View style = {{flex:1}}>
                <SecBtn title="This week" onPress={onCurrentWeek}/>
            </View>
            <View style = {{flex:1}}>
                <SecBtn title="Next week" onPress={onNextWeek}/>
            </View>
        </View>
      <View style = {{marginTop: 8}}>
        <PrimBtn title="Reload unified week" onPress={onReload} />
      </View>
      </View>

      <SectionList<UnifiedItem, SectionType>
        sections={sections}
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 120}}
        keyExtractor={(item) => item.key}
        renderSectionHeader={({ section }) => (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#14141a" }}>
            <Text style={{ fontWeight: "700", color: "white" }}>{fmtSectionDate(section.title)}</Text>
          </View>
        )}
        renderItem={({ item }) => {

          const past = item.end.getTime() < Date.now();
          //^dims events that have already finished

          return (

            // <View style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 }}>
            <View
              style={{paddingHorizontal: 16,paddingVertical: 10,borderBottomWidth: 1,backgroundColor: past ? "#101015" : "#0b0b0f",
                borderBottomColor: "#262638",opacity: past ? 0.45 : 1,
              }}
            >

              <Text style={{ fontWeight: "600", color: past ? "#7f7f8f" : "white" }}>
                [{item.source === "timetable" ? "Lecture" : "Coursework"}] {item.title}
              </Text>

              <Text style={{ color: past ? "#7f7f8f" : "#d6d6df" }}>
                {item.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} to{" "}
                {item.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </Text>


              {item.location ? (
                <Text style={{ color: past ? "#6d6d7c" : "#a9a9b6" }}>
                  Location: {item.location}
                </Text>
              ) : null}

              {item.meta ? (
                <>
                  {item.meta.split(" • ").map((part, i) => (
                    <Text
                      key={i}
                      style={{fontSize: 12,color: past
                          ? "#6d6d7c" : part.startsWith("Leave at") ? "#22C55E" : "#a9a9b6",
                        marginTop: i === 0 ? 4 : 1,
                      }}
                    >
                      {part}
                    </Text>
                  ))}
                </>
              ) : null}

              {/*}only shows button for future timetable evnts*/}
              {(item.source === "timetable" || (item.source === "coursework" && item.onSite)) && !past ?(
                <Pressable
                    onPress={() => onOpenRouteDetails(item)}
                    style={{marginTop: 8 }}
                >
                 <Text style={{ color:"#9bc2f2", fontSize: 13}}>
                    Show route details
                 </Text>
                </Pressable>
              ):null}
            </View>

          );
        }}
        ListEmptyComponent={<Text style={{ padding: 16, color: "#d6d6df" }}>No items this week</Text>}
      />
      </View>
    </View>
);}

const styles = StyleSheet.create({

container:{flex:1, padding:16, gap: 14,},

hcard:{
    padding:16,borderRadius: 18, backgroundColor:"#14141a",
    borderWidth:1,borderColor: "#232331",gap:10,
},

htitle:{
    fontSize: 20, fontWeight: "800", color: "white",
},

hsub:{ fontSize:14, color: "#d6d6df",},

hstatus:{
    fontSize:14,color:"#d6d6df",
},

weekBtnRow:{flexDirection:"row", gap: 10, marginTop: 6,},

sectionHeaderWrap:{
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    backgroundColor: "#0b0b0f"

},

sectionHeaderText:{
    color:"white", fontWeight: "800", fontSize: 15,
},

itemWrap:{
    paddingHorizontal: 16, paddingBottom: 10, backgroundColor: "#0b0b0f",
},

itemCard:{
    padding:14, borderRadius: 16, backgroundColor: "#14141a",
    borderWidth: 1, borderColor: "#262638",
},

itemCardPast:{
    opacity:0.45, backgroundColor: "#101015",
},

itemTitle:{
    fontWeight: "800", fontSize: 15, color: "white",
},

itemTime:{
    color:"#d6d6df", marginTop: 4, fontSize: 14,
},

itemMeta:{fontSize:12, color: "#a9a9b6",},

leaveText:{fontSize: 12, color: "#22C55E",marginTop: 4,},

routeLink:{
    color:"#9bc2f2", fontSize: 13,
    marginTop: 10, fontWeight: "600",
},

emptyText:{ padding: 16, color: "#d6d6df",},

safe:{flex:1, backgroundColor: "#0b0b0b,"}
});
