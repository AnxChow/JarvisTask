import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as Speech from "expo-speech";
import { initDatabase, getTasks, delTask, completeTask } from "./database";
import { addTask as addTaskToDb } from "./database";

type Task = {
  id: string;
  title: string;
  dueDate: Date;
  label?: string;
  complete: boolean;
};

type Label = {
  name: string;
  color: string;
};

const labels: Label[] = [
  { name: "Work", color: "#EF4444" },
  { name: "Personal", color: "#3B82F6" },
  { name: "Urgent", color: "#F59E0B" },
];

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState(new Date());
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const startListening = async () => {
    try {
      setIsListening(true);
      const { transcription } = await Speech.recognizeAsync({
        language: "en-US",
      });
      if (transcription) {
        setNewTask(transcription);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to start speech recognition", error);
    } finally {
      setIsListening(false);
    }
  };

  const addTask = async () => {
    console.log("UI: Starting add task with:", {
      newTask,
      newTaskDueDate,
      newTaskLabel,
    });
    if (newTask.trim() !== "") {
      try {
        await addTaskToDb(newTask, newTaskDueDate, newTaskLabel);
        const task: Task = {
          id: Date.now().toString(),
          title: newTask,
          dueDate: newTaskDueDate,
          label: newTaskLabel,
          complete: false,
        };
        setTasks([...tasks, task]);
        setNewTask("");
        setNewTaskDueDate(new Date());
        setNewTaskLabel("");
        setIsModalOpen(false);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await delTask(taskId);
      // Refresh the task list
      // const updatedTasks = await getTasks();
      // setTasks(updatedTasks);
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  useEffect(() => {
    initDatabase();
    const loadTasks = async () => {
      try {
        const tasksData = await getTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error("Error loading tasks:", error);
      }
    };
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const tasks = await getTasks();
    // Update your state with tasks
    setTasks(tasks);
  };

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId); // You'll need to create this function in database.ts
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Error completing task:", error);
    }
  };

  // const handleAddTask = async (title: string, dueDate: Date, label: string) => {
  //   try {
  //     await addTaskToDb(newTask, newTaskDueDate, newTaskLabel);
  //     const updatedTasks = await getTasks();
  //     setTasks(updatedTasks);
  //   } catch (error) {
  //     console.error("Error adding task:", error);
  //   }
  // };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Tracker</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsModalOpen(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={startListening}
              disabled={isListening}
            >
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.taskList}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {sortedTasks
            .filter((task) => !task.complete)
            .map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                <Text style={styles.taskDate}>
                  Due: {task.dueDate.toLocaleDateString()}
                </Text>
                {task.label && (
                  <View
                    style={[
                      styles.taskLabel,
                      {
                        backgroundColor: labels.find(
                          (l) => l.name === task.label
                        )?.color,
                      },
                    ]}
                  >
                    <Text style={styles.taskLabelText}>{task.label}</Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.delButton}
                  onPress={() => handleDelete(task.id)}
                >
                  <Ionicons name="trash-outline" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.completeButton}
                  onPress={() => handleComplete(task.id)}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={24}
                    color="white"
                  />
                </TouchableOpacity>
              </View>
            ))}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.modalContainer}
          >
            <TouchableWithoutFeedback onPress={dismissKeyboard}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Add New Task</Text>
                <TextInput
                  style={styles.inputLarge}
                  placeholder="Task Title"
                  value={newTask}
                  onChangeText={setNewTask}
                  multiline
                  numberOfLines={4}
                />
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    setShowDatePicker(true);
                    dismissKeyboard();
                  }}
                >
                  <Text>Due Date: {newTaskDueDate.toLocaleDateString()}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={newTaskDueDate}
                    mode="date"
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setNewTaskDueDate(selectedDate);
                      }
                    }}
                  />
                )}
                <Picker
                  selectedValue={newTaskLabel}
                  onValueChange={(itemValue) => setNewTaskLabel(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a label" value="" />
                  {labels.map((label) => (
                    <Picker.Item
                      key={label.name}
                      label={label.name}
                      value={label.name}
                      color={label.color}
                    />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={addTask}
                >
                  <Text style={styles.addTaskButtonText}>Add Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
  },
  addButton: {
    backgroundColor: "#3B82F6",
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  delButton: {
    backgroundColor: "#118111",
    padding: 8,
    borderRadius: 8,
  },
  completeButton: {
    backgroundColor: "#118111",
    padding: 8,
    borderRadius: 8,
  },
  voiceButton: {
    backgroundColor: "#10B981",
    padding: 8,
    borderRadius: 8,
  },
  taskList: {
    flex: 1,
  },
  taskCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  taskDate: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  taskLabel: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  taskLabelText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 8,
    width: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
  },
  inputLarge: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    height: 100,
    textAlignVertical: "top",
  },
  dateButton: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
  },
  picker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    marginBottom: 16,
  },
  addTaskButton: {
    backgroundColor: "#3B82F6",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
  },
  addTaskButtonText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  closeButton: {
    marginTop: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#3B82F6",
  },
});
