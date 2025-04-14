export interface GetVendor {
  [key: string]: unknown;
  _meta?: { [key: string]: unknown };
  content?: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}