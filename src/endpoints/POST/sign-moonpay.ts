import crypto from "crypto";

const MOONPAY_API_KEY = "pk_test_lhO0wUX5sQ5aKsEIIj7P3j7z15jwPPzL";

export async function signMoonpay(url: string) {
  const signature = crypto
    .createHmac("sha256", MOONPAY_API_KEY)
    .update(new URL(url).search) // Use the query string part of the URL
    .digest("base64"); // Convert the result to a base64 string

  return signature; // Return the signature
}
