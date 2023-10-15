import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js"
import { collection, query, where, getDocs } from "firebase/firestore";

export default class MainClientPage extends HTMLElement {

  constructor() {

    super();

    this.user = JSON.parse(localStorage.getItem("user"));

    this.map;

  }

  async logOut() {

    await signOut(auth);

    app.router.go(`/login`);

  }

  displayMap = async () => {

    navigator.geolocation.getCurrentPosition((position) => {

      // Succuss Callback Code:

      // Destructuring latitude and longitude from position.coords object
      const { latitude } = position.coords;
      const { longitude } = position.coords;
      const coordinates = [latitude, longitude];

      // Leaflet Code - Start
      // Rendering map centered on a current user location (coordinates) with max zoom-in setting
      this.map = L.map('map').setView(coordinates, 18);

      // Tilelayer
      L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);

      // Displaying a Marker with current user coordinates
      L.marker(coordinates).addTo(this.map)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            className: 'running-popup',
          })
        )
        .setPopupContent('You are currently here')
        .openPopup();

      try {

        this.getActiveCases();

      } catch (error) {

        console.error(error);

      }
      // Leaflet Code - End

    }, () => {

      // Error Callback Code:

      alert(`Unfortunately, TowTackle was not able to pick up your position.`);

    });

  }

  getActiveCases = async () => {

    const q = query(collection(dataBase, "cases"), where("status", "==", 'active'),
      where("reporterId", "==", this.user.uid));

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {

      // doc.data() is never undefined for query doc snapshots
      console.log(doc.id, " => ", doc.data());

      const { latitude, longitude } = doc.data().coordinates;

      const coordinates = [latitude, longitude];

      let incidentMarker = {};

      incidentMarker = L.marker([latitude, longitude]).addTo(this.map)
        .bindPopup(
          L.popup({
            autoClose: false,
            closeOnClick: false,
            className: 'running-popup',
          })
        )
        .setPopupContent(doc.data().notes)
        .openPopup();

    });

  }

  connectedCallback() {

    // Getting template from the DOM
    const template = document.getElementById("main-client-page");

    // Cloning the template
    const content = template.content.cloneNode(true);

    // Appending content to the DOM
    this.appendChild(content);

    // const userObject = JSON.parse(localStorage.getItem("user"));
    console.log(this.user);

    if (this.user) {

      this.querySelector('h3').innerHTML = `Welcome ${this.user.role} ${this.user.nameRegistration}`;

      // Testing if navigator.geolocation is supported by the browser
      if (navigator.geolocation) {

        this.displayMap();

      }
      // end of navigator / Leaflet

    }

    this.querySelector("#btn-click-report-incident").addEventListener(
      "click",
      () => {
        app.router.go("/report-incident");
      }
    );

    this.querySelector("#logout-btn").addEventListener(
      "click",
      async () => {

        localStorage.clear();

        await this.logOut();

      }
    );


  }
}

// Registering the login-page custom element
customElements.define("main-client-page", MainClientPage);
// TODO ADD LEAFLEET
// Side bar opens if you click on a pin(Delete or change a report)

// Fetch all incidents (Make available to see only thouse that the client has submmited)
// Drop down menu out of the photo on the right top corner(SETTINGS LOGOUT)
// Left top corner logo (LINK to te main page => APP.ROUTER.GO(/main-page))
