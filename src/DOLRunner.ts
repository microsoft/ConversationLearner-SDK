import * as directline from "offline-directline";
import * as express from 'express';
 
export function InitDOLRunner() {
    console.log('Starting DOL...'); 
    const app = express();
    directline.initializeRoutes(app, "http://127.0.0.1:3000", "http://127.0.0.1:3978/api/messages");
}