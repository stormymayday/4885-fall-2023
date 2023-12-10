import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase.js';
import {
	validateEmail,
	validatePassword,
	validateName,
	validateConfirmPassword,
} from '../services/validationFunctions.js';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { dataBase } from '../services/firebase.js';

export default class RegistrationPage extends HTMLElement {
	constructor() {
		// Testing master push
		super();
	}

	registration = async () => {

		// async () => {
		const passwordInput = document.querySelector(
			'#password-registration',
		).value;
		const emailInput = document.querySelector('#email-registration').value;
		const passwordConformation = document.querySelector(
			'#confirmPassword-registration',
		).value;
		const nameRegistration = document.querySelector('#name-registration').value;
		const role = document.querySelector('#role').value;

		if (
			validateEmail(emailInput) &&
			validatePassword(passwordInput) &&
			validateName(nameRegistration) &&
			validateConfirmPassword(passwordInput, passwordConformation)
		) {
			const userCredential = await createUserWithEmailAndPassword(
				auth,
				emailInput,
				passwordInput,
			);

			try {

				await setDoc(doc(dataBase, 'users', userCredential.user.uid), {
					emailInput,
					nameRegistration,
					role: role,
				});

				const userDocRef = doc(dataBase, 'users', userCredential.user.uid);
				const userDocSnapshot = await getDoc(userDocRef);
				const finale = userDocSnapshot.data();
				finale.uid = userCredential.user.uid;
				localStorage.setItem('user', JSON.stringify(finale));

				app.router.go('/registered');
			} catch (error) {
				console.error(error);
			}
		}
		if (!validateEmail(emailInput)) {
			console.log('email is not valide');
		}
		if (!validatePassword(passwordInput)) {
			console.log('Password is not valide');
		}
		if (
			validatePassword(passwordInput) &&
			!validateConfirmPassword(passwordInput, passwordConformation)
		) {
			console.log('conformation password is wrong');
		}
		if (!validateName(nameRegistration)) {
			console.log('Name is wrong');
		}
	};

	connectedCallback() {

		if (!navigator.onLine) {

			Router.go('/offline');

		}

		// Getting template from the DOM
		const template = document.getElementById('registration-page-template');

		// Cloning the template
		const content = template.content.cloneNode(true);

		// Appending content to the DOM
		this.appendChild(content);
		// leo

		this.querySelector('#register-btn').addEventListener('click', (event) => {
			event.preventDefault();
			this.registration();
		});

		this.querySelector('#login-btn-registration-page').addEventListener(
			'click',
			(event) => {
				app.router.go(`/login`);
			},
		);
	}
}

// Registering the registration-page custom element
customElements.define('registration-page', RegistrationPage);

console.log('leo');

// redo
