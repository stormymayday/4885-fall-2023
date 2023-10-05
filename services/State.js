const State = {
    isLoggedIn: false,
}

// Creating a Proxy that would broadcast changes
// First argument is the State
// Second argument is the Handler containing Traps
const proxyStore = new Proxy(State, {

    // Setting a trap for the 'set' method
    set(targetObject, propertyName, propertyValue) {

        // Validation can be added here

        // Assigning the value
        targetObject[propertyName] = propertyValue;

        // Checking if property is 'isLoggedIn'
        if (propertyName === 'isLoggedIn') {

            // Announcing that the isLoggedIn was changed
            window.dispatchEvent(new Event('user-login-change'));

        }

        // Important:
        // Must return 'true' if we are accepting the set
        // Otherwise, must return 'false'
        return true;

    }

});

// Exporting the proxyStory
// The original Store stays private
export default proxyStore;



















