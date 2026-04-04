import { createRoot } from "react-dom/client";

import { getAppConfig } from "@/config/app.config";
import { client } from "./api/client.gen";

import "./index.css";
import { App } from "@/App";

const appConfig = getAppConfig();

client.setConfig({
  baseUrl: appConfig.backendUrl,
  throwOnError: true,
});

const enableMocking = async (): Promise<
  ServiceWorkerRegistration | undefined
> => {
  if (!appConfig.enableMocks) {
    return undefined;
  }

  try {
    const { createWorker } = await import("./mocks/browser");
    const worker = createWorker();

    return await worker.start({
      onUnhandledRequest: "bypass",
    });
  } catch (error) {
    console.warn("MSW failed to start:", error);

    return undefined;
  }
};

enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
