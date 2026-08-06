import { configureStore } from "@reduxjs/toolkit";
import broadcastFormReducer from "./broadcastFormSlice";

export const store = configureStore({
  reducer: {
    broadcastForm: broadcastFormReducer
  },
  // State intentionally holds Date and File objects (patientStartDateTime,
  // uploadedFile, etc.) so consumer code can keep passing them straight to
  // date pickers and file inputs. Disabling the serializable check avoids
  // false-positive warnings; DevTools time-travel is the trade-off.
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
});
