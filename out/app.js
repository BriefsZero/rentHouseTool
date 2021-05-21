var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const fs = require('fs');
const download = require('image-downloader');
const sanitize = require("sanitize-filename");
let rootDir = './houses';
puppeteer.use(AdblockerPlugin());
puppeteer.use(StealthPlugin());
const base_url = 'https://www.domain.com.au';
const params = {
    "area": ["thornbury-vic-3071"],
};
const queries = {
    "ptype": "apartment-unit-flat,block-of-units,duplex,free-standing,new-apartments,new-home-designs,new-house-land,pent-house,semi-detached,studio,terrace,town-house,villa",
    "bedrooms": "2-any",
    "bathrooms": "any",
    "price": "300-650",
    "excludedeposittaken": "0",
    "establishedtype": "any",
    "carspaces": "1-any",
    "features": "gardencourtyard"
};
const getFullDir = (dir) => {
    return rootDir + "/" + dir.map(direc => sanitize(direc.replace("/", "_")))
        .join("/")
        .replace(/\s/g, "_");
};
const makeDir = (dir) => {
    dir = dir ? getFullDir([dir]) : rootDir;
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};
const downloadImage = (url, dir, name) => {
    const options = {
        url: url,
        dest: getFullDir([dir, name]) + '.jpg' // will be saved to /path/to/dest/photo.jpg
    };
    download.image(options)
        .catch((err) => console.error(err));
};
const writeJson = (name, json) => {
    name = getFullDir([name, name]);
    fs.writeFile(name + '.json', json, 'utf8', (err) => {
        if (err)
            throw err;
    });
};
const buildUrl = () => {
    const suburbs = params["area"].length > 1 ?
        "?suburb=" + params["area"].join(",") + "&" :
        params["area"] + "/?";
    return (base_url + "/" +
        "rent" + "/" +
        suburbs +
        Object.entries(queries).map(([key, value]) => {
            if (!["0", "any"].includes(value))
                return `${key}=${value}`;
            else
                return '';
        }).join('&'));
};
puppeteer.launch({ headless: true }).then((browser) => __awaiter(this, void 0, void 0, function* () {
    makeDir();
    const distinct = (value, index, self) => {
        return self.indexOf(value) === index;
    };
    const houseData = (link, houseObject) => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
        const newPage = yield browser.newPage();
        console.log("Loading house");
        yield newPage.goto(link);
        yield newPage.waitForSelector('.listing-details__root');
        console.log("Loaded house");
        houseObject.details.price = yield newPage.$eval('[data-testid="listing-details__summary-title"]', text => text.innerText);
        houseObject.details.address = yield newPage.$eval('.css-164r41r', text => text.innerText);
        houseObject.details.features = yield newPage.$$eval('[data-testid="listing-details__summary-left-column"] > \
            [data-testid="property-features"] > \
            [data-testid="property-features-wrapper"] > \
            [data-testid="property-features-feature"] > \
            [data-testid="property-features-text-container"]', features => features.map(feature => {
            const featureObj = {};
            featureObj.amount = feature.innerText;
            featureObj.type = feature.firstChild.innerText;
            return featureObj;
        }));
        houseObject.details.houseType = yield newPage.$eval('[data-testid="listing-summary-property-type"]', text => text.innerText);
        houseObject.details.amenities = yield newPage.$$eval('[data-testid="listing-details__additional-features-listing"]', amenities => amenities.map(amenity => {
            return amenity.innerText;
        }));
        houseObject.photos = yield newPage.$$eval('.css-1rnnotm > img', photos => photos.map(photo => {
            return photo.src;
        }));
        resolve(houseObject);
        yield newPage.close();
        return houseObject;
    }));
    console.log('Grabbing houses.....');
    const page = yield browser.newPage();
    yield page.goto(buildUrl());
    yield page.waitForSelector('[data-testid="page"]');
    yield page.evaluate('window.scrollTo({top: document.body.scrollHeight, left: 0, behavior: "smooth"})');
    yield page.waitForTimeout(2000);
    const houseUrls = yield page.$$eval('.slick-slide > div > a', list => {
        list = list.map(house => house === null || house === void 0 ? void 0 : house.href);
        list = list.filter((value, index, self) => {
            return self.indexOf(value) === index;
        });
        return list;
    });
    const houses = [];
    for (let link of houseUrls) {
        const houseInfo = {};
        houseInfo.details = {};
        houses.push(yield houseData(link, houseInfo));
    }
    yield browser.close();
    houses.forEach(house => {
        makeDir(house.details.address);
        writeJson(house.details.address, JSON.stringify(house.details));
        house.photos.forEach((photo, counter) => {
            downloadImage(photo, house.details.address, 'image' + counter);
        });
    });
    console.log("Finished writing data");
}));
//# sourceMappingURL=app.js.map