import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";
import { broadcastFormActions } from "../../store/broadcastFormSlice";

// Refs cannot live in Redux (non-serializable, mutable, per-mount lifecycle).
// A thin context still owns them so consumers get the same combined bag as
// before.
const BroadcastRefsContext = createContext(null);

export function BroadcastFormProvider({ children }) {
  const emailEditorRef = useRef(null);
  const smsEditorInstanceRef = useRef(null);
  const dispatch = useDispatch();

  // Reset form state when the flow unmounts so re-opening the broadcast
  // screen starts fresh — the previous context-based implementation got
  // this for free from unmount, Redux state persists globally so we do it
  // explicitly.
  useEffect(() => {
    return () => {
      dispatch(broadcastFormActions.resetBroadcastForm());
    };
  }, [dispatch]);

  const value = useMemo(() => ({ emailEditorRef, smsEditorInstanceRef }), []);

  return (
    <BroadcastRefsContext.Provider value={value}>
      {children}
    </BroadcastRefsContext.Provider>
  );
}

// Field name → action creator (all fields expose one setter each).
const FIELD_ACTIONS = {
  selectedModes: broadcastFormActions.setSelectedModes,
  selectedTemplateData: broadcastFormActions.setSelectedTemplateData,
  category: broadcastFormActions.setCategory,
  priority: broadcastFormActions.setPriority,
  sendType: broadcastFormActions.setSendType,
  scheduleStartDateTime: broadcastFormActions.setScheduleStartDateTime,
  scheduleEndDateTime: broadcastFormActions.setScheduleEndDateTime,
  frequency: broadcastFormActions.setFrequency,
  repeatType: broadcastFormActions.setRepeatType,
  repeatOn: broadcastFormActions.setRepeatOn,
  patientType: broadcastFormActions.setPatientType,
  uploadedFile: broadcastFormActions.setUploadedFile,
  broadcastStartDate: broadcastFormActions.setBroadcastStartDate,
  broadcastEndDate: broadcastFormActions.setBroadcastEndDate,
  patientStartDateTime: broadcastFormActions.setPatientStartDateTime,
  patientEndDateTime: broadcastFormActions.setPatientEndDateTime,
  ageFilter: broadcastFormActions.setAgeFilter,
  ageYear: broadcastFormActions.setAgeYear,
  ageMonth: broadcastFormActions.setAgeMonth,
  ageError: broadcastFormActions.setAgeError,
  appointmentType: broadcastFormActions.setAppointmentType,
  appointmentTypeLabels: broadcastFormActions.setAppointmentTypeLabels,
  location: broadcastFormActions.setLocation,
  locationLabels: broadcastFormActions.setLocationLabels,
  provider: broadcastFormActions.setProvider,
  providerLabels: broadcastFormActions.setProviderLabels,
  categoryLabel: broadcastFormActions.setCategoryLabel,
  priorityLabel: broadcastFormActions.setPriorityLabel,
  gender: broadcastFormActions.setGender,
  modality: broadcastFormActions.setModality,
  includeOptOut: broadcastFormActions.setIncludeOptOut,
  patientsFoundForType: broadcastFormActions.setPatientsFoundForType,
  selectedTemplateType: broadcastFormActions.setSelectedTemplateType,
  existingTemplateValues: broadcastFormActions.setExistingTemplateValues,
  newTemplateName: broadcastFormActions.setNewTemplateName,
  selectedEmailTemplateType: broadcastFormActions.setSelectedEmailTemplateType,
  mailSubject: broadcastFormActions.setMailSubject,
  mailSubjectError: broadcastFormActions.setMailSubjectError,
  isEmailEditorEmpty: broadcastFormActions.setIsEmailEditorEmpty,
  isSmsEditorEmpty: broadcastFormActions.setIsSmsEditorEmpty,
  isVoiceEditorEmpty: broadcastFormActions.setIsVoiceEditorEmpty
};

const setterName = (field) =>
  `set${field.charAt(0).toUpperCase()}${field.slice(1)}`;

// eslint-disable-next-line react-refresh/only-export-components
export const useBroadcastForm = () => {
  const refs = useContext(BroadcastRefsContext);
  if (!refs) {
    throw new Error(
      "useBroadcastForm must be used within a BroadcastFormProvider"
    );
  }

  const dispatch = useDispatch();
  const state = useSelector((s) => s.broadcastForm);
  // Grab the raw store so setters can read the latest state at call time —
  // this keeps functional updaters (setX(prev => ...)) accurate even when
  // called multiple times before the next render.
  const store = useStore();

  // Setters only depend on dispatch and store — both stable — so memoize them
  // separately from state. Otherwise every Redux update would produce brand-new
  // setter references, invalidating downstream useCallback deps and re-running
  // effects that key on those callbacks (e.g. the SMS editor useEffect, which
  // would destroy and rebuild the editor on every keystroke).
  const setters = useMemo(() => {
    const s = {};
    for (const [field, action] of Object.entries(FIELD_ACTIONS)) {
      s[setterName(field)] = (next) => {
        const current = store.getState().broadcastForm[field];
        const value = typeof next === "function" ? next(current) : next;
        dispatch(action(value));
      };
    }
    return s;
  }, [dispatch, store]);

  return useMemo(
    () => ({
      ...state,
      emailEditorRef: refs.emailEditorRef,
      smsEditorInstanceRef: refs.smsEditorInstanceRef,
      ...setters
    }),
    [state, refs, setters]
  );
};
