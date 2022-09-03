import * as cheerio from 'cheerio'
import axios from "axios"
import { launch } from "puppeteer"

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

const scrapAMFernandes = async (url) => {
    const browser = await launch()

    try {
        const page = await browser.newPage()
        await page.goto(url, { waitUntil: 'networkidle2' })
        const price = await page.evaluate(() => {
            const convertCurrency = (price = "") => +price.replace(/ |[a-zA-Z]|\$|\./g, "").replace(",", ".")

            let price = 0
           // console.log("heeey")
            document.querySelectorAll("#inside-portal p").forEach(el => {
                if (String(el.innerText).includes("R$")) {
                    price = convertCurrency(el.querySelector("span").innerText)
                }

            })
            return price
        })

        await browser.close()
        return {
            price,
            isAvailable: !!price
        }

        
    }
    catch (e) {
        browser.close()
        throw e
    }
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
}, {
    scrap: scrapAMFernandes,
    url: "amfernandes.com.br"
}]

export const scrap = (url = "") => {

    const scrapper = scrappers.find((scrapper) => url.includes(scrapper.url))
    if (scrapper)
        return scrapper.scrap(url)
    else
        throw new Error("Scrapper not found")
}


