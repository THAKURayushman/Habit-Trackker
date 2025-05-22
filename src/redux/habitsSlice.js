import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";

export const fetchHabits = createAsyncThunk(
  "habits/fetchHabits",
  async (uid) => {
    const habitsRef = collection(db, "habits");
    const q = query(habitsRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    const habits = [];
    snapshot.forEach((doc) => habits.push({ id: doc.id, ...doc.data() }));
    return habits;
  }
);

const habitsSlice = createSlice({
  name: "habits",
  initialState: {
    habits: [],
    loading: false,
    error: null,
  },
  reducers: {
    setHabits(state, action) {
      state.habits = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHabits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHabits.fulfilled, (state, action) => {
        state.habits = action.payload;
        state.loading = false;
      })
      .addCase(fetchHabits.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const { setHabits } = habitsSlice.actions;

export const subscribeToHabits = (uid) => (dispatch) => {
  const habitsRef = collection(db, "habits");
  const q = query(habitsRef, where("uid", "==", uid));
  return onSnapshot(q, (snapshot) => {
    const habits = [];
    snapshot.forEach((doc) => habits.push({ id: doc.id, ...doc.data() }));
    dispatch(setHabits(habits));
  });
};

export default habitsSlice.reducer;
