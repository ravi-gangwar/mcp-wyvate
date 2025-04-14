"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTools = registerTools;
const zod_1 = require("zod");
const vendor_controller_1 = require("../controllers/vendor.controller");
function registerTools(server) {
    server.tool("exploreNearByVendorOfTheUserCurrentLocation", "This tool allows the user to explore nearby vendors based on their current location. The vendors have various fields such as preparing time, landmark, ratings, and whether they are open or closed.", {
        latitude: zod_1.z.number().describe("The latitude of the user's current location."),
        longitude: zod_1.z.number().describe("The longitude of the user's current location."),
    }, async ({ longitude, latitude }) => {
        return (0, vendor_controller_1.getVendor)({ longitude, latitude });
    });
}
