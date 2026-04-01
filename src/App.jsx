import { AppRoutes } from "./routes";
import { ToastProvider } from "./hooks/useToast";
import "./style/global.scss";

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  );
}

export default App;
