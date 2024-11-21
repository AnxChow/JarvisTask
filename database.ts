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
): Promise<string> => {
  try {
    const taskId = Date.now().toString();
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];
    const newTask = {
      id: taskId,
      title,
      dueDate: dueDate.toISOString(),
      label,
      complete: false,
    };
    tasksList.push(newTask);
    await AsyncStorage.setItem("tasks", JSON.stringify(tasksList));
    console.log("DB: Task added successfully with ID: ", taskId);
    return taskId;
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

export const getTaskById = async (taskId: string): Promise<Task | null> => {
  console.log("Attempting to get task with ID:", taskId);
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];

    // Find specific task and convert its date
    const task = tasksList.find((task: Task) => task.id === taskId);
    console.log("Task with above ID found:", task);
    if (!task) return null;

    return {
      ...task,
      dueDate: new Date(task.dueDate),
    };
  } catch (error) {
    console.error("DB: Error getting task:", error);
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
    return updatedTasks.map((task: Task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
    }));
  } catch (error) {
    console.error("DB: Error completing task:", error);
    throw error;
  }
};

export const uncompleteTask = async (taskId: string): Promise<void> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];

    // Find and update the specific task
    const updatedTasks = tasksList.map((task: Task) =>
      task.id === taskId ? { ...task, complete: false } : task
    );

    // Save the filtered list back to storage
    await AsyncStorage.setItem("tasks", JSON.stringify(updatedTasks));
    console.log("DB: Task uncompleted successfully");
    return updatedTasks.map((task: Task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
    }));
  } catch (error) {
    console.error("DB: Error uncompleting task:", error);
    throw error;
  }
};

export const getTasks = async (): Promise<any[]> => {
  try {
    const tasks = await AsyncStorage.getItem("tasks");
    const tasksList = tasks ? JSON.parse(tasks) : [];
    return tasksList.map((task: Task) => ({
      ...task,
      dueDate: new Date(task.dueDate),
    }));
  } catch (error) {
    console.error("DB: Error getting tasks:", error);
    throw error;
  }
};
