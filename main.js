import './styles.scss';

// Services:
import Router from './services/Router.js';
import State from './services/State.js';

// Web Components:
import HomePage from './components/HomePage.js';
import LoginPage from './components/LoginPage.js';
import RegistrationPage from './components/RegistrationPage.js';

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