import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import markerIcon from "../src/images/marker-icon.png";
import markerIcon2x from "../src/images/marker-icon-2x.png";
import markerShadow from "../src/images/marker-shadow.png";
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export default class DriverDashboardPage extends HTMLElement {

    constructor() {

        super();

        this.activeCases = [];

        this.map;

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

            // Original Tile
            const originalTile = 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

            // Tilelayer
            L.tileLayer(`https://api.mapbox.com/styles/v1/stormymayday/${import.meta.env.VITE_MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`, {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.map);

            let leafletIcon = L.icon({
                iconUrl: markerIcon,
                iconRetinaUrl: markerIcon2x,
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowUrl: markerShadow,
                // shadowRetinaUrl: 'marker-shadow-2x.png',
                shadowSize: [41, 41],
                shadowAnchor: [12, 41]
            });

            // Displaying a Marker with current user coordinates
            L.marker(coordinates, { icon: leafletIcon }).addTo(this.map)
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

                this.renderCaseCards();

                this.renderMarkers();

            } catch (error) {

                console.error(error);

            }
            // Leaflet Code - End

        }, () => {

            // Error Callback Code:

            alert(`Unfortunately, TowTackle was not able to pick up your position.`);

        });

    }

    renderMarkers() {

        if (this.activeCases.length > 0) {

            this.activeCases.forEach((activeCase) => {

                console.log(activeCase);

                const { latitude, longitude } = activeCase.data.coordinates;

                let incidentMarker = {};

                let leafletIcon = L.icon({
                    iconUrl: markerIcon,
                    iconRetinaUrl: markerIcon2x,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34],
                    shadowUrl: markerShadow,
                    // shadowRetinaUrl: 'marker-shadow-2x.png',
                    shadowSize: [41, 41],
                    shadowAnchor: [12, 41]
                });

                // Creating Markers on the Map
                incidentMarker = L.marker([latitude, longitude], { icon: leafletIcon }).addTo(this.map)
                    .bindPopup(
                        L.popup({
                            autoClose: false,
                            closeOnClick: false,
                            className: 'running-popup',
                        })
                    )
                    .setPopupContent(activeCase.data.notes)
                    .openPopup();

            });

        } else {

            console.log(`There are no active cases`);

        }

    }
    // end of renderMarkers

    myFunction(id) {
        document.getElementById("id").innerHTML = "YOU CLICKED ME!";
    }

    renderCaseCards() {

        if (this.activeCases.length > 0) {

            const content = this.activeCases.map((activeCase) => {

                const id = activeCase.id;
                const { image, notes } = activeCase.data;
                const date = new Date(activeCase.data.creationTime.seconds * 1000);

                return `
                    <div class="case-item" style="display:flex; padding: 2rem">
                        <div class="case-img-container">
                            <img src=${image} alt="" style="width:150px" />
                        </div>
                        <div class="case-info">
                            <h3>${notes}</h3>
                            <p>${date}</p>
                            <button id=${id} class="case-btn">view incident</button>
                        </div>
                    </div>
                `;


            }).join('');

            this.querySelector('.case-container').innerHTML = content;

            // Selecting all 'View Incident' buttons and attaching an event listener
            const viewCaseButtons = this.querySelectorAll('.case-btn');

            viewCaseButtons.forEach(caseButton => {

                caseButton.addEventListener('click', () => {

                    console.log(`You clicked on a case button with an id of ${caseButton.id}`);

                    // Setting Local Storage here
                    const storedCases = JSON.parse(localStorage.getItem("activeCases"));
                    const filteredCase = storedCases.filter((item) => {

                        return caseButton.id == item.id;

                    });
                    localStorage.setItem("currentCase", JSON.stringify(filteredCase[0]));

                    Router.go('/case');

                });

            });



        } else {

            console.log(`There are no active cases`);

        }


    }
    // end of renderCaseCards

    async getActiveCases() {

        const user = JSON.parse(localStorage.getItem('user'));

        const q = query(collection(dataBase, "cases"), where("status", "==", 'active'));

        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc) => {

            // doc.data() is never undefined for query doc snapshots
            // console.log(doc.id, " => ", doc.data());

            let activeCase = {

                id: doc.id,
                data: doc.data()

            };

            this.activeCases.push(activeCase);

            const { latitude, longitude } = doc.data().coordinates;

            const coordinates = [latitude, longitude];

            localStorage.setItem("activeCases", JSON.stringify(this.activeCases));

            // let incidentMarker = {};

            // Creating Markers on the Map
            // incidentMarker = L.marker([latitude, longitude]).addTo(this.map)
            //     .bindPopup(
            //         L.popup({
            //             autoClose: false,
            //             closeOnClick: false,
            //             className: 'running-popup',
            //         })
            //     )
            //     .setPopupContent(doc.data().notes)
            //     .openPopup();

        });

    }

    async logOut() {

        await signOut(auth);

        Router.go(`/login`);

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('driver-dashboard-page-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        const user = JSON.parse(localStorage.getItem('user'));
        const userRole = JSON.parse(localStorage.getItem('userRole'));

        if (user) {

            this.querySelector('h2').innerHTML = `Welcome ${user.email}`;
            this.querySelector('h3').innerHTML = `Welcome ${userRole}`;

            // Testing if navigator.geolocation is supported by the browser
            if (navigator.geolocation) {

                this.displayMap();

            }
            // end of navigator / Leaflet

        }

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("driver-dashboard-page", DriverDashboardPage);