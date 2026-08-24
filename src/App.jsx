import { AppRoutes } from "./routes";
import { ToastProvider } from "./hooks/useToast";
import { QueryErrorHandler } from "./components/QueryErrorHandler";
// import { AuthBootstrap } from "./components/AuthBootstrap";
import "./style/global.scss";

function App() {
  return (
    <ToastProvider>
      <QueryErrorHandler />
      {/* <AuthBootstrap> */}
      <AppRoutes />
      {/* </AuthBootstrap> */}
    </ToastProvider>
  );
}

export default App;
