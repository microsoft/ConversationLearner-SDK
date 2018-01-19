import * as path from 'path'
import * as express from 'express'
import * as http from 'http'

export default function (): { app: express.Express, listener: http.Server } {
    const blisUiPort = parseInt(process.env.BLIS_UI_PORT) || 5050
    // TODO: Find better way to get path to index file from blis-ui package
    // We're directly accessing node modules which is brittle
    /**
     * import blisUi from 'blis-ui'
     * 
     * blisUi.directoryPath
     * blisUi.defaultFilePath
     */
    const blisUiPath = path.join(__dirname, '..', 'node_modules', 'blis-ui')
    const app = express()
    app.use(express.static(blisUiPath))
    .use((req, res) => res.sendFile(path.join(blisUiPath, 'index.html')))
    
    const listener = app.listen(blisUiPort, () => console.log(`Navigate to localhost:${listener.address().port} to view BLIS administration page.`))

    return {
        app,
        listener
    }
}

