import React from "react";
import {View, Text, SectionList, StyleSheet, Pressable, RefreshControl} from "react-native";
import Animated from "react-native-reanimated";
import type { UnifiedItem } from "@/lib/types";
import { AppColors, Radius, Spacing } from "@/constants/app-theme";

type SectionType ={
    title: string; data: UnifiedItem[];
};

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList<UnifiedItem, SectionType>);

type Props = {
    weekStartLabel: string; weekEndLabel: string;
    sections: SectionType[];
    onOpenRouteDetails: (item: UnifiedItem) => void;
    refreshing: boolean;
    onRefresh: () => void;
    onScroll?: (event: any) => void;
};

function fmtSectionDate(ymd:string) : string {
    const [y,m,d] = ymd.split("-").map(Number);

    const date = new Date(y, m-1, d);

    const weekDay = date.toLocaleDateString("en-GB", {weekday: "long"});

    return `${weekDay} • ${ymd}`;
}

export default function UnifiedWeekView({
    weekStartLabel,weekEndLabel,
    sections,
    onOpenRouteDetails,
    refreshing, onRefresh,
    onScroll,
}: Props) {

return(
    <View style={styles.safe}>
      <Text style={styles.rangeLabel}>{weekStartLabel} — {weekEndLabel}</Text>

      <AnimatedSectionList
        sections={sections}
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 120}}
        keyExtractor={(item) => item.key}
        onScroll={onScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={AppColors.primary} />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{fmtSectionDate(section.title)}</Text>
          </View>
        )}
        renderItem={({ item }) => {

          const past = item.end.getTime() < Date.now();

          return (

            <View style={styles.itemRow}>
              <View style={[styles.sourceBar, { backgroundColor: item.source === "timetable" ? AppColors.accent : AppColors.primary }]} />

              <View style={[styles.itemCard, past && styles.itemCardPast]}>

                <Text style={[styles.itemKicker, { color: item.source === "timetable" ? AppColors.accent : AppColors.primary }]}>
                  {item.source === "timetable" ? "LECTURE" : "COURSEWORK"}
                </Text>

                <Text style={[styles.itemTitle, past && styles.itemTextPast]}>{item.title}</Text>

                <Text style={[styles.itemTime, past && styles.itemTextPast]}>
                  {item.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} – {" "}
                  {item.end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>


                {item.location ? (
                  <Text style={[styles.itemMeta, past && styles.itemMetaPast]}>
                    Location: {item.location}
                  </Text>
                ) : null}

                {item.meta ? (
                  <>
                    {item.meta.split(" • ").map((part, i) => (
                      <Text
                        key={i}
                        style={[
                          styles.itemMeta,
                          past ? styles.itemMetaPast : part.startsWith("Leave at") && styles.itemMetaLeave,
                          { marginTop: i === 0 ? 4 : 1 },
                        ]}
                      >
                        {part}
                      </Text>
                    ))}
                  </>
                ) : null}

                {(item.source === "timetable" || (item.source === "coursework" && item.onSite)) && !past ?(
                  <Pressable
                      onPress={() => onOpenRouteDetails(item)}
                      style={({ pressed }) => [styles.routeBtn, pressed && { opacity: 0.6 }]}
                  >
                   <Text style={styles.routeBtnText}>
                      Show route details ›
                   </Text>
                  </Pressable>
                ):null}
              </View>
            </View>

          );
        }}
        ListEmptyComponent={<Text style={styles.emptyText}>No items this week</Text>}
      />
    </View>
);}

const styles = StyleSheet.create({

safe:{flex:1, backgroundColor: AppColors.background},

rangeLabel:{
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.sm,
},

sectionHeader: {
  paddingHorizontal: Spacing.xl,
  paddingTop: Spacing.md,
  paddingBottom: Spacing.sm,
  backgroundColor: AppColors.background,
},
sectionHeaderText: {
  fontWeight: "700",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 0.4,
  color: AppColors.textMuted,
},

itemRow: {
  flexDirection: "row",
  paddingHorizontal: Spacing.lg,
  marginBottom: Spacing.sm,
  gap: Spacing.sm,
},
sourceBar: {
  width: 3,
  borderRadius: 2,
  marginVertical: 2,
},
itemCard: {
  flex: 1,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.md,
  borderRadius: Radius.md,
  backgroundColor: AppColors.card,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: AppColors.border,
},
itemCardPast: {
  opacity: 0.45,
},
itemKicker: {
  fontSize: 11,
  fontWeight: "800",
  letterSpacing: 0.5,
  marginBottom: 3,
},
itemTitle: {
  fontWeight: "700",
  fontSize: 15,
  color: AppColors.text,
},
itemTime: {
  color: AppColors.textSecondary,
  marginTop: 2,
  fontSize: 13,
},
itemMeta: {
  fontSize: 12,
  color: AppColors.textMuted,
},
itemMetaPast: {
  color: AppColors.textTertiary,
},
itemMetaLeave: {
  color: AppColors.success,
  fontWeight: "700",
},
itemTextPast: {
  color: AppColors.textMuted,
},
routeBtn: {
  marginTop: 8,
  alignSelf: "flex-start",
},
routeBtnText: {
  color: AppColors.accent,
  fontSize: 13,
  fontWeight: "600",
},
emptyText: {
  padding: Spacing.lg,
  color: AppColors.textMuted,
},

});
