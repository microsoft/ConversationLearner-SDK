import * as express from 'express'
import * as http from 'http'
import * as blisUi from 'blis-ui'

export default function(): { app: express.Express; listener: http.Server } {
    console.log(`blis-ui directory path: `, blisUi.directoryPath)
    console.log(`blis-ui default file path: `, blisUi.defaultFilePath)

    const blisUiPort = parseInt(process.env.BLIS_UI_PORT) || 5050
    const app = express()
    app.use(express.static(blisUi.directoryPath)).use((req, res) => res.sendFile(blisUi.defaultFilePath))

    const listener = app.listen(blisUiPort, () =>
        console.log(`Navigate to http://localhost:${listener.address().port} to view BLIS administration application.`)
    )

    return {
        app,
        listener
    }
}
