import { sentFormattedMessage } from "./telegram.js"
import currency from "currency.js"

const formatPropertyName = (property) => {
    const nickname = String(property.name).toLowerCase() != String(property.location).toLocaleLowerCase() ? property.name : property.location
    return `${nickname} de ${property.size} no ${property.floor}`
}

const formatMoney = (money) => currency(money, { symbol: "R$", separator: "\\.", decimal: "," }).format()

const formatLink = property => `[${property.seller}](${property.url})`

export const notifyPropertyUnavailable = (property) => {
    const message = `
*${formatPropertyName(property)} ficou indisponível 😟*
${formatLink(property)}
`

    return sentFormattedMessage(message)
}

export const notifyPropertyAvailable = (property) => {
    const message = `
*${formatPropertyName(property)} ficou disponível novamente 😄*
${formatLink(property)}
`
    return sentFormattedMessage(message)
}

const TENDENCIES = {
    up: "subiu",
    down: "abaixou",
    stable: "manteve"
}

export const notifyPropertyPriceChange = (property) => {
    const message = `
*${formatPropertyName(property)} ${TENDENCIES[property.tendency]} o preço 👀*
Incial: ${formatMoney(property.initialPrice)}
Anterior: ${formatMoney(property.lastPrice)}
Atual: ${formatMoney(property.price)}
${formatLink(property)}
`
    return sentFormattedMessage(message)
}