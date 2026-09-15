// Shared drag payload for placeholder items. Custom MIME types on dataTransfer
// do not reliably survive drags into a cross-origin-ish iframe (the GrapesJS
// canvas), so we stash the value in module state on dragstart and read it on
// drop.
let payload = null;

export const setPlaceholderDragPayload = (value) => {
  payload = value;
};

export const getPlaceholderDragPayload = () => payload;

export const clearPlaceholderDragPayload = () => {
  payload = null;
};
