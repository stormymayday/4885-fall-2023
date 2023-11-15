import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import 'leaflet-routing-machine';
import markerIcon from "../src/images/marker-icon.png";
import markerIcon2x from "../src/images/marker-icon-2x.png";
import markerShadow from "../src/images/marker-shadow.png";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase } from "../services/firebase.js";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";

export default class DriverViewCasePage extends HTMLElement {

    constructor() {

        super();

        this.currentCase = null;

        this.map;

        this.driverMaker = {};
        this.incidentMarker = {};

        this.driverCoordinates;

        this.caseLatitude;
        this.caseLongitude;
        this.caseNotes;

        this.leafletRoutingControl;

        this.watchID;

    }

    getCurrentCaseFromLocalStorage() {

        if (JSON.parse(localStorage.getItem("currentCase"))) {

            this.currentCase = JSON.parse(localStorage.getItem("currentCase"));

            this.caseLatitude = this.currentCase.data.coordinates.latitude;
            this.caseLongitude = this.currentCase.data.coordinates.longitude;
            this.caseNotes = this.currentCase.data.notes;

        }

    }

    setDriverCoordinates() {

        navigator.geolocation.getCurrentPosition((position) => {

            // Succuss Callback Code:

            // Destructuring latitude and longitude from position.coords object
            const { latitude } = position.coords;
            const { longitude } = position.coords;

            this.driverCoordinates = [latitude, longitude];

            if (!this.map) {
                this.displayMap();
            }

            if (this.leafletRoutingControl) {
                this.map.removeControl(this.leafletRoutingControl);
            }

            this.setCurrentDriverPositionMarker();

            this.setCaseMarker();

            this.renderCaseDetails();


        }, () => {

            // Error Callback Code:
            alert(`Unfortunately, TowTackle was not able to pick up your position.`);

        });

    }

    displayMap() {

        // this.map = L.map('map').setView([this.driverLongitude, this.driverLatitude], 18);
        this.map = L.map('map').setView(this.driverCoordinates, 18);

        // Original Tile
        const originalTile = 'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

        // Mapbox Monochrome
        const monochrome = `https://api.mapbox.com/styles/v1/stormymayday/${import.meta.env.VITE_MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;

        // Tilelayer
        L.tileLayer(monochrome, {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.map);

    }

    setCurrentDriverPositionMarker() {

        if (this.map) {

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
            this.driverMaker = L.marker(this.driverCoordinates, { icon: leafletIcon }).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent('You are currently here')
                .openPopup();

        } else {
            console.log(`map is not initialized`);
        }

    }

    setCaseMarker() {

        if (this.map) {

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

            // Displaying Case marker
            this.incidentMarker = L.marker([this.caseLatitude, this.caseLongitude], { icon: leafletIcon }).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent(this.caseNotes)
                .openPopup();

        } else {
            console.log(`map is not initialized`);
        }
    }

    renderCaseDetails() {

        if (this.currentCase) {

            const { id } = this.currentCase;
            const { image, notes, carMake, carModel, carType, carColor, licensePlate, address, creationTime } = this.currentCase.data;
            const date = new Date(this.currentCase.data.creationTime.seconds * 1000);

            // Month name array
            const monthNames = [
                'January', 'February', 'March', 'April',
                'May', 'June', 'July', 'August',
                'September', 'October', 'November', 'December'
            ];

            // Get month, day, year, hour, and minute
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const year = date.getFullYear();
            let hour = date.getHours();
            const minute = date.getMinutes();
            const period = hour >= 12 ? 'PM' : 'AM';

            // Convert hour to 12-hour format
            hour = hour % 12 || 12;

            // Create the formatted date string
            const formattedDate = `${month} ${day}, ${year}, ${hour}:${minute.toLocaleString('en-US', { minimumIntegerDigits: 2 })} ${period}`;

            const directionsContainer = document.getElementById('directions-container');
            directionsContainer.innerHTML = '';

            this.querySelector(".case-container").innerHTML = `

            <div class="case-details-container">

                <div class="view-case-header">
                    <button id="back-btn"></button>
                    <p>Reported:</p>
                </div>

                <h3>${address}<h3>

                <div class="case-details-img-container">
                    <img src=${image} alt="" />
                </div>

                <div class="vehicle-details">

                    <h4>Vehicle Details:</h4>
                    <p class="gray-text">${formattedDate}</p>

                    <div>
                        <p class="gray-text">License Plate:</p>
                        <p>${licensePlate}</p>
                    </div>

                    <div>
                        <p class="gray-text">Vehicle Company:</p>
                        <p>${carMake}</p>
                    </div>

                    <div>
                        <p class="gray-text">Vehicle Type:</p>
                        <p>${carType}</p>
                    </div>

                    <div>
                        <p class="gray-text">Vehicle Model:</p>
                        <p>${carModel}</p>
                    </div>

                    <div>
                        <p class="gray-text">Vehicle Color:</p>
                        <p>${carColor}</p>
                    </div>

                    <div>
                        <p class="gray-text">Notes:</p>
                        <p>${notes}</p>
                    </div>
                
                </div>

            </div>
            <div class="btn-container">
                <button id="accept-case" class="button-primary-simple-black">Accept Case</button>
            </div>
            
        `;

        }

        this.querySelector("#back-btn").addEventListener("click", async (event) => {

            Router.go(`/main-page`);

        });

        this.querySelector("#accept-case").addEventListener("click", async (event) => {

            console.log('Accepting Case');

            // Changing status to 'in-progress'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'in-progress',

            });

            this.renderAcceptCaseUI();

        });

    }
    // renderCaseDetails - End

    renderAcceptCaseUI() {

        // Dynamic Driver Positioning
        this.watchID = navigator.geolocation.watchPosition((position) => {

            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            const accuracy = position.coords.accuracy;

            this.driverCoordinates = [latitude, longitude];

            console.log(`Changing Coordinates ===`);
            console.log(`Latitude: ${this.driverCoordinates[0]}`);
            console.log(`Longitude: ${this.driverCoordinates[1]}`);
            console.log(`========================`);


            // Start

            // Clearing Markers
            this.map.removeLayer(this.driverMaker);
            this.map.removeLayer(this.incidentMarker);

            // Clearing Routing Control
            if (this.leafletRoutingControl) {
                this.map.removeControl(this.leafletRoutingControl);
            }

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

            // Create a control and add it to the map
            this.leafletRoutingControl = L.Routing.control({
                waypoints: [
                    L.latLng(this.driverCoordinates[0], this.driverCoordinates[1]),
                    L.latLng(this.caseLatitude, this.caseLongitude)
                ],
                routeWhileDragging: true
            });

            this.leafletRoutingControl.addTo(this.map);

            // Listen for the "routesfound" event
            this.leafletRoutingControl.on('routesfound', (e) => {
                const routes = e.routes; // Get the array of routes
                if (routes.length > 0) {
                    // Extract and display directions data from the first route
                    const directions = routes[0].instructions;
                    displayDirections(directions, routes);
                }
            });

            function displayDirections(directions, routes) {

                const directionsContainer = document.getElementById('directions-container');
                directionsContainer.innerHTML = ''; // Clear previous directions

                // Current Street
                const currentStreet = `Current Street: ${routes[0].instructions[0].road}`;
                const currentStreetHeader = document.createElement('h4');
                currentStreetHeader.innerHTML = currentStreet;
                directionsContainer.appendChild(currentStreetHeader);

                // Destination Street
                const destinationStreet = `Destination Street: ${routes[0].instructions[routes[0].instructions.length - 1].road}`;
                const destinationStreetHeader = document.createElement('h4');
                destinationStreetHeader.innerHTML = destinationStreet;
                directionsContainer.appendChild(destinationStreetHeader);

                // Total Distance in km
                const totalDistance = `${(routes[0].summary.totalDistance / 1000).toFixed(2)} km`;
                const distanceHeader = document.createElement('h4');
                distanceHeader.innerHTML = totalDistance;
                directionsContainer.appendChild(distanceHeader);

                // Checking total distance
                if (routes[0].summary.totalDistance / 1000 > 0.01) {
                    document.getElementById("complete-case").disabled = true;
                } else {
                    document.getElementById("complete-case").disabled = false;
                }
                console.log(routes[0].summary.totalDistance / 1000);

                // console.log(document.getElementById("cancel-case"));

                // Total Time in mins
                const totalTime = `${Math.round(routes[0].summary.totalTime / 60)} min`;
                const totalTimeHeader = document.createElement('h4');
                totalTimeHeader.innerHTML = totalTime;
                directionsContainer.appendChild(totalTimeHeader);

                // Current Time
                let date = new Date();
                let hours = date.getHours();
                let minutes = date.getMinutes();
                let am_pm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12;
                minutes = minutes < 10 ? '0' + minutes : minutes;
                const currentTime = `${hours}:${minutes} ${am_pm}`;
                const currentTimeHeader = document.createElement('h4');
                currentTimeHeader.innerHTML = currentTime;
                directionsContainer.appendChild(currentTimeHeader);

                // Current Instruction
                const currentInstruction = `${routes[0].instructions[0].text} ${Math.round(routes[0].instructions[0].distance)} m`;
                const currentInstructionDiv = document.createElement('div');
                currentInstructionDiv.innerHTML = currentInstruction;
                directionsContainer.appendChild(currentInstructionDiv);

                // All Instructions (DO NOT DELETE)
                // directions.forEach((step, index) => {
                //     const instruction = step.text;
                //     const distance = step.distance;
                //     // With Index:
                //     // const formattedStep = `${index + 1}. ${instruction} ${Math.round(distance)} m`;
                //     // Without Index
                //     const formattedStep = `${instruction} ${Math.round(distance)} m`;
                //     const stepElement = document.createElement('div');
                //     stepElement.textContent = formattedStep;
                //     directionsContainer.appendChild(stepElement);

                //     // Log the step object to inspect its structure
                //     console.log(step);
                // });
            }

            // End


        }, (error) => {
            console.error(`Error getting geolocation: ${error.message}`);
        });


        this.querySelector(".case-container").innerHTML = `
            <button id="cancel-case">Cancel</button>
            <button id="complete-case">Complete</button>
        `;

        this.querySelector("#cancel-case").addEventListener("click", async (event) => {

            console.log('Cancelling Case');

            navigator.geolocation.clearWatch(this.watchID);

            // Changing case status to 'active'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'active',
            });

            this.setDriverCoordinates();

        });

        this.querySelector("#complete-case").addEventListener("click", async (event) => {

            // Should be conditionally disabled 
            // Based on distance

            // Some Popup 'Are you sure'?

            // Changing case status to 'complete'
            const caseRef = doc(dataBase, "cases", this.currentCase.id);
            await updateDoc(caseRef, {
                status: 'complete',

            });

            // Route to main page
            Router.go(`/main-page`);

        });

    }

    async logOut() {

        await signOut(auth);

        Router.go(`/login`);

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('driver-view-case-page-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        const user = JSON.parse(localStorage.getItem('user'));
        const userRole = JSON.parse(localStorage.getItem('userRole'));

        if (user) {

            // this.querySelector('h2').innerHTML = `Welcome ${user.email}`;
            // this.querySelector('h3').innerHTML = `Welcome ${userRole}`;
            this.querySelector('#user-name').innerHTML = user.nameRegistration;
            this.querySelector('#user-email').innerHTML = user.email;

            this.getCurrentCaseFromLocalStorage();

            // This function kicks-off most displayMap, displayMarkers
            this.setDriverCoordinates();

        }

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("driver-view-case-page", DriverViewCasePage);