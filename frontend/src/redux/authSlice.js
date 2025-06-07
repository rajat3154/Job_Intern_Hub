import { createSlice } from "@reduxjs/toolkit";

const initialState = {
      user: null,
      loading: false,
      otherUsers: null,
      selectedUser: null,
      onlineUsers: null,
      students: [],
      recruiters: [],
};

const authSlice = createSlice({
      name: "auth",
      initialState,
      reducers: {
            setUser: (state, action) => {
                  state.user = action.payload;
            },
            setLoading: (state, action) => {
                  state.loading = action.payload;
            },
            setOtherUsers: (state, action) => {
                  state.students = action.payload.students;
                  state.recruiters = action.payload.recruiters;
                },
            setSelectedUser: (state, action) => {
                  state.selectedUser = action.payload;
            },
            setOnlineUsers: (state, action) => {
                  state.onlineUsers = action.payload;
              }
      },
});

export const { setUser, setLoading, setOtherUsers, setSelectedUser, setOnlineUsers } = authSlice.actions;

export default authSlice.reducer;
