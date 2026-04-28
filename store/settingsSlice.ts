import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type LanguageCode = "vi" | "en";
export type CurrencyCode = "VND" | "USD";

type SettingsState = {
  language: LanguageCode;
  currency: CurrencyCode;
  vndToUsdRate: number;
};

const initialState: SettingsState = {
  language: "vi",
  currency: "VND",
  vndToUsdRate: 25500,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setLanguage(state, action: PayloadAction<LanguageCode>) {
      state.language = action.payload;
    },
    setCurrency(state, action: PayloadAction<CurrencyCode>) {
      state.currency = action.payload;
    },
    setVndToUsdRate(state, action: PayloadAction<number>) {
      if (Number.isFinite(action.payload) && action.payload > 0) {
        state.vndToUsdRate = action.payload;
      }
    },
  },
});

export const { setLanguage, setCurrency, setVndToUsdRate } = settingsSlice.actions;
export default settingsSlice.reducer;
