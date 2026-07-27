import React, { useMemo } from "react";
import {View, Text, TextInput, FlatList, Alert, StyleSheet,} from "react-native";
import { DangerBtn, PrimBtn, SecBtn} from "@/components/home/ActionBtns";
import GradeCard from "@/components/home/GradeCard";
import Card from "@/components/ui/Card";
import type { CourseworkDto, ModuleDto } from "@/lib/types";
import { Radius, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";

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
    const { colors, radius } = useTheme();
    const styles = useMemo(() => makeStyles(colors, radius), [colors, radius]);

    return (
        <>
          {/* Form to add module */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Add module</Text>

            <View style={styles.formRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>Code</Text>
                <TextInput value={mCode} onChangeText={setMCode} style={styles.input} placeholder="e.g. IN3007" placeholderTextColor={colors.textTertiary} />
              </View>
              <View style={{ width: 110 }}>
                <Text style={styles.label}>Credits</Text>
                <TextInput value={mCredits} onChangeText={setMCredits} style={styles.input} keyboardType="numeric" placeholderTextColor={colors.textTertiary} />
              </View>
            </View>

            <Text style={styles.label}>Name</Text>
            <TextInput value={mName} onChangeText={setMName} style={styles.input} placeholder="Module name" placeholderTextColor={colors.textTertiary} />

            <View style={styles.rowGap}>
              <PrimBtn title="Create module" onPress={createModule} />
            </View>
          </Card>

          {/* Modules list */}
          <Card style={styles.card}>
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
                    <SecBtn title="Rename" onPress={() =>//user gets prompted to rename module
                        Alert.prompt(
                          "Rename module",
                          "Enter a new module name",
                          [
                            { text: "Cancel", style: "cancel" },
                            {text: "Save",onPress: (value?: string) => {

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
          </Card>
        </>
      );
    }

function makeStyles(colors: ColorTokens, radius: typeof Radius) {
  return StyleSheet.create({
//container for create form and list
  card: {
    gap: Spacing.sm,
  },
  cardTitle: {
    ...Type.headline,
    color: colors.text,
    marginBottom: Spacing.xs,
  },
  label: {
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: "600",
    fontSize: 13,
  },


  input: {//for module form fields
    backgroundColor: colors.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    color: colors.text,
    fontSize: 15,
  },
  formRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  rowGap: {
    marginTop: 4,
    gap: 10,
  },

  itemCard: {//for each module card
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.card2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  itemSub: {
    color: colors.textSecondary,
    marginTop: 3,
    fontWeight: "600",
  },
  muted: {
    color: colors.textMuted,
    marginTop: 6,
  },
  });
}
