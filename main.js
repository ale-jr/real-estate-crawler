import { getProperties, verifyProperty, logPropertyError } from "./services/property.js"
import { schedule } from "node-cron"
const verifyProperties = () => {
    console.log("start")
    getProperties()
        .then(properties => Promise.allSettled(
            properties.map(async property =>
                verifyProperty(property)
                    .catch((error) =>
                        logPropertyError(property.pageId, error)
                    )
            )))
        .catch(error => {
            console.error("verifyProperties", error)
        })
        .finally(() => {
            console.log("finished")
        })

}



verifyProperties()
schedule("0 */2 * * *", () => {
    verifyProperties()
})


