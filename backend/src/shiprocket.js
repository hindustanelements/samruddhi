const defaultApiUrl = "https://apiv2.shiprocket.in/v1/external";
const defaultTrackingUrl = "https://shiprocket.co/tracking/";

let cachedToken = "";
let tokenExpiresAt = 0;
let cachedCredentialKey = "";

const responseData = (response) => response?.data?.data || response?.data || response;

const readResponse = async (response, endpoint) => {
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Shiprocket returned an invalid response from ${endpoint}.`);
  }
  if (!response.ok) {
    const detail = data?.message || data?.errors && JSON.stringify(data.errors) || response.statusText;
    throw new Error(`Shiprocket ${endpoint} failed (${response.status}): ${detail}`);
  }
  return data;
};

export const isFreeShipping = (pincode) => {
  const pinsEnv = process.env.FREE_SHIPPING_PINCODES || "";
  const pins = pinsEnv.split(",").map((p) => p.trim()).filter(Boolean);
  return pins.includes(String(pincode).trim());
};

const authenticate = async (env, fetchImpl, baseUrl) => {
  const email = env.SHIPROCKET_EMAIL?.trim();
  const password = env.SHIPROCKET_PASSWORD;
  if (!email || !password) throw new Error("Shiprocket credentials are not configured.");

  const credentialKey = email;
  if (cachedToken && tokenExpiresAt > Date.now() && cachedCredentialKey === credentialKey) return cachedToken;

  const response = await fetchImpl(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    signal: AbortSignal.timeout(20000)
  });
  const data = await readResponse(response, "authentication");
  if (!data.token) throw new Error("Shiprocket authentication succeeded without returning an access token.");

  cachedToken = data.token;
  cachedCredentialKey = credentialKey;
  tokenExpiresAt = Date.now() + 8 * 24 * 60 * 60 * 1000;
  return cachedToken;
};

const requestShiprocket = async (endpoint, { env, fetchImpl, baseUrl, token, method = "GET", body }) => {
  const send = (accessToken) => fetchImpl(`${baseUrl}${endpoint}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(body ? { "Content-Type": "application/json" } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(20000)
  });
  let response = await send(token);
  // First attempt: if token invalid or user blocked, clear cache and re‑authenticate
  if (response.status === 401 || response.status === 403) {
    cachedToken = "";
    tokenExpiresAt = 0;
    response = await send(await authenticate(env, fetchImpl, baseUrl));
    // If still failing after re‑auth, surface a clear error to the caller
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Shiprocket authentication failed (${response.status}): User blocked due to too many failed login attempts.`);
    }
  }
  return readResponse(response, endpoint);
};

const itemWeightKg = (weight, fallbackKg) => {
  const match = String(weight || "").match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml)\b/i);
  if (!match) return fallbackKg;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  return unit === "g" || unit === "ml" ? amount / 1000 : amount;
};

const requiredNumber = (env, key, fallback) => {
  const number = Number(env[key] || fallback);
  if (!Number.isFinite(number) || number <= 0) throw new Error(`${key} must be a positive number.`);
  return number;
};

const shipmentWeight = (items, env) => {
  const fallbackItemWeightKg = requiredNumber(env, "SHIPROCKET_DEFAULT_ITEM_WEIGHT_KG", 0.5);
  return Math.max(0.1, items.reduce(
    (total, item) => total + itemWeightKg(item.weight, fallbackItemWeightKg) * item.quantity,
    0
  ));
};

const availableCouriers = async ({ pincode, paymentMethod, weight, pickupPostcode }, {
  env = process.env,
  fetchImpl = fetch
} = {}) => {
  const effectivePickupPostcode = (pickupPostcode || env.SHIPROCKET_PICKUP_POSTCODE)?.trim();
  if (!effectivePickupPostcode) throw new Error("Shiprocket pickup postcode is not configured.");
  const baseUrl = (env.SHIPROCKET_API_URL || defaultApiUrl).replace(/\/+$/, "");
  const token = await authenticate(env, fetchImpl, baseUrl);
  const cod = paymentMethod === "COD" ? 1 : 0;
  const serviceabilityQuery = new URLSearchParams({
    pickup_postcode: effectivePickupPostcode,
    delivery_postcode: pincode,
    cod: String(cod),
    weight: weight.toFixed(3)
  }).toString();
  const serviceability = await requestShiprocket(`/courier/serviceability/?${serviceabilityQuery}`, { env, fetchImpl, baseUrl, token });
  const couriers = responseData(serviceability)?.available_courier_companies || [];
  if (!couriers.length) throw new Error(`Shiprocket has no courier service available for pincode ${pincode}.`);

  const courier = [...couriers].map((company) => ({
    ...company,
    shippingCharge: Number(company.freight_charge ?? company.rate)
  })).filter((company) => Number.isFinite(company.shippingCharge) && company.shippingCharge >= 0)
    .sort((a, b) => a.shippingCharge - b.shippingCharge)[0];
  if (!courier) throw new Error("Shiprocket did not return a valid delivery charge.");
  if (!courier.courier_company_id) throw new Error("Shiprocket did not return a courier company ID.");
  return { courier, baseUrl, token };
};

export async function getShiprocketDeliveryQuote({ pincode, paymentMethod, items }, options = {}) {
  const { env = process.env } = options;
  // Pickup location is now provided per order; fallback to env if needed.
  const weight = shipmentWeight(items, env);
  const { courier } = await availableCouriers({ pincode, paymentMethod, weight }, options);
  return {
    delivery: courier.shippingCharge,
    courierCompanyId: courier.courier_company_id,
    courierName: courier.courier_name || null,
    weight
  };
}

export async function createShiprocketShipment(order, {
  existingShipmentId,
  courierCompanyId,
  courierName,
  onOrderCreated = async () => {},
  env = process.env,
  fetchImpl = fetch
} = {}) {
  const pickupLocation = (order.pickupLocation || env.SHIPROCKET_PICKUP_LOCATION)?.trim();
  if (!pickupLocation) throw new Error("Shiprocket pickup location is not configured.");
  const weight = shipmentWeight(order.items, env);
  const baseUrl = (env.SHIPROCKET_API_URL || defaultApiUrl).replace(/\/+$/, "");
  const token = await authenticate(env, fetchImpl, baseUrl);
  let courier;
  if (courierCompanyId) {
    courier = { courier_company_id: courierCompanyId, courier_name: courierName };
  } else {
    ({ courier } = await availableCouriers({
      pincode: order.pincode,
      paymentMethod: order.paymentMethod,
      weight
    }, { env, fetchImpl }));
  }

  let shipmentId = existingShipmentId;
  if (!shipmentId) {
    const nameParts = order.customerName.trim().split(/\s+/);
    const firstName = nameParts.shift() || order.customerName;
    const lastName = nameParts.join(" ") || "-";
    const created = await requestShiprocket("/orders/create/adhoc", {
      env, fetchImpl, baseUrl, token, method: "POST",
      body: {
        order_id: order.orderNumber,
        order_date: new Date(order.createdAt).toISOString().slice(0, 19).replace("T", " "),
        pickup_location: pickupLocation,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: order.address,
        billing_city: order.city,
        billing_pincode: order.pincode,
        billing_state: order.state,
        billing_country: "India",
        ...(order.email ? { billing_email: order.email } : {}),
        billing_phone: order.mobile.replace(/\D/g, "").slice(-10),
        shipping_is_billing: true,
        order_items: order.items.map((item) => ({
          name: item.name,
          sku: item.product?.sku || `ORDER-${order.id}-ITEM-${item.id}`,
          units: item.quantity,
          selling_price: Number(item.price)
        })),
        payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
        sub_total: Number(order.subtotal),
        shipping_charges: Number(order.delivery),
        total_discount: Number(order.discount),
        length: order.packageLengthCm ?? requiredNumber(env, "SHIPROCKET_PACKAGE_LENGTH_CM", 20),
        breadth: order.packageBreadthCm ?? requiredNumber(env, "SHIPROCKET_PACKAGE_BREADTH_CM", 15),
        height: order.packageHeightCm ?? requiredNumber(env, "SHIPROCKET_PACKAGE_HEIGHT_CM", 10),
        weight: Number(weight.toFixed(3))
      }
    });
    const createdData = responseData(created);
    shipmentId = createdData?.shipment_id;
    if (!shipmentId) throw new Error("Shiprocket created an order without returning a shipment ID.");
    await onOrderCreated({
      shiprocketOrderId: createdData.order_id ? String(createdData.order_id) : null,
      shiprocketShipmentId: String(shipmentId)
    });
  }

  const assigned = await requestShiprocket("/courier/assign/awb", {
    env, fetchImpl, baseUrl, token, method: "POST",
    body: { shipment_id: shipmentId, courier_id: courier.courier_company_id }
  });
  const assignedData = responseData(assigned)?.response?.data || responseData(assigned);
  const awbCode = assignedData?.awb_code || assignedData?.awb;
  if (!awbCode) throw new Error("Shiprocket accepted the courier assignment without returning an AWB number.");

  return {
    shiprocketOrderId: assignedData.order_id ? String(assignedData.order_id) : undefined,
    shiprocketShipmentId: String(shipmentId),
    shiprocketAwbCode: String(awbCode),
    shiprocketCourierName: assignedData.courier_name || courier.courier_name || null,
    shiprocketTrackingUrl: assignedData.tracking_url || `${defaultTrackingUrl}${encodeURIComponent(awbCode)}`,
    shiprocketStatus: "AWB ASSIGNED",
    shiprocketError: null,
    shiprocketBookedAt: new Date()
  };
}
