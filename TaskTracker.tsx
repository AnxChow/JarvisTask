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
  SafeAreaView,
  // LogBox,
  NativeModules,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import Voice, { SpeechResultsEvent } from "@react-native-voice/voice";
import {
  uncompleteTask,
  getTaskById,
  initDatabase,
  getTasks,
  delTask,
  completeTask,
} from "./database";
import { addTask as addTaskToDb } from "./database";
import Constants from "expo-constants";

const { os_log } = NativeModules;

const OPENAI_API_KEY = Constants.expoConfig.extra.OPENAI_API_KEY;
const OPENAI_ORG_ID = Constants.expoConfig.extra.OPENAI_ORG_ID;

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
  const [tempText, setTempText] = useState(""); // Store interim results
  const [showTodayOnly, setShowTodayOnly] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function initVoice() {
      try {
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          os_log("Voice recognition not available on this device");
          return;
        }

        // await Voice.isAvailable();
        Voice.onSpeechResults = (e: SpeechResultsEvent) => {
          os_log("onSpeechResults: ", e);
          if (e.value && e.value[0]) {
            setTempText(e.value[0]);
          }
        };
        Voice.onSpeechError = (e: any) => {
          os_log("onSpeechError: ", e);
          setIsListening(false);
        };
      } catch (e) {
        os_log("Voice recognition not available", e);
      }
    }

    initVoice();

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const toggleListening = async () => {
    os_log("Toggle pressed, current state:", isListening);
    try {
      if (!isListening) {
        const isAvailable = await Voice.isAvailable();
        if (!isAvailable) {
          return;
        }
        await Voice.destroy();
        os_log("Starting voice recognition...");
        await Voice.start("en-US");
        setIsListening(true);
      } else {
        os_log("Stopping voice recognition...");
        await Voice.stop();
        setIsListening(false);
        if (tempText) {
          handleSpeechResults(tempText);
          setTempText("");
        }
      }
    } catch (error) {
      os_log("Error in voice toggle:", error);
      setIsListening(false);
    }
  };
  const handleSpeechResults = async (text) => {
    const task = await parseVoiceText(text);
    // console.log(task);
    let title = task.title;
    let dueDate = task.dueDate;
    let label = task.label;
    addVoiceTask(title, dueDate, label);
  };

  const toggleShowCompleted = () => {
    setShowCompleted((prev) => !prev);
  };
  const toggleShowToday = () => {
    setShowTodayOnly((prev) => !prev);
  };

  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, complete: !task.complete } : task
    );
    setTasks(updatedTasks);
    // saveTasks(updatedTasks);
  };

  const sortedTasks = [...tasks].sort(
    (a, b) => a.dueDate.getTime() - b.dueDate.getTime()
  );

  const filteredTasks = sortedTasks.filter((task) => {
    if (!showCompleted && task.complete) return false;
    if (showTodayOnly) {
      // tasks.filter((task) => {
      const today = new Date();
      return task.dueDate.toDateString() === today.toDateString();
    }
    return true;
    // ).sort((a, b) => {
    //   return a.dueDate.getTime() - b.dueDate.getTime();
  });

  async function parseVoiceText(text: string) {
    const today = new Date();
    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            Organization: `${OPENAI_ORG_ID}`, // Add this line
            // "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: `You are a task extraction assistant. Extract task details from the user's input and return a 'tasks' JSON where each task has the following fields: title, dueDate, and label (one of Personal, Work, Urgent). For dueDate, you should return a date in ISO format with the time set to noon. Note that today's date is "${today}", so if the user says "tomorrow" or "next week", ensure you return the correct ISO based on today's date. If the user says something vague like "in a few days", use your best judgement to figure out a due date based on the task.`,
              },
              {
                role: "user",
                content: text,
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log("1: " + data);
      const content = JSON.parse(data.choices[0].message.content);
      console.log(content.tasks);

      for (const task of content.tasks) {
        console.log("calling addtask for:" + task.title);
        const taskDueDate = new Date(task.dueDate);
        await addVoiceTask(task.title, taskDueDate, task.label);
      }

      return;

      // Assuming the response has a structure with `choices` and `message.content`
      // const result = data.choices[0].message.content;
      // console.log(result);
      // return JSON.parse(result); // Parse the JSON content from the model's response
    } catch (error) {
      os_log("Error in parseVoiceText:", error);
      return null;
    }
  }

  const addVoiceTask = async (title: string, date: Date, label: string) => {
    // console.log("UI: VOICE Starting add task with:", {
    //   title,
    //   date,
    //   label,
    //   complete: false,
    // });
    if (title.trim() !== "") {
      try {
        // const taskId = Date.now().toString(); // Log the ID we're generating
        const taskId = await addTaskToDb(title, date, label);
        console.log("Creating new voice task with ID:", taskId);
        // await addTaskToDb(title, date, label);
        console.log("added to DB: ");
        const task: Task = {
          id: taskId,
          title: title,
          dueDate: date,
          label: label,
          complete: false,
        };
        console.log("Voice task created:", task);
        setTasks((prevTasks) => [...prevTasks, task]);
        // console.log("UI: Updated tasks state for:", title);
      } catch (error) {
        console.error("Error adding task:", error);
      }
    }
  };

  const addTask = async () => {
    // console.log("UI: Starting add task with:", {
    //   newTask,
    //   newTaskDueDate,
    //   newTaskLabel,
    // });
    if (newTask.trim() !== "") {
      try {
        // const taskId = Date.now().toString(); // Log the ID we're generating
        const taskId = await addTaskToDb(newTask, newTaskDueDate, newTaskLabel);
        console.log("Creating new task with ID:", taskId);
        // await addTaskToDb(newTask, newTaskDueDate, newTaskLabel);
        const task: Task = {
          id: taskId,
          title: newTask,
          dueDate: newTaskDueDate,
          label: newTaskLabel,
          complete: false,
        };
        console.log("Task created:", task);
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
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

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
      const task = await getTaskById(taskId);
      console.log("got task: ", task.title);
      if (!task) {
        console.error("Task not found");
        return;
      }

      let updatedTasks;
      if (!task.complete) {
        updatedTasks = await completeTask(taskId);
      } else {
        updatedTasks = await uncompleteTask(taskId);
      }

      if (Array.isArray(updatedTasks)) {
        setTasks(updatedTasks);
      } else {
        // If the DB operations succeeded but didn't return tasks, refresh the task list
        const refreshedTasks = await getTasks();
        setTasks(refreshedTasks);
      }
    } catch (error) {
      console.error("Error handling task completion:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Jarvis Tasks</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setIsModalOpen(true)}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.voiceButton}
              onPress={toggleListening}
            >
              <Ionicons
                name={isListening ? "mic" : "mic-outline"}
                size={24}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterButton]}
            onPress={toggleShowToday}
          >
            <Text style={[styles.filterButtonText]}>
              {showTodayOnly ? "Show All Tasks" : "Show Today's Tasks"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton]}
            onPress={toggleShowCompleted}
          >
            <Text style={styles.filterButtonText}>
              {showCompleted ? "Hide Completed" : "Show Completed"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.taskList}
          ref={scrollViewRef}
          contentContainerStyle={styles.taskListContent}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {filteredTasks
            // .filter((task) => !task.complete)
            .map((task) => (
              <View key={task.id} style={styles.taskCard}>
                <View style={styles.taskContent}>
                  <Text
                    style={
                      (styles.taskTitle, task.complete && styles.completedTask)
                    }
                  >
                    {task.title}
                  </Text>
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
                </View>
                <View style={styles.taskActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.delButton]}
                    onPress={() => handleDelete(task.id)}
                  >
                    <Ionicons name="trash-outline" size={24} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={() => handleComplete(task.id)}
                  >
                    <Ionicons
                      name={
                        task.complete ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={24}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </ScrollView>

        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={styles.modalContainer}>
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
                    display="default"
                    // display={Platform.OS === "ios" ? "spinner" : "default"}
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
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
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
  voiceButton: {
    backgroundColor: "#10B981",
    padding: 8,
    borderRadius: 8,
  },
  voiceButtonActive: {
    backgroundColor: "#ffffff",
    padding: 8,
    borderRadius: 8,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    // backgroundColor: "#ffffff",
    // borderBottomWidth: 1,
    // borderBottomColor: "#e0e0e0",
  },
  filterButton: {
    backgroundColor: "#a0a3a1",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 20,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterButtonActive: {
    // backgroundColor: "#3B82F6",
    // width: 150,
    backgroundColor: "#3B82F6",
  },
  filterButtonText: {
    color: "#374151",
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  filterButtonTextActive: {
    color: "#808080",
  },
  taskList: {
    flex: 1,
  },
  taskListContent: {
    paddingVertical: 8,
  },
  taskCard: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  taskContent: {
    flex: 1,
    marginRight: 16,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  completedTask: {
    textDecorationLine: "line-through",
    color: "#6B7280",
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
  taskActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  completeButton: {
    backgroundColor: "#10B981",
    padding: 8,
    borderRadius: 8,
  },
  delButton: {
    backgroundColor: "#EF4444",
    padding: 8,
    borderRadius: 8,
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
