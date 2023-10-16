import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import Router from '../services/Router.js';
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

export default class MainClientPage extends HTMLElement {

  constructor() {

    super();

    this.user = JSON.parse(localStorage.getItem("user"));

    this.map;

    this.activeCases = null;

  }

  async logOut() {

    await signOut(auth);

    app.router.go(`/login`);

  }

  displayMap = async () => {

    navigator.geolocation.getCurrentPosition(async (position) => {

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

        await this.getActiveCases();

        this.activeCases.forEach((incidentCase) => {

          console.log(incidentCase.id, " => ", incidentCase.data());

          const { latitude, longitude } = incidentCase.data().coordinates;

          const coordinates = [latitude, longitude];

          let incidentMarker = {};

          incidentMarker = L.marker([latitude, longitude], { draggable: 'true' }).addTo(this.map)
            .bindPopup(
              L.popup({
                autoClose: false,
                closeOnClick: false,
                className: 'running-popup',
              })
            )
            // .setPopupContent(incidentCase.data().notes)
            .setPopupContent(`
              <div id="popup-form">
                <form id="my-form">

                  <label for="address">Address:</label>
                  <input type="text" id="address" name="address" value="${incidentCase.data().address}" /><br />

                  <label for="carMake">Car Make:</label>
                  <input type="text" id="carMake" name="carMake" value="${incidentCase.data().carMake}" /><br />

                  <label for="carModel">Car Model:</label>
                  <input type="text" id="carModel" name="carModel" value="${incidentCase.data().carModel}" /><br />

                  <label for="carType">Car Type:</label>
                  <select id="carType" name="carType">
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Convertible">Convertible</option>
                    <option value="Truck">Truck</option>
                  </select><br /><br />

                  <label for="carColor">Car Color:</label>
                  <input type="text" id="carColor" name="carColor" value="${incidentCase.data().carColor}" /><br />

                  <label for="licensePlate">License Plate:</label>
                  <input type="text" id="licensePlate" name="licensePlate" value="${incidentCase.data().licensePlate}" /><br />

                  <label for="notes">Notes:</label>
                  <textarea name="notes" id="notes" cols="30" rows="10">${incidentCase.data().notes}</textarea>
                  <button id="edit-btn">Edit</button>
                  <button id="cancel-btn">Cancel</button>
                </form>
              </div>
            `);
          // .openPopup();

          // Adding incident case id and incident data to the marker
          incidentMarker.customData = { id: incidentCase.id, ...incidentCase.data() };

          // Drag Marker functionality
          incidentMarker.on('dragend', function (event) {
            const newLatLng = event.target.getLatLng();
            const newLatitude = newLatLng.lat;
            const newLongitude = newLatLng.lng;

            // Update your data or perform actions with the new coordinates
            console.log('New coordinates:', newLatitude, newLongitude);
          });


          incidentMarker.on('click', function () {

            // Adding click event listener to the Marker
            document.querySelector(`#edit-btn`).addEventListener('click', async (event) => {

              event.preventDefault();

              console.log(`You clicked Edit button`);

              // Getting input values
              const address = document.querySelector('#address').value;
              const carMake = document.querySelector('#carMake').value;
              const carModel = document.querySelector('#carModel').value;
              const carType = document.querySelector('#carType').value;
              const carColor = document.querySelector('#carColor').value;
              const licensePlate = document.querySelector('#licensePlate').value;
              const notes = document.querySelector('#notes').value;

              // Editing the Case
              const caseRef = doc(dataBase, "cases", incidentCase.id);
              await updateDoc(caseRef, {
                address: address,
                carMake: carMake,
                carModel: carModel,
                carType: carType,
                carColor: carColor,
                licensePlate: licensePlate,
                notes, notes,
              });

            });

            // Adding click event listener to the 'Cancel' button
            document.querySelector(`#cancel-btn`).addEventListener('click', async (event) => {

              event.preventDefault();

              console.log(`You clicked Cancel button`);

              // Setting status to 'cancelled'
              const caseRef = doc(dataBase, "cases", incidentCase.id);
              await updateDoc(caseRef, {
                address: 'cancelled',

              });

              Router.go('/main-page');

            });

            console.log(this);

          });

        });

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

    console.log(this.user.uid);

    const querySnapshot = await getDocs(q);

    this.activeCases = querySnapshot;

    // console.log(this.activeCases);

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
