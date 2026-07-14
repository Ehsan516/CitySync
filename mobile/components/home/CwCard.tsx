import React from "react";
import {View,Text, TextInput, FlatList, Pressable, StyleSheet, Alert,Switch} from "react-native";
import {Picker} from "@react-native-picker/picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { PrimBtn, SecBtn, DangerBtn } from "@/components/home/ActionBtns";
import type { CourseworkDto } from "@/lib/CwHelpers";
import { formatDate, formatTime, getReminderLevel } from "@/lib/CwHelpers";


type ModuleDto = {id: number; userId: number; code: string; name: string; credits: number | null;};
//unique module id, owner of module, m,odule code, name, credits

type Props = {
  modules: ModuleDto[];
  coursework: CourseworkDto[];
  //list of all modules from dropdown and cw items

  selectedModuleId: number | null;
  setSelectedModuleId: (value: number | null) => void;
  //selected module for new cw

  cwTitle: string;
  setCwTitle: (value: string) => void;
  cwDueDateObj: Date;
  setCwDueDateObj: (value: Date) => void;
  //create form state and full dateTime obj

  //my date and time pickers
  showDatePicker: boolean;
  setShowDatePicker: (value: boolean) => void;
  showTimePicker: boolean;
  setShowTimePicker: (value: boolean) => void;

  cwWeighting: string;//input for weighting
  setCwWeighting: (value: string) => void;

  cwOnSite: boolean;
  setCwOnSite: (value: boolean) => void;
  cwLocation: string;
  setCwLocation: (value: string) => void;

  createCoursework: () => void;
  //submiting new cw

  editingCwId: number | null;//editing state for which cw being edited
  editTitle: string;
  setEditTitle: (value: string) => void;
  //^edit form state

  editDueDateObj: Date | null;
  setEditDueDateObj: (value: Date | null) => void;//editing datetime
  editWeighting: string;
  setEditWeighting: (value: string) => void;//editing weighting

  editScorePercent: string;
  setEditScorePercent: (value: string) => void;

  showEditDP: boolean;
  setEditDP: (value: boolean) => void;
  showEditTP: boolean;
  setEditTP: (value: boolean) => void;

  updateCoursework: (item: CourseworkDto) => Promise<void>;//saves edit
  setCourseworkCompleted: (item: CourseworkDto, completed: boolean) => Promise<void>;
  startEditingCw: (item: CourseworkDto) => void;
  cancelEditing: () => void;
  //^entering and exiting edit mode

  editOnSite: boolean;
  setEditOnSite: (value: boolean) => void;
  editLocation: string;
  setEditLocation: (value: string) => void;

  deleteCw : (item: CourseworkDto) => void;
};

export default function CwCard({ //recieved all state and handles from index
  modules,
  coursework,
  //module and cw list^
  selectedModuleId,setSelectedModuleId,cwTitle,
  setCwTitle,cwDueDateObj,setCwDueDateObj,
  //^selecte dmodule for new cw, form title and datetime
  showDatePicker,setShowDatePicker,showTimePicker,
  setShowTimePicker,cwWeighting,setCwWeighting,
  cwOnSite,setCwOnSite,cwLocation,setCwLocation,
  createCoursework,editingCwId,editTitle,
  //date picker and time picker
  setEditTitle,editDueDateObj,setEditDueDateObj,
  editWeighting,setEditWeighting,editScorePercent,
  //editing weighting and due date
  setEditScorePercent,showEditDP,setEditDP,
  showEditTP,setEditTP,updateCoursework,
  setCourseworkCompleted,startEditingCw,
  cancelEditing,editOnSite, setEditOnSite,
  editLocation,setEditLocation,deleteCw,
  //toggle complete, save edit, start/cancel editing



}:Props){

    const orderedCw = [...coursework].sort((a,b) =>{
        const aComplete = !!a.completed;
        const bComplete = !!b.completed;

        if (aComplete != bComplete){
            return aComplete ? 1: -1;//incomplete cw comes before complete cw
        }

        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();  //for both, earliest due date first
    });

    return (
    <>
          {/*Add cw */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add coursework</Text>

            {/*changing module dropdown from id to text*/}
            <View style={{ borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 10, overflow: "hidden", marginBottom: 8 }}>
              <Picker
                selectedValue={selectedModuleId}
                onValueChange={(v) => setSelectedModuleId(v)}
              >
              {/*dropdown optins from the modules*/}
                {modules.map((m) => (

                  <Picker.Item
                    key={m.id}//for react list

                    label={`${m.code} — ${m.name} (ID ${m.id})`}
                    //^what user sees
                    value={m.id}//set into the module thats selected
                  />

                ))}
              </Picker>
            </View>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>

                <Text style={styles.label}>Due date</Text>

                <Pressable onPress = {() => setShowDatePicker(true)} style={styles.input}>
                    <Text style={{ color: "white" }}> {formatDate(cwDueDateObj).split("T")[0]} </Text>
                    {/* shows current selected date */}
                </Pressable>

                <Text style = {styles.label}> Due time  </Text>
                <Pressable onPress = {() => setShowTimePicker(true)} style={styles.input}>
                {/*should open time picker when press*/}
                    <Text style={{ color: "white" }}>{formatTime(cwDueDateObj)}</Text>
                    {/* shos current sleected time*/}
                </Pressable>
              </View>
              <View style={{ width: 110 }}>

                <Text style={styles.label}>Weight %</Text>
                <TextInput value={cwWeighting} onChangeText={setCwWeighting} style={styles.input} keyboardType="numeric" placeholderTextColor="#555" />
              </View>
            </View>

            {showDatePicker && (
                <DateTimePicker value ={cwDueDateObj} mode = "date"
                    display = "default" onChange={(event, selectedDate) =>{
                        setShowDatePicker(false);
                        if(selectedDate){setCwDueDateObj(selectedDate);}
                    }}/>
            )}

            {showTimePicker &&(
                <DateTimePicker value={cwDueDateObj} mode = "time" display ="default"
                //shows full datetime but only allowed to pick time
                onChange={(event, selectedTime) => {
                    setShowTimePicker(false);
                    //close picker after selecting
                    if (selectedTime){
                        const next = new Date(cwDueDateObj);
                        //same existing date only time change

                        next.setHours(selectedTime.getHours());
                        next.setMinutes(selectedTime.getMinutes());
                        next.setSeconds(0); next.setMilliseconds(0);
                        //hours and seconds applied, miliseconds not needed

                        setCwDueDateObj(next);
                        //updated with new time

                        }
                    }}
                />
            )}

            <Text style={styles.label}>Title</Text>
            <TextInput value={cwTitle} onChangeText={setCwTitle} style={styles.input} placeholder="Coursework title" placeholderTextColor="#555" />

            <View style = {{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10}}>
                <Text style={styles.label}>On-site assessment?</Text>
                <Switch value={cwOnSite} onValueChange={setCwOnSite}/>
                {/*toggle for onsite for cw items/exams whatever*/}
            </View>

            {cwOnSite &&(
            <>
                <Text style={styles.label}> Location </Text>
                <TextInput
                    value={cwLocation}
                    onChangeText={setCwLocation}
                    style={styles.input}
                    placeholder="city main campus or the crypt etc"
                    placeholderTextColor="#555"
                />
            </>
            )}

            <View style={styles.rowGap}>
              <PrimBtn title="Create coursework" onPress={createCoursework} />
            </View>
          </View>

          {/* Coursework list */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Coursework</Text>

            <FlatList
              data={orderedCw}
              keyExtractor={(c) => String(c.id)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => {

                const lvl = getReminderLevel(item.dueDate);

                const isEditing = editingCwId === item.id;
                const done = !!item.completed;
                return (

                  <View style={[styles.itemCard,  done && styles.itemCardCompleted]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemTitle, done && styles.completedText]}>{item.title}</Text>
                      <Text style={[styles.muted, done && styles.completedMuted]}>
                        Due: {item.dueDate} • Module: {item.moduleId} • Weight: {item.weighting ?? "n/a"}%
                        {item.scorePercent != null ? `•Mark: ${item.scorePercent}%` : ""}
                      </Text>

                      <Text style={styles.badge}>
                        {item.completed ? "completed" : "pending"}
                      </Text>

                      {!item.completed ? (
                        (() => {
                          return (

                            <Text style={[styles.muted, done && styles.completedMuted]}>
                              Reminder: {lvl.label} ({lvl.freq})
                            </Text>

                          );
                        })()
                      ) : null}

                      {isEditing ? (

                        <View style={styles.editPanel}>
                          <Text style={styles.editLabel}>Title</Text>
                          <TextInput

                            value={editTitle}
                            onChangeText={setEditTitle}
                            style={styles.editInput}
                            placeholderTextColor="#555"
                          />

                          {/*editing date picker*/}
                          <Text style={styles.editLabel}>Due date</Text>
                          <Pressable onPress={() => setEditDP(true)} style={styles.editInput}>
                            <Text style = {{ color : "white" }}>
                                {editDueDateObj ? formatDate(editDueDateObj).split("T")[0] : ""}
                            </Text>
                          </Pressable>

                          {/*editng time picker*/}
                          <Text style={styles.editLabel}>Due timee</Text>
                          <Pressable onPress={() => setEditTP(true)} style={styles.editInput}>
                            <Text style = {{ color : "white" }}>
                                {editDueDateObj ? formatTime(editDueDateObj) : ""}
                            </Text>
                          </Pressable>

                            {/*the edit date picker*/}
                            {showEditDP && editDueDateObj &&(
                            //mode only for editing the date part
                                <DateTimePicker value={editDueDateObj} mode ="date" display = "default"
                                onChange={(event, selectedDate) => {
                                    setEditDP(false);//closes picker after seletcing/canceling
                                    if (selectedDate){
                                        const next = new Date(editDueDateObj);
                                        next.setFullYear(selectedDate.getFullYear(),selectedDate.getMonth(),selectedDate.getDate());
                                        setEditDueDateObj(next);
                                        //if selected them only date is changed and not time and is saved
                                    }
                                 }}
                              />)}

                            {/*dit time picker*/}
                            {showEditTP && editDueDateObj &&(
                                //mode only for editing the time part like hour/min
                                <DateTimePicker value={editDueDateObj} mode ="time" display = "default"
                                onChange={(event, selectedTime) => {
                                    setEditTP(false);//closes picker after seletcing/canceling
                                    if (selectedTime){
                                        const next = new Date(editDueDateObj);
                                        next.setHours(selectedTime.getHours());
                                        next.setMinutes(selectedTime.getMinutes());
                                        //^same date only time is changed

                                        next.setSeconds(0);
                                        next.setMilliseconds(0);
                                        //seconds and miliseconds not needed for cw deadline
                                        setEditDueDateObj(next);
                                        //if selected them only date is changed and not time and is saved
                                    }
                                 }}
                              />)}
                          <Text style={styles.editLabel}>Weight %</Text>
                          <TextInput

                            value={editWeighting}
                            onChangeText={setEditWeighting}
                            style={styles.editInput}
                            keyboardType="numeric"
                            placeholderTextColor="#555"

                          />

                          <Text style = {styles.editLabel}>Score %</Text>
                          <TextInput
                            value={editScorePercent}
                            onChangeText={setEditScorePercent}
                            style={styles.editInput}
                            keyboardType="numeric"
                            placeholder= "e.g 65"
                            placeholderTextColor= "#555"
                          />
                          <View style = {{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8}}>
                            <Text style = {styles.editLabel}>On-site assessment</Text>
                            <Switch value= {editOnSite} onValueChange={setEditOnSite}/>
                          </View>

                          {editOnSite &&(
                            <>
                                <Text style = {styles.editLabel}>Location</Text>
                                <TextInput
                                    value={editLocation}
                                    onChangeText={setEditLocation}
                                    style={styles.editInput}
                                    placeholder="city main campus, exam room, the Crpyt etc."
                                    placeholderTextColor="#555"
                                />
                            </>
                          )}

                          <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>

                            <PrimBtn title="Save" onPress={() => updateCoursework(item)} />
                            <SecBtn title="Cancel" onPress={cancelEditing} />

                          </View>
                        </View>

                      ) : null}
                    </View>

                    <View style={{ gap: 8 }}>
                      <SecBtn
                        title={item.completed ? "Mark Incomplete" : "Mark Complete"}
                        onPress={() => setCourseworkCompleted(item, !item.completed)}
                      />

                      {!isEditing ? (

                        <SecBtn
                          title="Edit"
                          onPress={() => startEditingCw(item)}
                        />
                      ) : null}

                      <DangerBtn
                        title="Delete"
                        onPress={() =>
                          Alert.alert(
                            "Delete coursework?",
                            "This coursework will be deleted",
                            [
                              { text: "Cancel", style: "cancel" },
                              { text: "Delete", style: "destructive", onPress: () => deleteCw(item) },
                            ]
                          )
                        }
                      />
                    </View>
                  </View>
                );}}
              ListEmptyComponent={<Text style={styles.muted}>No coursework yet.</Text>}/>
          </View>
         </>
        );
       }
const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 18, backgroundColor: "#14141a", borderWidth: 1, borderColor: "#232331" },//sectn card container
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800", marginBottom: 10 },
  label: { color: "#a9a9b6", marginBottom: 6, fontWeight: "600" },//the input label
  input: { backgroundColor: "#0f0f14", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 12, padding: 12, color: "white" },
  formRow: { flexDirection: "row", gap: 10, marginBottom: 12 },//row layot for grouped inputs
  rowGap: { marginTop: 12, gap: 10 },//spacing between button/rows

  itemCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, backgroundColor: "#0f0f14", borderWidth: 1, borderColor: "#262638" }, // list item card
  itemTitle: { color: "white", fontSize: 15, fontWeight: "800" },//title
  itemSub: { color: "#d6d6df", marginTop: 3, fontWeight: "600" },//item subtitle

  muted: { color: "#a9a9b6", marginTop: 6 },
  //^any text underneath

  badge: { marginTop: 10, alignSelf: "flex-start", paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, overflow: "hidden", fontWeight: "800", backgroundColor: "#1f1f2a", color: "white" }, // status for complete/pending

  editPanel: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: "#12121c", borderWidth: 1, borderColor: "#2a2a40", gap: 6 }, // inline edit box
  editLabel: { color: "#a9a9b6", fontSize: 12, fontWeight: "600" },//edit label
  editInput: { backgroundColor: "#0f0f14", borderWidth: 1, borderColor: "#2a2a3a", borderRadius: 10, padding: 10, color: "white", fontSize: 14 }, // inline edit input


  //for completed cw in list
  itemCardCompleted:{
    backgroundColor: "#0d012",
    borderColor: "#1c1c28",
    opacity: 0.65,
  },

  completedText:{
    color: "#9a9aaa",
  },

  completedMuted:{
    color: "#6f6f7f",
  },

});