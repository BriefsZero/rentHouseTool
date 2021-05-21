var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var puppeteer = require('puppeteer-extra');
var StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
var base_url = 'https://www.domain.com.au';
var params = {
    "area": "clayton-vic-3168"
};
var queries = {
    "ptype": "apartment-unit-flat,block-of-units,duplex,free-standing,new-apartments,new-home-designs,new-house-land,pent-house,semi-detached,studio,terrace,town-house,villa",
    "bedrooms": "1-any",
    "bathrooms": "1-any",
    "price": "50-650",
    "excludedeposittaken": "1",
    "establishedtype": "any",
    "carspaces": "1-any",
    "features": "petsallowed,study,gardencourtyard,internallaundry"
};
var buildUrl = function () {
    return (base_url + "/" +
        "rent" + "/" +
        params["area"] + "/"
        + "?" +
        Object.entries(queries).map(function (_a) {
            var key = _a[0], value = _a[1];
            return key + "=" + value;
        }).join('&'));
};
puppeteer.launch({ headless: false }).then(function (browser) { return __awaiter(_this, void 0, void 0, function () {
    var page, housesUrl, houses;
    var _this = this;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log('Grabbing houses..');
                return [4 /*yield*/, browser.newPage()];
            case 1:
                page = _a.sent();
                return [4 /*yield*/, page.goto(buildUrl())];
            case 2:
                _a.sent();
                return [4 /*yield*/, page.evaluate(function () { return Array.from(document.querySelectorAll('[class="css-gg0tkj"]'), function (element) { return element; }); })];
            case 3:
                housesUrl = _a.sent();
                console.log(housesUrl);
                houses = housesUrl.map(function (house) { return __awaiter(_this, void 0, void 0, function () {
                    var houseInfo;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                houseInfo = {};
                                return [4 /*yield*/, house.click()];
                            case 1:
                                _a.sent();
                                return [4 /*yield*/, page.evaluate(houseInfo.price = document.querySelector('[data-testid="listing-details__summary-title"]').textContent, houseInfo.address = document.querySelector('[data-testid="listing-details__button-copy-wrapper"] > h1').textContent, function () { return Array.from(document.querySelectorAll('[data-testid="property-features-feature"]'), function (element) {
                                        var feature = {};
                                        feature.type = element.firstChild.textContent;
                                        feature.amount = element.textContent;
                                        houseInfo.features.push(feature);
                                    }); }, houseInfo.houseType = document.querySelector('[data-testid="listing-summary-property-type"]').firstChild.textContent, function () { return Array.from(document.querySelectorAll('[listing-details__additional-features-listing]'), function (element) { return houseInfo.amenities.push(element.textContent); }); }, houseInfo.photos.push(document.querySelector('[class="css-1rnnotm"]')
                                        .querySelector("img")
                                        .src), function () { return Array.from(document.querySelector('[data-testid="listing-details__gallery"]')
                                        .querySelector('[class="css-ml426i"]')
                                        .querySelectorAll('source'), function (element) { return houseInfo.photos.push(element.srcset); }); })];
                            case 2:
                                _a.sent();
                                return [2 /*return*/, houseInfo];
                        }
                    });
                }); });
                console.log(houses);
                return [4 /*yield*/, page.waitForTimeout(1000000)];
            case 4:
                _a.sent();
                return [4 /*yield*/, browser.close()];
            case 5:
                _a.sent();
                console.log("All done, check the screenshot. \u2728");
                return [2 /*return*/];
        }
    });
}); });
