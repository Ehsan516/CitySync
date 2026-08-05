import React, { useEffect, useMemo, useState } from "react";
import Animated from "react-native-reanimated";
import { useAuth } from "@/hooks/useAuth";
import HeaderCard from "@/components/home/HeaderCard";
import ScreenHeader from "@/components/ui/ScreenHeader";
import SwipeTabScreen from "@/components/ui/SwipeTabScreen";
import Card from "@/components/ui/Card";
import { SecBtn } from "@/components/home/ActionBtns";
import { FontFamily, Spacing, Type, type ColorTokens } from "@/constants/app-theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useScrollHeader } from "@/hooks/use-scroll-header";
import { useTabBarPadding } from "@/hooks/use-tab-bar-padding";
import type { CourseworkDto, ModuleDto } from "@/lib/types";
import { Alert, KeyboardAvoidingView, Platform, RefreshControl, SafeAreaView, StyleSheet, Text} from "react-native";
import ModuleCard from "@/components/home/ModuleCard";
import CwCard from "@/components/home/CwCard";
import { getModuleWeightTotal, calcOverallGrade, gradeLabel, gradeColour} from "@/lib/CwHelpers"
import { formatDate } from "@/lib/dateUtils"


import {checkNotifPerms, scheduleCourseworkReminders, cancelCourseworkReminders} from "@/src/notifications/cwReminders";
//^importing to index from cwreminder
import { getUserId, modulesApi, courseworkApi } from "@/lib/api";


export default function HomeScreen() {
  //lists
  const [modules, setModules] = useState<ModuleDto[]>([]);
  const [coursework, setCoursework] = useState<CourseworkDto[]>([]);

  const [status, setStatus] = useState("idle");
  const [userId, setUserId] = useState<number | null>(null);

  //module form
  const [mCode, setMCode] = useState("IN3000");
  const [mName, setMName] = useState("Module Name");
  const [mCredits, setMCredits] = useState("15");

  //coursework form
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [cwTitle, setCwTitle] = useState("Coursework part 1");
  const [cwDueDateObj, setCwDueDateObj] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const [cwWeighting, setCwWeighting] = useState("30");
  const [editScorePercent, setEditScorePercent] = useState("");

  //cw edit state
  const [editingCwId, setEditingCwId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDueDateObj, setEditDueDateObj] = useState<Date | null>(null);
  const [editWeighting, setEditWeighting] = useState("");
  const [showEditDP, setEditDP] = useState(false); //editing date picker and setter
  const [showEditTP, setEditTP] = useState(false); //editing time picker and setter

  const [cwOnSite, setCwOnSite] = useState(false);
  const [cwLocation, setCwLocation] = useState("");

  const [editOnSite, setEditOnSite] = useState(false);
  const [editLocation, setEditLocation] = useState("");

  const { logout } = useAuth();
  const { colors } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  async function loadModules() {//GET/users/{id}/modules
    setStatus("loading modules...");
    try {

      const USER_ID = await getUserId();
      setUserId(USER_ID);

      const json = await modulesApi.list(USER_ID);
      setModules(json);

      if (json.length > 0 && selectedModuleId == null) {

        setSelectedModuleId(json[0].id);
        //^defaults to first module if isnt selected
      }

      setStatus(`loaded ${json.length} modules`);
    } catch (e: any) {

      setStatus("load modules error");
      Alert.alert("Load modules error", String(e?.bodyText ?? e?.message ?? e));

    }
  }



  async function loadCoursework() { //get/users/{id}/coursework
    setStatus("loading coursework...");
    try {
      const USER_ID = await getUserId();
      setUserId(USER_ID);

      const json = await courseworkApi.listAll(USER_ID);
      setCoursework(json);
      setStatus(`loaded ${json.length} coursework`);
    } catch (e: any) {

      setStatus("load coursework error");
      Alert.alert("Load coursework error", String(e?.bodyText ?? e?.message ?? e));

    }
  }



  async function createModule() {//POST/users/{id}/modules
    setStatus("creating module...");
    try {

      const USER_ID = await getUserId();

      await modulesApi.create(USER_ID, {
        code: mCode,
        name: mName,
        credits: mCredits.trim() === "" ? null : Number(mCredits),
      });

      setStatus("module created, refreshing...");
      await loadModules();//refresh list after succesful create

    } catch (e: any) {

      setStatus("create module error");
      Alert.alert("Creaet Module error", String(e?.bodyText ?? e?.message ?? e));

    }
  }



  async function createCoursework() {//POST/users/{id}/modules/{moduleId}/coursework

    if (selectedModuleId == null) {
      Alert.alert("No module selected", "Create a module first.");
      //cant create cw unless a module is selected
      return;
    }

    const newWeight= cwWeighting.trim() === "" ? null : Number(cwWeighting);
        if (newWeight != null){
            if (isNaN(newWeight) || newWeight<0 || newWeight >100){ //checks for crap or invalid num
                Alert.alert("Invalid weighting","Weighting must be between 0 and 100");
            return;
        }

        const currentTotal = getModuleWeightTotal(selectedModuleId,coursework);
        if (currentTotal + newWeight > 100) {
            Alert.alert(
                "Weighting exceeds 100%",
                `This module already has ${currentTotal}% allocated, so adding ${newWeight}% would make ${currentTotal + newWeight}%`
                //so user understands why excess
            );
        return;
       }
      }

    setStatus("creating coursework...");
    try {

      const USER_ID = await getUserId();

      const created = await courseworkApi.create(USER_ID, selectedModuleId, {
        title: cwTitle,
        dueDate: formatDate(cwDueDateObj),
        weighting: newWeight,
        onSite: cwOnSite,
        location: cwOnSite ? cwLocation.trim() : null,
      });

      const ok = await checkNotifPerms ();//to check notif permission and schedule reminders
      if(ok){
        await scheduleCourseworkReminders(created);
      }
      setStatus("coursework created, refreshing...");

      await loadCoursework();//refresh list after successful create
        } catch (e: any) {
          setStatus("Create Coursework error");
          Alert.alert("Create Coursework error", String(e?.bodyText ?? e?.message ?? e));

        }


  }

  async function updateModule(
  //^updates an existing module
    moduleId: number,
    patch: Partial<{ code: string; name: string; credits: number | null }>
  ) {

    setStatus("updating module..."); //UI status feedback

    try {

      const USER_ID = await getUserId();

      await modulesApi.update(USER_ID, moduleId, patch);

      //if success then reload module list to show new changes
      await loadModules();

      setStatus(`updated module ${moduleId}`);

    } catch (e: any) {

      setStatus("update module error");
      Alert.alert("Update Module error", String(e?.bodyText ?? e?.message ?? e));

    }
  }


  async function deleteModule(moduleId: number) {//deletes a module by ID

    //ui status feedback
    setStatus("deleting module...");

    try {

      const USER_ID = await getUserId();

      await modulesApi.remove(USER_ID, moduleId);

      await loadModules();//refreshes modules list after deletion
      await loadCoursework();//reload coursework after module and coursework deletion

      setStatus(`deleted module ${moduleId}`);

    } catch (e: any) {
      setStatus("delete module error");
      Alert.alert("Delete Module error", String(e?.bodyText ?? e?.message ?? e));
    }
  }


  async function updateCoursework(item: CourseworkDto) {//updates title, due date and weighting for coursework

    const newTitle = editTitle.trim() || item.title;
    const newDueDate = editDueDateObj ?? new Date(item.dueDate);
    //obj because not keeping as string now^
    const newWeighting = editWeighting.trim() === "" ? item.weighting : Number(editWeighting.trim());


    if (newWeighting != null){
        if (isNaN(newWeighting) || newWeighting < 0 || newWeighting > 100) {
            Alert.alert("Invalid weighting","Weighting must be between 0 and 100");//invalid weighting edit gets rejected
            return;
        }

        const currentTotal = getModuleWeightTotal(item.moduleId, coursework, item.id);//doesn't count current item when editing
        if (currentTotal + newWeighting > 100){
           Alert.alert("Weighting exceeds 100%",
                `This module already has ${currentTotal}% allocated excluding this coursework, setting it to ${newWeighting}% would make ${currentTotal + newWeighting}%`);
           return;
        }
    }

    setStatus("updating coursework...");
    try {

      const USER_ID = await getUserId();

      const updated = await courseworkApi.update(USER_ID, item.moduleId, item.id, {
        title: newTitle,
        dueDate: formatDate(newDueDate),
        weighting: newWeighting,
        scorePercent: editScorePercent.trim() === "" ? null : Number(editScorePercent.trim()),
        onSite: editOnSite,
        location: editOnSite ? editLocation.trim() : null,
      });

      const ok = await checkNotifPerms();
      if (ok && !updated.completed) {

        await cancelCourseworkReminders(updated.id);
        //^cancel old reminders before rescheduling for new due date
        await scheduleCourseworkReminders(updated);
      }



      setEditingCwId(null);
      //^closes inline edit panel after save

      setStatus(`updated coursework ${item.id}`);
      await loadCoursework();

    } catch (e: any) {

      setStatus("update coursework error");
      Alert.alert("Update Coursework error", String(e?.bodyText ?? e?.message ?? e));

    }
  }


  async function setCourseworkCompleted(item: CourseworkDto, completed: boolean) {//toggle completion helper

    setStatus(completed ? "marking complete..." : "marking incomplete...");

    try {

      const USER_ID = await getUserId();

      const updated = await courseworkApi.update(USER_ID, item.moduleId, item.id, { completed });

      const ok = await checkNotifPerms();//to check notification perms enabled
      if(ok){

        if(updated.completed){
            await cancelCourseworkReminders(updated.id);
            //if cw complete then cancel all scheduled reminders for it
        }else{
            await scheduleCourseworkReminders(updated)//else if still incomplete then rechedule reminders for due date
        }

      }

      await loadCoursework();//refreshs list after with backend state

      setStatus(`coursework ${item.id} completed=${completed}`);
    } catch (e: any) {
      Alert.alert("Update error", String(e?.bodyText ?? e?.message ?? e));

    }

  }

 async function deleteCw(item: CourseworkDto){
    setStatus("deleteing coursework..");
    try{
        const USER_ID = await getUserId();//gets user id

        await courseworkApi.remove(USER_ID, item.moduleId, item.id);

        await cancelCourseworkReminders(item.id); //removes reminders for cw deleted
        setStatus(`deleted coursework ${item.id}`);
        await loadCoursework();
        //ui updates and cw lisr reloaded

        } catch (e: any){//for network erros /crashes
            setStatus("delete cw error");
            Alert.alert("Delete cw error",String(e?.bodyText ?? e?.message ?? e));
        }

 }

  function startEditingCw(item: CourseworkDto) {//opens edit panel and fills current coursework vals

    setEditingCwId(item.id);
    setEditTitle(item.title);
    setEditDueDateObj(new Date(item.dueDate));
    setEditWeighting(item.weighting != null ? String(item.weighting) : "");
    setEditScorePercent(item.scorePercent != null ? String(item.scorePercent) : "");
    setEditOnSite(item.onSite ?? false);
    setEditLocation(item.location ?? "");
  }

  const stats = useMemo(() => {
    const completedCount = coursework.filter((c) => c.completed).length;
    return {
      modules: modules.length,
      coursework: coursework.length,
      completed: completedCount,
      pending: coursework.length - completedCount,
    };
  }, [modules.length, coursework]);

  const overallGrade = useMemo(() => calcOverallGrade(modules, coursework), [modules, coursework]);

  const [refreshing, setRefreshing] = useState(false);

  async function onPullToRefresh() {
    setRefreshing(true);
    await Promise.all([loadModules(), loadCoursework()]);
    setRefreshing(false);
  }

  //on screen load fetch both lists
  useEffect(() => {
    loadModules();
    loadCoursework();
  }, []);

  const { scrollY, onScroll } = useScrollHeader();

  return (
    <SwipeTabScreen>
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="CitySync"
        subtitle={`User ${userId ?? "?"} • ${status}`}
        rightSlot={<SecBtn title="Logout" onPress={logout} />}
        scrollY={scrollY}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Animated.ScrollView
          contentContainerStyle={[styles.container, { paddingBottom: 40 + tabBarPadding }]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onPullToRefresh} tintColor={colors.primary} />
          }
        >
          <HeaderCard stats={stats} />

      <Card style={styles.gradeCard}>

      <Text style={styles.gradeHeading}> Overall confirmed grade</Text>

      {overallGrade ?(
        <>
            <Text style = {[styles.gradeValue, { color: gradeColour(Math.round(overallGrade.percent)) }]}>
                {overallGrade.percent}%
            </Text>

            <Text style = {[styles.gradeLabel, { color: gradeColour(Math.round(overallGrade.percent)) }]}>
                {gradeLabel(Math.round(overallGrade.percent))}
            </Text>

            <Text style={styles.gradeHint} >
                Based on fully completed modules only, {overallGrade.creditsUsed} credits included
            </Text>
          </>
          ):(<Text style={styles.gradeHint}>
            No confirmed overall grade yet, complete and grade coursework in at least one module.
            </Text>
      )}
    </Card>

          <ModuleCard
            modules={modules}
            coursework={coursework}
            mCode={mCode}
            setMCode={setMCode}
            mName={mName}
            setMName={setMName}
            mCredits={mCredits}
            setMCredits={setMCredits}
            createModule={createModule}
            updateModule={updateModule}
            deleteModule={deleteModule}
          />

          <CwCard
            modules={modules}
            coursework={coursework}
            selectedModuleId={selectedModuleId}
            setSelectedModuleId={setSelectedModuleId}
            cwTitle={cwTitle}
            setCwTitle={setCwTitle}
            cwDueDateObj={cwDueDateObj}
            setCwDueDateObj={setCwDueDateObj}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            showTimePicker={showTimePicker}
            setShowTimePicker={setShowTimePicker}
            cwWeighting={cwWeighting}
            setCwWeighting={setCwWeighting}
            createCoursework={createCoursework}
            editingCwId={editingCwId}
            editTitle={editTitle}
            setEditTitle={setEditTitle}
            editDueDateObj={editDueDateObj}
            setEditDueDateObj={setEditDueDateObj}
            editWeighting={editWeighting}
            setEditWeighting={setEditWeighting}
            editScorePercent={editScorePercent}
            setEditScorePercent={setEditScorePercent}
            updateCoursework={updateCoursework}
            setCourseworkCompleted={setCourseworkCompleted}
            startEditingCw={startEditingCw}
            deleteCw = {deleteCw}
            cancelEditing={() => setEditingCwId(null)}
            showEditDP={showEditDP}
            showEditTP={showEditTP}
            setEditTP={setEditTP}
            setEditDP={setEditDP}
            cwOnSite = {cwOnSite}
            setCwOnSite={setCwOnSite}
            cwLocation={cwLocation}
            setCwLocation={setCwLocation}
            editOnSite = {editOnSite}
            setEditOnSite = {setEditOnSite}
            editLocation = {editLocation}
            setEditLocation = {setEditLocation}
          />

        </Animated.ScrollView>

      </KeyboardAvoidingView>
    </SafeAreaView>
    </SwipeTabScreen>

  );
}

function makeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      padding: Spacing.lg,
      paddingBottom: 40,
      gap: Spacing.md,
    },
    gradeCard: {
      alignItems: "center",
      gap: 6,
    },
    gradeHeading: { ...Type.footnote, color: colors.textSecondary },
    gradeValue: { fontSize: 32, fontWeight: "800", fontFamily: FontFamily.extrabold },
    gradeLabel: { ...Type.footnote, fontSize: 14 },
    gradeHint: { color: colors.textMuted, fontSize: 12, textAlign: "center", lineHeight: 17 },
  });
}
