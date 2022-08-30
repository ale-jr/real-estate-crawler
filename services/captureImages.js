import { launch } from "puppeteer"
import Path from 'path'
import Fs from "fs"
import axios from "axios"
import { uploadFolder } from "./googleDrive.js"


const clickWithDelay = (selector, page, remaining) => new Promise((resolve) => {
    page.click(selector).then(() => {
        if (remaining < 1) {
            return resolve()
        }
        setTimeout(() => {
            resolve(clickWithDelay(selector, page, remaining - 1))
        }, 100)
    })
}
)

const downloadImage = (src, folder, key) => new Promise((resolve, reject) => {
    const extension = Path.extname(src)
    const path = Path.resolve(folder, `${key}${extension}`)

    axios.get(src, {
        responseType: 'stream',
        headers: {
            ["User-Agent"]: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36"
        }
    })
        .then((response) => {
            const writer = response.data.pipe(Fs.createWriteStream(path))

            writer.on('finish', resolve)
            writer.on('error', reject)
        })
        .catch(reject)


})

const downloadImages = (images, captureFolder) =>
    Promise.all(images.map((image, index) => downloadImage(image, captureFolder, index))).catch(error => console.error(error))


const simpleCapture = async (url, captureFolder) => {
    const browser = await launch()
    const page = await browser.newPage()
    try {
        Fs.mkdirSync(captureFolder)
        await page.setViewport({
            height: 1440,
            width: 1440
        })
        await page.goto(url, { waitUntil: 'networkidle0' })
        await page.screenshot({
            path: Path.resolve(captureFolder, "screenshot.jpg")
        })
    }
    catch (error) {
        browser.close()
    }
    return { browser, page }
}

const captureVivaRealImages = async (url, captureFolder) => {
    const { browser, page } = await simpleCapture(url, captureFolder)
    try {
        await page.click("li[data-index='0']")
        await page.waitForNetworkIdle()
        const imageCount = await page.evaluate(() => document.querySelectorAll(".fullscreen-gallery__carousel .carousel__container li img").length)
        await clickWithDelay('.fullscreen-gallery__carousel .carousel__next.js-carousel-next', page, imageCount)
        const images = await page.evaluate(() => {
            const imagesSources = []
            const tags = document.querySelectorAll(".fullscreen-gallery__carousel .carousel__container li img")
            tags.forEach(tag => imagesSources.push(tag.src))
            return imagesSources
        })
        await downloadImages(images, captureFolder)
        await browser.close()
    }
    catch (e) {
        console.error(e)
        browser.close()
    }

}


const captureCasaMineiraImages = async (url, captureFolder) => {
    const { browser, page } = await simpleCapture(url, captureFolder)
    try {
        await page.click("#new-gallery-portal a[id='1']")
        await page.waitForNetworkIdle()

        const getImageUrls = (images = [], lastSrc) => new Promise(async resolve => {
            const src = await page.evaluate(() => document.querySelector("[data-name='ImageWrapper'] img").src)
            const allImages = [...images, src]
            if (src != lastSrc) {
                setTimeout(() => {
                    resolve(
                        page.keyboard.press("ArrowRight")
                            .then(() => getImageUrls(allImages, src))
                    )
                }, 100)
            }
            else {

                resolve(images)
            }
        })

        const images = await getImageUrls()
        await downloadImages(images, captureFolder)
        browser.close()
    }
    catch (e) {
        console.error(e)
        browser.close()
    }
}


const platforms = [{
    capture: captureVivaRealImages,
    domain: "vivareal.com.br"
}, {
    capture: captureCasaMineiraImages,
    domain: "casamineira.com.br"
}]



export const captureImages = async (url, property) => {
    const folderName = `${property.name}_${property.size}_${property.floor}_${property.seller}`.replace(/\s+/g, '_').toLowerCase()
    const captureFolder = Path.resolve("prints", `${Date.now()}_${folderName}`)
    const capture = platforms.find((platform) => url.includes(platform.domain))
    if (capture && property.isAvailable) { await capture.capture(url, captureFolder) }
    else {
        const { browser } = await simpleCapture(url, captureFolder)
        browser.close()
    }
    const driveLink = await uploadFolder(captureFolder)
    return driveLink
}
