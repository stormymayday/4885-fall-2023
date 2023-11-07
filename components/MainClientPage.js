import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon from "../src/images/marker-icon.png";
import markerIcon2x from "../src/images/marker-icon-2x.png";
import markerShadow from "../src/images/marker-shadow.png";
import Router from '../services/Router.js';
import { signOut } from 'firebase/auth';
import { auth, dataBase, storage } from '../services/firebase.js';
import {
	collection,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default class MainClientPage extends HTMLElement {
	constructor() {
		super();

		this.user = JSON.parse(localStorage.getItem('user'));

		this.map;

		this.activeCases = null;
	}

	async logOut() {
		await signOut(auth);

		app.router.go(`/login`);
	}

	displayMap = async () => {
		let downloadURL;

		navigator.geolocation.getCurrentPosition(
			async (position) => {
				// Succuss Callback Code:

				// Destructuring latitude and longitude from position.coords object
				const { latitude } = position.coords;
				const { longitude } = position.coords;
				const coordinates = [latitude, longitude];

				// Leaflet Code - Start
				// Rendering map centered on a current user location (coordinates) with max zoom-in setting
				this.map = L.map('map').setView(coordinates, 18);

				// Original Tile
				const originalTile =
					'https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png';

				// Mapbox Monochrome
				const monochrome = `https://api.mapbox.com/styles/v1/stormymayday/${import.meta.env.VITE_MAPBOX_STYLE}/tiles/256/{z}/{x}/{y}@2x?access_token=${import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}`;

				console.log(monochrome);

				// Tilelayer
				L.tileLayer(monochrome, {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
				L.marker(coordinates, { icon: leafletIcon })
					.addTo(this.map)
					.bindPopup(
						L.popup({
							autoClose: false,
							closeOnClick: false,
							className: 'running-popup',
						}),
					)
					.setPopupContent('You are currently here')
					.openPopup();

				try {
					await this.getActiveCases();
					this.activeCases.forEach((incidentCase) => {
						// console.log(incidentCase.id, ' => ', incidentCase.data());

						const { latitude, longitude } = incidentCase.data().coordinates;

						const coordinates = [latitude, longitude];

						downloadURL = incidentCase.data().image;

						let incidentMarker = {};

						incidentMarker = // .setPopupContent(incidentCase.data().notes)
							L.marker([latitude, longitude], { draggable: 'true' })
								.addTo(this.map)
								.bindPopup(
									L.popup({
										autoClose: false,
										closeOnClick: false,
										className: 'running-popup',
									}),
								).setPopupContent(`
              <div id="popup-form">

                <div id="img-container">
                  <img src="${incidentCase.data().image}" alt="${incidentCase.data().carMake
									}" height="150">
                </div>

                <form id="my-form">

                  <label for="file-input">Upload File:</label>
                  <input type="file" id="file-input" name="file-upload" accept="image/png, image/jpeg" /><br /><br />

                  <label for="address">Address:</label>
                  <input type="text" id="address" name="address" value="${incidentCase.data().address
									}" /><br />

                  <label for="carMake">Car Make:</label>
                  <input type="text" id="carMake" name="carMake" value="${incidentCase.data().carMake
									}" /><br />

                  <label for="carModel">Car Model:</label>
                  <input type="text" id="carModel" name="carModel" value="${incidentCase.data().carModel
									}" /><br />

                  <label for="carType">Car Type:</label>
                  <select id="carType" name="carType">
                    <option value="SUV">SUV</option>
                    <option value="Sedan">Sedan</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Convertible">Convertible</option>
                    <option value="Truck">Truck</option>
                  </select><br /><br />

                  <label for="carColor">Car Color:</label>
                  <input type="text" id="carColor" name="carColor" value="${incidentCase.data().carColor
									}" /><br />

                  <label for="licensePlate">License Plate:</label>
                  <input type="text" id="licensePlate" name="licensePlate" value="${incidentCase.data().licensePlate
									}" /><br />

                  <label for="notes">Notes:</label>
                  <textarea name="notes" id="notes" cols="30" rows="10">${incidentCase.data().notes
									}</textarea>
                  <button id="edit-btn">Edit</button>
                  <button id="cancel-btn">Cancel</button>
                </form>
              </div>
            `);
						// .openPopup();

						// Adding incident case id and incident data to the marker
						incidentMarker.customData = {
							id: incidentCase.id,
							...incidentCase.data(),
						};

						let newLatitude = incidentCase.data().coordinates.latitude;
						let newLongitude = incidentCase.data().coordinates.longitude;

						// Drag Marker functionality
						incidentMarker.on('dragend', function (event) {
							const newLatLng = event.target.getLatLng();
							newLatitude = newLatLng.lat;
							newLongitude = newLatLng.lng;

							// Update your data or perform actions with the new coordinates
							// console.log('New coordinates:', newLatitude, newLongitude);
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

										// console.log('File available at', downloadURL);
									});
								});
							}
						}

						incidentMarker.on('click', function () {
							document
								.querySelector('#file-input')
								.addEventListener('change', async (event) => {
									handleFileInput(document.querySelector('#file-input'));
								});

							// Adding click event listener to the Marker
							document
								.querySelector(`#edit-btn`)
								.addEventListener('click', async (event) => {
									event.preventDefault();

									// console.log(`You clicked Edit button`);

									// Getting input values
									const address = document.querySelector('#address').value;
									const carMake = document.querySelector('#carMake').value;
									const carModel = document.querySelector('#carModel').value;
									const carType = document.querySelector('#carType').value;
									const carColor = document.querySelector('#carColor').value;
									const licensePlate =
										document.querySelector('#licensePlate').value;
									const notes = document.querySelector('#notes').value;

									// Editing the Case
									const caseRef = doc(dataBase, 'cases', incidentCase.id);
									await updateDoc(caseRef, {
										address: address,
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

							// Adding click event listener to the 'Cancel' button
							document
								.querySelector(`#cancel-btn`)
								.addEventListener('click', async (event) => {
									event.preventDefault();

									// console.log(`You clicked Cancel button`);

									// Setting status to 'cancelled'
									const caseRef = doc(dataBase, 'cases', incidentCase.id);
									await updateDoc(caseRef, {
										status: 'cancelled',
									});

									Router.go('/main-page');
								});

							// console.log(this);
						});
					});
					this.renderActiveCases();
				} catch (error) {
					console.error(error);
				}
				// Leaflet Code - End
			},
			() => {
				// Error Callback Code:

				alert(
					`Unfortunately, TowTackle was not able to pick up your position.`,
				);
			},
		);
	};

	getActiveCases = async () => {
		const q = query(
			collection(dataBase, 'cases'),
			where('status', '==', 'active'),
			where('reporterId', '==', this.user.uid),
		);

		// console.log(this.user.uid);

		const querySnapshot = await getDocs(q);

		this.activeCases = querySnapshot;
	};

	renderActiveCases = () => {
		const myArr = [];

		this.activeCases.forEach((item) => {
			console.log(item.data());
			myArr.push(item.data());
		});

		const content = myArr.map((item) => {
			return item;
		});

		//     address
		// :
		// "sas"
		// carColor
		// :
		// "White"
		// carMake
		// :
		// "Toyota"
		// carModel
		// :
		// "Corolla"
		// carType
		// :
		// "Convertible"
		// completionTime
		// :
		// ""
		// coordinates
		// :
		// {longitude: -123.02649624176388, latitude: 49.23605882969377}
		// creationTime
		// :
		// _Timestamp {seconds: 1699125303, nanoseconds: 241000000}
		// driverID
		// :
		// ""
		// image
		// :
		// "https://firebasestorage.googleapis.com/v0/b/tow-tackle.appspot.com/o/1699125268464?alt=media&token=4d604f91-c472-4b04-a6ec-87f12c8abc2d"
		// licensePlate
		// :
		// "L55Z78"
		// notes
		// :
		// "TEST2"
		// reporterId
		// :
		// "hBBWJY8BCdUV76s6XCQTP7d7xgB2"
		// status
		// :
		// "active"

		console.log(content);
		document.getElementById('user-cases-display').innerHTML = '';
		content.forEach((element) => {
			console.log(element.address);
			document.getElementById('user-cases-display').innerHTML += `
			  <div class="view-case">
			  <div class="left-side-view-case">
			    <div class="img-container-case">
			      <img src="${element.image}" alt="">
			    </div>
			  </div>
			  <div class="right-side-view-case">
			    <p class="status-of-user-case">${element.status}</p>
			    <p class="info-user-case"> ${element.address}</p>
			    <p class="data-user-case">${element.creationTime}</p>
			    <div class="container-user-case-view-incident">
			      <p>VIEW INCIDENT<i class="right-icon-arrow-view-case"></i></p>
			    </div>
			  </div>
			</div>
			</div>`;
		});
	};

	connectedCallback() {
		// Getting template from the DOM
		const template = document.getElementById('main-client-page');

		// Cloning the template
		const content = template.content.cloneNode(true);

		// Appending content to the DOM
		this.appendChild(content);

		// const userObject = JSON.parse(localStorage.getItem("user"));
		// console.log(this.user);

		if (this.user) {
			this.querySelector(
				'h3',
			).innerHTML = `Welcome ${this.user.role} ${this.user.nameRegistration}`;

			// Testing if navigator.geolocation is supported by the browser
			if (navigator.geolocation) {
				this.displayMap();
			}
			// end of navigator / Leaflet
		}

		this.querySelector('#btn-click-report-incident').addEventListener(
			'click',
			() => {
				console.log('hahah');
				app.router.go('/report-incident');
			},
		);

		this.querySelector('#logout-btn').addEventListener('click', async () => {
			localStorage.clear();

			await this.logOut();
		});
	}
}

// Registering the login-page custom element
customElements.define('main-client-page', MainClientPage);
// TODO ADD LEAFLEET
// Side bar opens if you click on a pin(Delete or change a report)

// Fetch all incidents (Make available to see only thouse that the client has submmited)
// Drop down menu out of the photo on the right top corner(SETTINGS LOGOUT)
// Left top corner logo (LINK to te main page => APP.ROUTER.GO(/main-page))
