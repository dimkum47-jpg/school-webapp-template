// Public Firebase web configuration. Do not place Gemini API secrets here.
export const config = {
  firebase: {
    apiKey: "AIzaSyCeYYNP1JQguAGvaqUjInWaTJ6SG7ZZXbE",
    authDomain: "school-webapp-2fe32.firebaseapp.com",
    projectId: "school-webapp-2fe32",
    storageBucket: "school-webapp-2fe32.firebasestorage.app",
    messagingSenderId: "633646557566",
    appId: "1:633646557566:web:a118e96de763c5b77deb2f",
    measurementId: "G-49L51BVLRG"
  },
  // Set after deploying the Cloudflare Worker. Keep Gemini API key in Worker secrets.
  workerUrl: "https://REPLACE_ME.workers.dev"
};
