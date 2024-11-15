import AsyncStorage from "@react-native-async-storage/async-storage";
// import { v4 as uuidv4 } from "uuid";

export interface Task {
  id: string;
  title: string;
  dueDate: Date;
  label: string;
  complete: boolean;
}

export const initDatabase = async () => {
  const tasks = await AsyncStorage.getItem("tasks");
  if (!tasks) {
    await AsyncStorage.setItem("tasks", JSON.stringify([]));
  }
};

export const addTask = async (
  title: string,
  dueDate: Date,
  label: string
): Promise<void> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];
    const newTask = {
      id: Date.now().toString(),
      title,
      dueDate: dueDate.toISOString(),
      label,
      complete: false,
    };
    tasksList.push(newTask);
    await AsyncStorage.setItem("tasks", JSON.stringify(tasksList));
    console.log("DB: Task added successfully");
  } catch (error) {
    console.error("DB: Error adding task:", error);
    throw error;
  }
};

export const delTask = async (taskId: string): Promise<void> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];

    // Filter out the task with matching ID
    const updatedTasks = tasksList.filter((task: Task) => task.id !== taskId);

    // Save the filtered list back to storage
    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
    console.log("DB: Task deleted successfully");
  } catch (error) {
    console.error("DB: Error deleting task:", error);
    throw error;
  }
};

export const completeTask = async (taskId: string): Promise<void> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];

    // Find and update the specific task
    const updatedTasks = tasksList.map((task: Task) =>
      task.id === taskId ? { ...task, complete: true } : task
    );

    // Save the filtered list back to storage
    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
    console.log("DB: Task completed successfully");
  } catch (error) {
    console.error("DB: Error completing task:", error);
    throw error;
  }
};

export const getTasks = async (): Promise<any[]> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];
    return tasksList.map((task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
    }));
  } catch (error) {
    console.error("DB: Error getting tasks:", error);
    throw error;
  }
};
