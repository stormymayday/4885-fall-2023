import "./styles.scss";

// Services:
import Router from "./services/Router.js";
import State from "./services/State.js";

// Web Components:
import StarterPage from "./components/StarterPage";
import LoginPage from "./components/LoginPage.js";
import RegistrationPage from "./components/RegistrationPage.js";
import Test from "./components/Test";
import SuccesfullyRegistered from "./components/SuccessfullyRegistered";
import MainClientPage from "./components/MainClientPage";
import ReportIncidentClient from "./components/ReportIncidentClient";
import IncidentInfoClient from "./components/IncidentInfoClient";
import TestLeo from "./components/TestLeo";

// Attaching app object to the window
window.app = {};

// Making the Router global
app.router = Router;

// Making the State global
app.state = State;

window.addEventListener("DOMContentLoaded", async () => {
  console.log(app.state.isLoggedIn);

  // Initializing the Router
  app.router.init();
});

console.log(import.meta.env.VITE_TEST);
