import React from "react";
import { View, StyleSheet } from "react-native";
import TaskTracker from "../TaskTracker";
import { useEffect } from "react";
// import { openDatabase } from "expo-sqlite";
// import { View } from 'react-native';
import { initDatabase } from "../database";

export default function Home() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <View style={styles.container}>
      <TaskTracker />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
});
