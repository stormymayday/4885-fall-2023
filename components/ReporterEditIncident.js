import 'leaflet/dist/leaflet.css';
import L from "leaflet";
import 'leaflet-routing-machine';
import markerIcon from "../src/images/marker-icon.png";
import markerIcon2x from "../src/images/marker-icon-2x.png";
import markerShadow from "../src/images/marker-shadow.png";
import currentLocationIcon from "../src/current-location-marker.png";
import incidentSpotMarker from "../src/incident-spot-marker.png";
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import Router from "../services/Router.js";
import { signOut } from "firebase/auth";
import { auth, dataBase, storage } from '../services/firebase.js';
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default class ReporterEditIncident extends HTMLElement {

    constructor() {

        super();

        this.currentCase = null;

        this.user = JSON.parse(localStorage.getItem('user'));

        this.map;

        this.caseLatitude;
        this.caseLongitude;
        this.caseNotes;

    }

    getCurrentCaseFromLocalStorage() {

        if (JSON.parse(localStorage.getItem("currentCase"))) {

            this.currentCase = JSON.parse(localStorage.getItem("currentCase"));

            this.caseLatitude = this.currentCase.data.coordinates.latitude;
            this.caseLongitude = this.currentCase.data.coordinates.longitude;
            this.caseNotes = this.currentCase.data.notes;

            console.log(this.currentCase);

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

            // let leafletIcon = L.icon({
            //     iconUrl: markerIcon,
            //     iconRetinaUrl: markerIcon2x,
            //     iconSize: [25, 41],
            //     iconAnchor: [12, 41],
            //     popupAnchor: [1, -34],
            //     shadowUrl: markerShadow,
            //     // shadowRetinaUrl: 'marker-shadow-2x.png',
            //     shadowSize: [41, 41],
            //     shadowAnchor: [12, 41]
            // });

            let leafletIcon = L.icon({
                iconUrl: currentLocationIcon,
                iconRetinaUrl: currentLocationIcon,
                iconSize: [130, 130],
                iconAnchor: [65, 80],
                popupAnchor: [1, -34]
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

            // let leafletIcon = L.icon({
            //     iconUrl: markerIcon,
            //     iconRetinaUrl: markerIcon2x,
            //     iconSize: [25, 41],
            //     iconAnchor: [12, 41],
            //     popupAnchor: [1, -34],
            //     shadowUrl: markerShadow,
            //     // shadowRetinaUrl: 'marker-shadow-2x.png',
            //     shadowSize: [41, 41],
            //     shadowAnchor: [12, 41]
            // });

            let leafletIcon = L.icon({
                iconUrl: incidentSpotMarker,
                iconRetinaUrl: incidentSpotMarker,
                iconSize: [50, 82],
                iconAnchor: [24, 70],
                popupAnchor: [1, -34]
            });

            // Displaying Case marker
            this.incidentMarker = L.marker([this.caseLatitude, this.caseLongitude], { icon: leafletIcon, draggable: 'true' },).addTo(this.map)
                .bindPopup(
                    L.popup({
                        autoClose: false,
                        closeOnClick: false,
                        className: 'running-popup',
                    })
                )
                .setPopupContent(this.caseNotes);
            // .openPopup();

        } else {
            console.log(`map is not initialized`);
        }
    }

    renderCaseDetails() {

        console.log(this.currentCase);

        if (this.currentCase) {

            const { id } = this.currentCase;
            const { image, notes, carMake, carModel, carType, carColor, licensePlate } = this.currentCase.data;

            let downloadURL = image;
            let newLatitude = this.currentCase.data.coordinates.latitude;
            let newLongitude = this.currentCase.data.coordinates.longitude;

            // Drag Marker functionality
            this.incidentMarker.on('dragend', function (event) {
                const newLatLng = event.target.getLatLng();
                newLatitude = newLatLng.lat;
                newLongitude = newLatLng.lng;
                console.log(newLatitude);
                console.log(newLongitude);
            });

            this.querySelector(".info-section").innerHTML = `

            <div id="create-post">

                <div class="report-incident-arrows">
                    <div class="arrows">
                    <i id="back-btn" class="left-arrow-icon"></i>
                    </div>
                    <h3>Edit Incident</h3>
                </div>

                <div class="first-step-upload-picture">
                    <div id="img-container" class="img-container-for-upload-img">
                        <img src="${image}" alt="${carMake}">
                    </div>
                    <div class="upload-div-img">
                    <input type="file" id="file-input" name="file-upload" accept="image/png, image/jpeg" />
                    </div>
                    <h3>Upload images</h3>
                    <p>Drop Files Here click <span>browse</span> through your computer (Required JPEG, JPG, PNG)</p>
                </div>

                <form class="report-incident-form" id="incident-form">

                    <input type="text" id="carMake" name="carMake" placeholder="Car Make" value="${carMake}" />

                    <input type="text" id="carModel" name="carModel" placeholder="Car Model" value="${carModel}" />

                    <input type="text" id="licensePlate" name="licensePlate" placeholder="License Plate Number"  value="${licensePlate}" />

                    <div class="dropdown-form-side">
                    <select id="carType" name="carType">
                        <option value="SUV">SUV</option>
                        <option value="Sedan">Sedan</option>
                        <option value="Hatchback">Hatchback</option>
                        <option value="Convertible">Convertible</option>
                        <option value="Truck">Truck</option>
                    </select>

                    <input type="text" id="carColor" name="carColor" placeholder="Color" value="${carColor}" />

                    </div>

                    <textarea name="notes" id="notes" cols="30" rows="10" placeholder="Notes">${notes}</textarea>

                    <div class="btn-container">
                        <button id="cancel-btn" class="button-primary-simple-black cancel-btn">Cancel</button>
                        <button id="edit-btn" class="button-primary-simple-black complete-btn">Edit</button>
                    </div>
                    
                </form>
                </div>`
                ;

            this.querySelector('#carType').value = carType;

            this.querySelector('#back-btn').addEventListener('click', async (event) => {

                app.router.go(`/main-page`);

            });

            let fileName = new Date().getTime();

            function handleFileInput(input) {

                const selectedFile = input.files[0];

                if (selectedFile) {

                    const imageUrl = URL.createObjectURL(selectedFile);

                    const imgContainer = document.querySelector('#img-container');
                    imgContainer.innerHTML = '';

                    // Display the selected image (you can customize this part)
                    const imageElement = document.createElement('img');
                    imageElement.src = imageUrl;
                    imageElement.style.maxHeight = '150px';
                    imgContainer.appendChild(imageElement);

                    // console.log(selectedFile);

                    // Reset name here if you want to allow multiple uploads
                    // this.name = new Date().getTime();

                    // You can also upload the image to a server or process it further.
                    const storageRef = ref(storage, `${fileName}`);

                    // 'file' comes from the Blob or File API
                    uploadBytes(storageRef, selectedFile).then((snapshot) => {
                        getDownloadURL(snapshot.ref).then((url) => {
                            downloadURL = url;
                            console.log('File available at', downloadURL);
                        });
                    });
                }
            }

            document.querySelector('#file-input')
                .addEventListener('change', async (event) => {
                    handleFileInput(document.querySelector('#file-input'));
                });

            document.querySelector(`#edit-btn`)
                .addEventListener('click', async (event) => {
                    event.preventDefault();

                    // console.log(`You clicked Edit button`);

                    // Getting input values
                    // const address = document.querySelector('#address').value;
                    const carMake = document.querySelector('#carMake').value;
                    const carModel = document.querySelector('#carModel').value;
                    const carType = document.querySelector('#carType').value;
                    const carColor = document.querySelector('#carColor').value;
                    const licensePlate =
                        document.querySelector('#licensePlate').value;
                    const notes = document.querySelector('#notes').value;

                    // Editing the Case
                    const caseRef = doc(dataBase, 'cases', id);
                    await updateDoc(caseRef, {
                        // address: address,
                        carMake: carMake,
                        carModel: carModel,
                        carType: carType,
                        carColor: carColor,
                        licensePlate: licensePlate,
                        notes,
                        notes,
                        coordinates: {
                            latitude: newLatitude,
                            longitude: newLongitude,
                        },
                        image: downloadURL,
                    });

                    Router.go('/main-page');

                });

            document
                .querySelector(`#cancel-btn`)
                .addEventListener('click', async (event) => {
                    event.preventDefault();

                    // console.log(`You clicked Cancel button`);

                    // Setting status to 'cancelled'
                    const caseRef = doc(dataBase, 'cases', id);
                    await updateDoc(caseRef, {
                        status: 'cancelled',
                    });

                    Router.go('/main-page');
                });

        }

        // this.querySelector("#back-btn").addEventListener("click", async (event) => {

        //     Router.go(`/main-page`);

        // });


    }
    // renderCaseDetails - End

    async logOut() {

        await signOut(auth);

        Router.go(`/login`);

    }

    connectedCallback() {

        // Getting template from the DOM
        const template = document.getElementById('reporter-edit-incident-template');

        // Cloning the template
        const content = template.content.cloneNode(true);

        // Appending content to the DOM
        this.appendChild(content);

        const user = JSON.parse(localStorage.getItem('user'));
        const userRole = JSON.parse(localStorage.getItem('userRole'));

        if (user) {

            document.querySelector('#user-name').innerHTML = this.user.nameRegistration;
            document.querySelector('#user-email').innerHTML = this.user.email;

            this.getCurrentCaseFromLocalStorage();

            // This function kicks-off most displayMap, displayMarkers
            this.setDriverCoordinates();

        }

        // this.querySelector("#back-btn").addEventListener("click", async (event) => {

        //     Router.go('/main-page');

        // });

        this.querySelector("#logout-btn").addEventListener("click", async (event) => {

            localStorage.clear();

            await this.logOut();

        });

    }

}

customElements.define("reporter-edit-incident", ReporterEditIncident);