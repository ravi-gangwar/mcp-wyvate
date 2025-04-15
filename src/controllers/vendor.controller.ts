import axios from "axios";
import { config } from "dotenv";
import { GetVendor } from '../types/types';

config();

const NODE_BACKEND_DEV = "https://wyvatecustomerappbackendinnode-thdu.onrender.com"

export async function getVendor({ latitude, longitude }): Promise<GetVendor> {
  try {
    console.log(longitude, latitude);

    const apiUrl = `${NODE_BACKEND_DEV}/vendor/vendorexplore?latitude=${latitude}&longitude=${longitude}&day=${new Date().getDay()}`;
    console.log(`🌐 Fetching from: ${apiUrl}`);

    const response = await axios.get(apiUrl);
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
      .map((v, i) =>
        `${v.name} - Avg Prep Time: ${v.avg_preparing_time || "N/A"}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text",
          text: `Your near by Vendors are ${vendorListText}`,
        },
      ],
    };
  } catch (error) {
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