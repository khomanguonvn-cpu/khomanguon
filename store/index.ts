import { combineReducers, configureStore } from "@reduxjs/toolkit";
import cartReducer from "./cartSlice";
import orderReducer from "./orderSlice";
import settingsReducer from "./settingsSlice";

const rootReducer = combineReducers({
  cart: cartReducer,
  order: orderReducer,
  settings: settingsReducer,
});

const store = configureStore({
  reducer: rootReducer,
});

export default store;
export type IRootState = ReturnType<typeof store.getState>;
