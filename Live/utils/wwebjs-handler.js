const path = require('path');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { EventEmitter } = require('events');

// Increase the default max listeners for EventEmitter
EventEmitter.defaultMaxListeners = 15;

const sessionFolder = path.join(__dirname, 'my_custom_session_folder'); // Set your session folder

if (!fs.existsSync(sessionFolder)) {
    fs.mkdirSync(sessionFolder, { recursive: true }); // Ensure session folder exists
}

let clientInitialized = false;
let client; // Declare client variable globally

const initializeClient = () => {
    if (clientInitialized) return; // Prevent multiple initializations

    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: sessionFolder, // Set the folder where session files will be saved
        }),
        puppeteer: { 
            headless: false, // Set to true if you want to run in headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
        }
    });

    client.on('qr', (qr) => {
        console.log('QR Code received, scan it to authenticate:', qr);
        const qrFilePath = path.join(sessionFolder, `qr-code-${Date.now()}.txt`);
        fs.writeFileSync(qrFilePath, qr);
        console.log(`QR Code saved to file: ${qrFilePath}`);

        // Set a timeout to handle QR expiration
        setTimeout(() => {
            if (!client.info || !client.info.wid) {
                console.log('QR code expired, trying again...');
                client.initialize(); // Reinitialize if not connected
            }
        }, 60000); // 60 seconds timeout
    });

    client.on('ready', () => {
        console.log('Client is ready!');
        clientInitialized = true; // Mark client as initialized
    });

    // client.on('disconnected', (reason) => {
    //     console.log('Client was logged out:', reason);
    //     clientInitialized = false; // Reset the client state
    //     initializeClient(); // Reinitialize the client on disconnect
    // });

    client.initialize().catch((error) => {
        console.error('Error initializing client:', error); // Handle any initialization error
    });
};

const sendWhatsAppMessage = async (number, message) => {
    // Initialize the client if it hasn't been done yet
    if (!clientInitialized) {
        initializeClient();
    }

    // Wait until the client is ready
    await new Promise((resolve) => {
        const checkClientReady = setInterval(() => {
            if (clientInitialized) {
                clearInterval(checkClientReady);
                resolve();
            }
        }, 100); // Check every 100 milliseconds
    });

    // Send the message once the client is ready
    try {
        await client.sendMessage(number, message);
        console.log(`Message sent to ${number}`);
    } catch (error) {
        console.error(`Failed to send message to ${number}:`, error);
    }
};

module.exports = {
    sendWhatsAppMessage,
    initializeClient // Export the initialize function for use
};
