// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Provider as ReduxProvider } from "react-redux";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "./api/api.jsx";
import { store } from "./store";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  // <StrictMode>
  <ReduxProvider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </QueryClientProvider>
  </ReduxProvider>
  // </StrictMode>
);
