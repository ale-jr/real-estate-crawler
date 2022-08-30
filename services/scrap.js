import * as cheerio from 'cheerio'
import axios from "axios"

const convertCurrency = (price = "") => +price.replace(/ |[a-zA-Z]|\$|\./g, "").replace(",", ".")



const scrapVivaReal = async (url) => {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data);

    const price = convertCurrency($(".price__price-info").text())
    const isAvailable = $(".inactive-udp__alert").length < 1


    return {
        price, isAvailable
    }

}

const scrapZap = async (url) => {

    const { data } = await axios.get(url)
    const $ = cheerio.load(data);

    const price = convertCurrency($(".price__item--main").text())
    const isAvailable = price > 0

    return { price, isAvailable }
}

const scrapCasaMineira = async (url) => {

    const { data } = await axios.get(url)
    const $ = cheerio.load(data);



    const price = convertCurrency($(".price-items").text())
    const isAvailable = $(".offline-content").length < 1


    return { price, isAvailable }
}


const scrappers = [{
    scrap: scrapVivaReal,
    url: "vivareal.com.br"
}, {
    scrap: scrapZap,
    url: "zapimoveis.com.br"
}, {
    scrap: scrapCasaMineira,
    url: "casamineira.com.br"
}]

export const scrap = (url = "") => {

    const scrapper = scrappers.find((scrapper) => url.includes(scrapper.url))
    if (scrapper)
        return scrapper.scrap(url)
    else
        throw new Error("Scrapper not found")
}


