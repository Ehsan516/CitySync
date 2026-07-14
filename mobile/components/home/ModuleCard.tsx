import React from "react";
import {View, Text, TextInput, FlatList, Button, Alert, StyleSheet,} from "react-native";
import { DangerBtn, PrimBtn} from "@/components/home/ActionBtns";
import GradeCard from "@/components/home/GradeCard";
import type { CourseworkDto } from "@/lib/CwHelpers";

type ModuleDto = {
//front module shape from backend
    id: number;
    userId: number;
    code: string;
    name: string;
    credits: number | null;
};

type Props = {

    modules: ModuleDto[];
    coursework: CourseworkDto[];
    //lists needed to render modules and grades

    //form for creating new module
    mCode: string;
    setMCode: (value: string) => void;
    mName: string;
    setMName: (value: string) => void;
    mCredits: string;
    setMCredits: (value: string) => void;

    createModule: () => void;
    updateModule:(moduleId: number, patch: Partial<{code: string; name: string; credits: number | null}>) => void;
    //using partial becase not all fields are updated

    deleteModule: (moduleId: number) => void;
};

export default function ModuleCard({//card for module ctreation and display
    modules,coursework,mCode,setMCode,mCredits,setMCredits,mName,setMName,createModule,updateModule,deleteModule,
}: Props){

    return (
        <>
          {/* Form to add module */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add module</Text>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Code</Text>
                <TextInput value={mCode} onChangeText={setMCode} style={styles.input} placeholder="e.g. IN3007" placeholderTextColor="#555" />
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.label}>Credits</Text>
                <TextInput value={mCredits} onChangeText={setMCredits} style={styles.input} keyboardType="numeric" placeholderTextColor="#555" />
              </View>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput value={mName} onChangeText={setMName} style={styles.input} placeholder="Module name" placeholderTextColor="#555" />

            <View style={styles.rowGap}>
              <PrimBtn title="Create module" onPress={createModule} />
            </View>
          </View>

          {/* Modules list */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Modules</Text>

            <FlatList
              data={modules}
              keyExtractor={(m) => String(m.id)}//list key is string
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item }) => (

                <View style={styles.itemCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemTitle}>{item.code}</Text>
                    <Text style={styles.itemSub}>{item.name}</Text>
                    <Text style={styles.muted}>Credits: {item.credits ?? "n/a"} • ID: {item.id}</Text>

                    {/*grade for module based on cw*/}
                    <GradeCard moduleId={item.id} coursework={coursework} />
                  </View>

                  <View style={{ gap: 8 }}>
                    <Button title="Rename" onPress={() =>//user gets prompted to rename module
                        Alert.prompt(
                          "Rename module",
                          "Enter a new module name",
                          [
                            { text: "Cancel", style: "cancel" },
                            {text: "Save",onPress: (value) => {

                                const nextName = value?.trim();
                                if (!nextName) return;
                                updateModule(item.id, { name: nextName });
                              },

                            },
                          ],
                          "plain-text",
                          item.name
                        )
                      }
                    />
                    <DangerBtn
                      title="Delete"
                      onPress={() =>
                        Alert.alert(//confirmation so no accidental deletion
                          "Delete module?",
                          "This will also delete it's coursework",
                          [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => deleteModule(item.id) },
                          ]
                        )
                      }
                    />
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.muted}>No modules yet.</Text>}
            />
          </View>
        </>
      );
    }

const styles = StyleSheet.create({
//container for create form and list
  card: {
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#14141a",
    borderWidth: 1,
    borderColor: "#232331",
  },
  cardTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 10,
  },
  label: {
    color: "#a9a9b6",
    marginBottom: 6,
    fontWeight: "600",
  },


  input: {//for module form fields
    backgroundColor: "#0f0f14",
    borderWidth: 1,
    borderColor: "#2a2a3a",
    borderRadius: 12,
    padding: 12,
    color: "white",
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  rowGap: {
    marginTop: 12,
    gap: 10,
  },

  itemCard: {//for each module card
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#0f0f14",
    borderWidth: 1,
    borderColor: "#262638",
  },
  itemTitle: {
    color: "white",
    fontSize: 15,
    fontWeight: "800",
  },
  itemSub: {
    color: "#d6d6df",
    marginTop: 3,
    fontWeight: "600",
  },
  muted: {
    color: "#a9a9b6",
    marginTop: 6,
  },
});