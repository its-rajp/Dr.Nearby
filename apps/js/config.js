// Defines the base URL for the API Gateway
const API_BASE_URL = 'http://localhost:5501/api';
// In production, replace this with your Ngrok or VPS URL
const SIGNALING_SERVER_URL = 'https://unruffled-unstoutly-keena.ngrok-free.dev';

// Free Public TURN Servers (OpenRelay Project)
// These are free for development use and don't require a card
const TURN_SERVER_URL = 'turn:openrelay.metered.ca:443';
const TURN_USERNAME = 'openrelayproject';
const TURN_CREDENTIAL = 'openrelayproject';

window.API_BASE_URL = API_BASE_URL;
window.SIGNALING_SERVER_URL = SIGNALING_SERVER_URL;
window.TURN_SERVER_URL = TURN_SERVER_URL;
window.TURN_USERNAME = TURN_USERNAME;
window.TURN_CREDENTIAL = TURN_CREDENTIAL;
