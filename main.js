import { getProperties, verifyProperty, logPropertyError } from "./services/property.js"

const verifyProperties = async () => {

    const properties = await getProperties()
    await Promise.allSettled(
        properties.map(async property =>
            verifyProperty(property)
                .catch((error) =>
                    logPropertyError(property.pageId, error)
                )
        ))
}

verifyProperties()
    .catch(error => {
        console.error("verifyProperties", error)
    })
    .finally(() => {
        console.log("finished")
    })