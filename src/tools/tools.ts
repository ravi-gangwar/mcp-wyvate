import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getVendor } from '../controllers/vendor.controller';

export function registerTools(server: McpServer) {
    server.tool(
        "exploreNearByVendorOfTheUserCurrentLocation",
        "This tool allows the user to explore nearby vendors based on their current location. The vendors have various fields such as preparing time, landmark, ratings, and whether they are open or closed.",
        {
            latitude: z.number().describe("The latitude of the user's current location."),
            longitude: z.number().describe("The longitude of the user's current location."),
        },
        async ({longitude, latitude}) => {
            return getVendor({longitude, latitude});
        }
    );
} 