"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVendor = getVendor;
const axios_1 = __importDefault(require("axios"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
const NODE_BACKEND_DEV = "https://wyvatecustomerappbackendinnode-thdu.onrender.com";
async function getVendor({ latitude, longitude }) {
    try {
        console.log(longitude, latitude);
        const apiUrl = `${NODE_BACKEND_DEV}/vendor/vendorexplore?latitude=${latitude}&longitude=${longitude}&day=${new Date().getDay()}`;
        console.log(`🌐 Fetching from: ${apiUrl}`);
        const response = await axios_1.default.get(apiUrl);
        const vendors = response?.data?.Vendors || [];
        if (vendors.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: "❌ No vendors found near your location.",
                    },
                ],
            };
        }
        // Format vendor info
        const vendorListText = vendors
            .slice(0, 5) // Limiting to first 5 for brevity
            .map((v, i) => `${i + 1}. ${v.name} - Avg Prep Time: ${v.avg_preparing_time || "N/A"}`)
            .join("\n");
        return {
            content: [
                {
                    type: "text",
                    text: `📍 Vendors near you:\n${vendorListText}`,
                },
            ],
        };
    }
    catch (error) {
        console.error("Error fetching vendors:", error.message);
        return {
            content: [
                {
                    type: "text",
                    text: "⚠️ Failed to fetch vendors. Please try again later.",
                },
            ],
        };
    }
}
