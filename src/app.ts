const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker')
const fs = require('fs');
const download = require('image-downloader')
const sanitize = require("sanitize-filename");

let rootDir = './houses';

puppeteer.use(AdblockerPlugin())

puppeteer.use(StealthPlugin())

const base_url = 'https://www.domain.com.au'

const params = {
    "area": ["thornbury-vic-3071"],
}

const queries = {
    "ptype": "apartment-unit-flat,block-of-units,duplex,free-standing,new-apartments,new-home-designs,new-house-land,pent-house,semi-detached,studio,terrace,town-house,villa",
    "bedrooms": "2-any",
    "bathrooms": "any",
    "price": "300-650",
    "excludedeposittaken": "0",
    "establishedtype": "any",
    "carspaces": "1-any",
    "features": "gardencourtyard"
}

const getFullDir = (dir: string[]) => {
    return rootDir + "/" + dir.map(direc =>
        sanitize(direc.replace("/", "_")))
        .join("/")
        .replace(/\s/g, "_")
}

const makeDir = (dir?: string) => {
    dir = dir ? getFullDir([dir]) : rootDir
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

const downloadImage = (url: string, dir: string, name: string) => {
    const options = {
        url: url,
        dest: getFullDir([dir, name])+'.jpg'   // will be saved to /path/to/dest/photo.jpg
      }

      download.image(options)
        .catch((err) => console.error(err))
}

const writeJson = (name: string, json: string) => {
    name = getFullDir([name, name])
    fs.writeFile(name + '.json', json, 'utf8', (err) => {
        if (err) throw err;
        });
}

const buildUrl = () => {
    const suburbs = params["area"].length > 1 ?
    "?suburb=" + params["area"].join(",") + "&" :
    params["area"] + "/?"
    return (
        base_url + "/" +
        "rent" + "/" +
        suburbs +
        Object.entries(queries).map(
            ([key, value]) => {
                if (!["0", "any"].includes(value))
                    return `${key}=${value}`
                else
                    return ''
            }).join('&')
        )
}


interface Feature {
    type: string,
    amount: string,
}

interface HouseDetails {
    price: string,
    address: string,
    features: Array<Feature>
    houseType: string,
    amenities: Array<string>,
}

interface House {
    details: HouseDetails,
    photos: Array<string>
}



puppeteer.launch({ headless: true }).then(async browser => {
    makeDir()
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    }
    const houseData = (link: string, houseObject: House) => new Promise(async(resolve, reject) => {
        const newPage = await browser.newPage()
        console.log("Loading house")
        await newPage.goto(link);
        await newPage.waitForSelector('.listing-details__root');
        console.log("Loaded house")
        houseObject.details.price = await newPage.$eval('[data-testid="listing-details__summary-title"]', text => text.innerText)
        houseObject.details.address = await newPage.$eval('.css-164r41r', text => text.innerText)
        houseObject.details.features = await newPage.$$eval(
            '[data-testid="listing-details__summary-left-column"] > \
            [data-testid="property-features"] > \
            [data-testid="property-features-wrapper"] > \
            [data-testid="property-features-feature"] > \
            [data-testid="property-features-text-container"]',
            features => features.map(feature => {
                const featureObj = {} as Feature
                featureObj.amount = feature.innerText
                featureObj.type = feature.firstChild.innerText
                return featureObj
            })
        )
        houseObject.details.houseType = await newPage.$eval('[data-testid="listing-summary-property-type"]', text => text.innerText)
        houseObject.details.amenities = await newPage.$$eval(
            '[data-testid="listing-details__additional-features-listing"]',
            amenities => amenities.map(amenity => {
                return amenity.innerText
            })
        )
        houseObject.photos = await newPage.$$eval(
            '.css-1rnnotm > img',
            photos => photos.map(photo => {
                return photo.src
            })
        )
        resolve(houseObject);
        await newPage.close();
        return houseObject
    });
    console.log('Grabbing houses.....')
    const page = await browser.newPage()
    await page.goto(buildUrl())
    await page.waitForSelector('[data-testid="page"]');
    await page.evaluate('window.scrollTo({top: document.body.scrollHeight, left: 0, behavior: "smooth"})')
    await page.waitForTimeout(2000);
    const houseUrls: string[] = await page.$$eval(
        '.slick-slide > div > a', list => {
            list = list.map(house => house?.href)
            list = list.filter((value, index, self) => {
                return self.indexOf(value) === index;
            })
            return list
        }
    )
    const houses = []
    for (let link of houseUrls) {
        const houseInfo = {} as House
        houseInfo.details = {} as HouseDetails
        houses.push(await houseData(link, houseInfo))
    }
    await browser.close()
    houses.forEach(house => {
        makeDir(house.details.address)
        writeJson(house.details.address, JSON.stringify(house.details))
        house.photos.forEach((photo, counter) => {
            downloadImage(photo, house.details.address, 'image'+counter)
        })
    })
    console.log("Finished writing data")
  })