import { NOTION } from "../constants.js"
import { getDatabaseResults, updateDatabaseProperties, appendChildrenToPage } from './notion.js'
import { scrap } from "./scrap.js"
import { notifyPropertyAvailable, notifyPropertyPriceChange, notifyPropertyUnavailable } from './notification.js'
import currency from "currency.js"
import { captureImages } from "./captureImages.js"

const propertyFields = NOTION.fields

export const getProperties = () => getDatabaseResults().then((results = []) =>
    results.filter(result => result.properties[propertyFields.archived]?.select?.name != "Sim")
        .map(result => ({
            pageId: result.id,
            url: result.properties[propertyFields.url].url,
            price: result.properties[propertyFields.price].number,
            initialPrice: result.properties[propertyFields.initialPrice].number,
            name: result.properties[propertyFields.name]?.title[0]?.plain_text,
            location: result.properties[propertyFields.location].select?.name,
            size: result.properties[propertyFields.size].select?.name,
            floor: result.properties[propertyFields.floor].select?.name,
            seller: result.properties[propertyFields.seller].select?.name,
            isAvailable: result.properties[propertyFields.isAvailable].select?.name === "Sim",
            tendency: result.properties[propertyFields.tendency].select?.name
        }))
)


const getTendency = ({ lastPrice, price, isAvailable, lastTendency }) => {
    if (!isAvailable) return lastTendency

    let tendency = 'stable'
    if (lastPrice && price > lastPrice) tendency = 'up'
    else if (lastPrice && price < lastPrice) tendency = 'down'
    return tendency
}

const TENDENCIES = {
    up: "Subiu",
    down: "Abaixou",
    stable: "Manteve"
}

export const verifyProperty = async (property) => {

    const { url, price: lastPrice, isAvailable: lastAvailabilityStatus, tendency: lastTendency, initialPrice } = property

    const { isAvailable, price } = await scrap(url)


    const tendency = getTendency({ lastPrice, price, isAvailable, lastTendency })

    const updatedProperty = ({
        ...property,
        initialPrice: initialPrice || price,
        lastPrice,
        price: price || lastPrice,
        isAvailable,
        tendency
    })

    if ((lastPrice != price && price > 0) || isAvailable != lastAvailabilityStatus) {
        console.log({ lastPrice, price, isAvailable, lastAvailabilityStatus })
        await updatePropertyPriceAndAvailability(updatedProperty)
    }
    if (price != lastPrice && isAvailable) await notifyPropertyPriceChange(updatedProperty)

    if (lastAvailabilityStatus != isAvailable && isAvailable) await notifyPropertyAvailable(updatedProperty)
    else if (lastAvailabilityStatus != isAvailable && !isAvailable) await notifyPropertyUnavailable(updatedProperty)

}

const updatePropertyPriceAndAvailability = async (property) => {
    const { pageId, price, initialPrice, isAvailable, tendency, lastPrice, url } = property
    const date = new Date()
    date.setHours(date.getHours() - 3)

    const imagesLink = await captureImages(url, property)
    
    await updateDatabaseProperties({
        pageId,
        properties: {
            [propertyFields.updatedAt]: {
                type: "date",
                date: {
                    start: date.toISOString(),
                    time_zone: "America/Sao_Paulo"
                }
            },
            [propertyFields.price]: {
                type: "number",
                number: price > 0 ? price : lastPrice
            },
            [propertyFields.initialPrice]: {
                type: "number",
                number: initialPrice
            },
            [propertyFields.isAvailable]: {
                type: "select",
                select: {
                    name: isAvailable ? "Sim" : "Não"
                }
            },
            [propertyFields.tendency]: {
                type: "select",
                select: {
                    name: TENDENCIES[tendency] || tendency
                }
            }
        }
    })

    const children = [{
        type: "bulleted_list_item",
        bulleted_list_item: {
            rich_text: [{
                text: {
                    content: `Preço: ${currency(price, { symbol: "R$", separator: ".", decimal: "," }).format()}`
                }
            }]
        }
    }, {
        type: "bulleted_list_item",
        bulleted_list_item: {
            rich_text: [{
                text: {
                    content: `Disponível: ${isAvailable ? "Sim" : "Não"}`
                }
            }]
        }
    },
    {
        type: "bulleted_list_item",
        bulleted_list_item: {
            rich_text: [{
                text: {
                    content: `Imagens: ${imagesLink}`
                }
            }]
        }
    }]

    await appendChildrenToPage(pageId, [{
        type: "paragraph",
        paragraph: {
            rich_text: [{
                text: {
                    content: `[UPDATE]: ${new Date().toLocaleString()}`
                }
            }],
            children
        },
    },
    {
        type: "paragraph",
        paragraph: {
            rich_text: [{
                text: {
                    content: ""
                }
            }]
        }
    }])

}

export const logPropertyError = (pageId, error) => {
    return appendChildrenToPage(pageId, [
        {
            type: "paragraph",
            paragraph: {
                rich_text: [{
                    text: {
                        content: `[Error] ${new Date().toLocaleString()}`
                    }
                }],
                children: [
                    {
                        type: "code",
                        code: {
                            rich_text: [{
                                text: {
                                    content: JSON.stringify({ error })
                                }
                            }],
                            language: 'json'
                        }
                    }
                ]
            },
        },
        {
            type: "paragraph",
            paragraph: {
                rich_text: [{
                    text: {
                        content: " "
                    }
                }]
            }
        }
    ])
}
