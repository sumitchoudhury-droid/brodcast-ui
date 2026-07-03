import { AppRoutes } from "./routes";
import { ToastProvider } from "./hooks/useToast";
import { QueryErrorHandler } from "./components/QueryErrorHandler";
import "./style/global.scss";

function App() {
  return (
    <ToastProvider>
      <QueryErrorHandler />
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
