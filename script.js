// script.js (Updated)

// Import initialization functions for different parts of the application
// Make sure these paths are correct and the files exist.
import { initMenuPage } from './views/MenuPage.js';
// import { initCheckoutPage } from './views/CheckoutPage.js'; // Uncomment if you have this file
// import { initOrderHistoryPage } from './views/OrderHistoryPage.js'; // Uncomment if you have this file

/**
 * Main function to initialize the application after the DOM is fully loaded.
 */
async function main() {
    // Initialize the menu page functionality (e.g., category tabs, loading menu items)
    // If initMenuPage involves asynchronous operations (like fetching data), it can be awaited.
    if (typeof initMenuPage === 'function') {
        try {
            await initMenuPage();
            console.log('MenuPage initialized.');
        } catch (error) {
            console.error('Error initializing MenuPage:', error);
        }
    } else {
        console.warn('initMenuPage function not found or not imported correctly.');
    }

    // Initialize checkout page functionality (if applicable)
    // if (typeof initCheckoutPage === 'function') {
    //     try {
    //         initCheckoutPage();
    //         console.log('CheckoutPage initialized.');
    //     } catch (error) {
    //         console.error('Error initializing CheckoutPage:', error);
    //     }
    // }

    // Initialize order history page functionality (if applicable)
    // if (typeof initOrderHistoryPage === 'function') {
    //     try {
    //         initOrderHistoryPage();
    //         console.log('OrderHistoryPage initialized.');
    //     } catch (error) {
    //         console.error('Error initializing OrderHistoryPage:', error);
    //     }
    // }

    // Add any other global initializations here
    console.log('Application main initialization complete.');
}

// Wait for the DOM to be fully loaded before running the main initialization logic
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
} else {
    // DOMContentLoaded has already fired
    main();
}
