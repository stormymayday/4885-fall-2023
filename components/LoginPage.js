import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, dataBase, appPath } from '../services/firebase.js';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import {
	validateEmail,
	validatePassword,
} from '../services/validationFunctions.js';

export default class LoginPage extends HTMLElement {
	constructor() {
		super();
	}

	async Login() {
		// **************************************** FIREBASE EMAIL AND PASSWORD VALIDATION */

		// Get user email and login

		const password = this.querySelector('#password-login').value;
		const email = this.querySelector('#username-email').value;

		try {
			const userCredential = await signInWithEmailAndPassword(
				auth,
				email,
				password,
			);
			const user = userCredential.user;
			const userUID = user.uid;

			const userDocRef = doc(dataBase, 'users', userUID);
			const userDocSnapshot = await getDoc(userDocRef);
			// const finale = userDocSnapshot.data();

			const finale = {
				uid: userUID,
				email: userDocSnapshot.data().emailInput,
				phoneNumber: userDocSnapshot.data().phoneNumber,
				nameRegistration: userDocSnapshot.data().nameRegistration,
				role: userDocSnapshot.data().role,
			};

			localStorage.setItem('user', JSON.stringify(finale));
			localStorage.setItem('userID', JSON.stringify(finale.uid));
			localStorage.setItem('userRole', JSON.stringify(finale.role));

			app.router.go('/main-page');
		} catch (error) {
			// track error and layout on the page
			const errorCode = error.code;
			const errorMessage = error.message;

			console.log(errorCode);
			console.log(errorMessage);

			if (
				errorCode === 'auth/invalid-login-credentials' ||
				errorMessage === 'Firebase: Error (auth/invalid-login-credentials).'
			) {
				document.querySelector(
					'span',
				).innerHTML = `Invalid login credentials, please try again`;
			} else {

				app.router.go('/offline-page');
				document.querySelector('span').innerHTML = `error message`;

			}
		}
	}
	connectedCallback() {
		// Getting template from the DOM
		const template = document.getElementById('login-page-template');

		// Cloning the template
		const content = template.content.cloneNode(true);

		// Appending content to the DOM
		this.appendChild(content);

		this.querySelector('#login-from').addEventListener('submit', (event) => {
			event.preventDefault();
			this.Login();
		});
		this.querySelector('#register-btn-login-page').addEventListener(
			'click',
			(event) => {
				event.preventDefault();

				app.router.go(`/registration`);
			},
		);

		// this.querySelector('#back-btn').addEventListener('click', (event) => {
		// 	event.preventDefault();
		// 	app.router.go('/');
		// });
	}
}
// Registering the login-page custom element
customElements.define('login-page', LoginPage);
