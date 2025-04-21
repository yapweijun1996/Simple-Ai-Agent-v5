/**
 * Main Application Module - Entry point for the application
 * Coordinates initialization of all other modules
 */
const App = (function() {
    'use strict';

    /**
     * Initializes the application
     */
    function init() {
        // Initialize UI controller
        UIController.init();
        
        // Load saved settings from cookie
        const savedSettings = Utils.getSettingsFromCookie() || {};
        
        // Initialize settings controller with saved settings
        SettingsController.init();
        
        // Initialize chat controller with settings
        ChatController.init(savedSettings);
        
        // Check for saved password
        checkPasswordOrPrompt();
    }

    /**
     * Checks for a saved password or prompts the user
     */
    function checkPasswordOrPrompt() {
        const savedPassword = Utils.getPasswordFromCookie();
        
        if (savedPassword) {
            doLogin(savedPassword);
        } else {
            promptForPassword();
        }
    }
    
    /**
     * Prompts the user for their API key password
     */
    function promptForPassword() {
        const password = prompt('Enter your API key password:');
        
        if (password) {
            doLogin(password);
        } else {
            alert('Password is required to use the application.');
            setTimeout(promptForPassword, 1000);
        }
    }
    
    /**
     * Attempts to login with the provided password
     * @param {string} password - The API key password
     */
    function doLogin(password) {
        const success = ApiService.init(password);
        
        if (success) {
            // Check if remember password is enabled
            const settings = ChatController.getSettings();
            if (settings.rememberPassword !== false) {
                Utils.savePasswordToCookie(password);
            }
        } else {
            alert('Invalid password. Please try again.');
            Utils.clearSavedPassword();
            promptForPassword();
        }
    }
    
    /**
     * Logs the user out by clearing saved credentials
     */
    function logOut() {
        Utils.clearSavedPassword();
        location.reload();
    }

    // Initialize the app when the DOM is ready
    window.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        init,
        logOut
    };
})();

// The app will auto-initialize when the DOM is loaded 