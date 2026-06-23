function normalizeText(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))];
}

function getOrderLabelValue(card, labelText) {
  const labelNode = [...card.querySelectorAll("span.a-color-secondary.a-text-caps")]
    .find((node) => normalizeText(node.textContent).toLowerCase() === labelText.toLowerCase());

  if (!labelNode) {
    return "";
  }

  const container = labelNode.closest("li") || labelNode.parentElement;
  const valueNode = container?.querySelector(".aok-break-word, .a-size-base") || labelNode.parentElement?.querySelector(".aok-break-word, .a-size-base");

  return normalizeText(valueNode?.textContent || "");
}

function getOrderId(card) {
  const valueNode = card.querySelector(".yohtmlc-order-id [dir='ltr']");
  if (valueNode) {
    return normalizeText(valueNode.textContent);
  }

  const detailsLink = card.querySelector("a[href*='order-details?orderID=']");
  const match = detailsLink?.href.match(/[?&]orderID=([^&]+)/i);
  return match ? decodeURIComponent(match[1]) : "";
}

function getOrderTitles(card) {
  const titles = [...card.querySelectorAll(".yohtmlc-product-title a, .yohtmlc-product-title")]
    .map((node) => normalizeText(node.textContent))
    .filter(Boolean);

  return uniqueValues(titles);
}

function getOrderStatus(card) {
  const statusNode = card.querySelector(".yohtmlc-shipment-status-primaryText");
  return normalizeText(statusNode?.textContent || "");
}

function scrapeAmazonOrders() {
  const rows = [];
  const cards = [...document.querySelectorAll(".order-card.js-order-card")];

  cards.forEach((card) => {
    const orderId = getOrderId(card);
    const date = getOrderLabelValue(card, "Pedido realizado");
    const price = getOrderLabelValue(card, "Total");
    const orderStatus = getOrderStatus(card);
    const itemDescriptions = getOrderTitles(card);

    if (!date && !price && !orderStatus && !itemDescriptions.length) {
      return;
    }

    rows.push({
      orderId,
      orderStatus,
      date,
      itemDescription: itemDescriptions.join("; "),
      price,
    });
  });

  return {
    rows,
    pageTitle: normalizeText(document.title),
    pageUrl: location.href,
  };
}

function getOrderNumberFromLink(link) {
  if (!link) {
    return "";
  }

  const href = link.getAttribute("href") || "";
  const fromHref = href.match(/[?&]orderID=([A-Z0-9-]+)/i);
  if (fromHref) {
    return fromHref[1];
  }

  const fromText = normalizeText(link.textContent).match(/([A-Z0-9]+-[0-9]{7}-[0-9]{7})/i);
  return fromText ? fromText[1] : "";
}

function findNearestDate(lineItemContainer) {
  let node = lineItemContainer;

  while (node) {
    let previous = node.previousElementSibling;

    while (previous) {
      if (previous.matches(".apx-transaction-date-container")) {
        return normalizeText(previous.textContent);
      }
      previous = previous.previousElementSibling;
    }

    node = node.parentElement;
  }

  return "";
}

function scrapeAmazonTransactions() {
  const rows = [];
  const lineItemContainers = [...document.querySelectorAll(".apx-transactions-line-item-component-container")];

  lineItemContainers.forEach((container) => {
    const row = container.querySelector(".a-row");
    const account = normalizeText(
      row?.querySelector(".a-column.a-span9 .a-size-base.a-text-bold")?.textContent
    );
    const amount = normalizeText(
      row?.querySelector(".a-column.a-span3 .a-size-base-plus")?.textContent
    );

    const orderLink = container.querySelector("a[href*='orderID=']");
    const orderNumber =
      getOrderNumberFromLink(orderLink) ||
      normalizeText(container.textContent).match(/([A-Z0-9]+-[0-9]{7}-[0-9]{7})/i)?.[1] ||
      "";
    const date = findNearestDate(container);

    if (!date && !account && !orderNumber && !amount) {
      return;
    }

    rows.push({
      date,
      account,
      orderNumber,
      amount,
    });
  });

  return {
    rows,
    pageTitle: normalizeText(document.title),
    pageUrl: location.href,
  };
}

function getWalmartListNextDataRows() {
  const nextDataElement = document.getElementById("__NEXT_DATA__");
  if (!nextDataElement?.textContent) {
    return [];
  }

  try {
    const data = JSON.parse(nextDataElement.textContent);
    const listItems = data?.props?.pageProps?.initialData?.data?.shoppingListDetails?.items?.listItems;

    if (!Array.isArray(listItems)) {
      return [];
    }

    return listItems
      .map((item) => ({
        itemId: normalizeText(item?.listItemId || item?.product?.id || item?.product?.usItemId),
        product: normalizeText(item?.genericItemName || item?.product?.name),
        price: normalizeText(
          item?.product?.priceInfo?.currentPrice?.priceString ||
          item?.product?.priceInfo?.linePrice?.priceString
        ),
      }))
      .filter((row) => row.product || row.price);
  } catch (error) {
    console.error("Unable to parse Walmart page data", error);
    return [];
  }
}

function getWalmartListDomRows() {
  const rows = [];
  const items = [...document.querySelectorAll("li.list-tile")];

  items.forEach((item, index) => {
    const product = normalizeText(
      item.querySelector("a[link-identifier='itemClick'] span")?.textContent
    );

    const price = normalizeText(
      item.querySelector("[data-testid='price-announcement-id']")?.textContent.match(/\$\s*\d+(?:\.\d{2})?/)?.[0] ||
      item.querySelector(".nowrap.b, .nowrap.f5, .nowrap.f4-l")?.textContent
    );

    if (!product && !price) {
      return;
    }

    rows.push({
      itemId: item.querySelector("[data-id]")?.getAttribute("data-id") || String(index),
      product,
      price,
    });
  });

  return rows;
}

function uniqueRows(rows, keyResolver) {
  const seenKeys = new Set();
  const unique = [];

  rows.forEach((row) => {
    const key = keyResolver(row);
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    unique.push(row);
  });

  return unique;
}

function scrapeWalmartListPrices() {
  const rows = uniqueRows(
    [...getWalmartListNextDataRows(), ...getWalmartListDomRows()],
    (row) => [row.itemId, row.product, row.price].join("|")
  );

  return {
    rows,
    pageTitle: normalizeText(document.title),
    pageUrl: location.href,
  };
}

function parseMoney(value) {
  if (!value) {
    return null;
  }

  const text = String(value).replace(/\u00a0/g, " ");
  const matches = text.match(/\$\s*[0-9][0-9,]*(?:\.\d{1,2})?/g);
  if (!matches?.length) {
    return null;
  }

  const raw = matches[0].replace(/[^0-9.,]/g, "");
  const normalized = raw.replace(/,/g, "");
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : null;
}

function findAllMoneyValues(text) {
  if (!text) {
    return [];
  }

  const matches = String(text).match(/\$\s*[0-9][0-9,]*(?:\.\d{1,2})?/g) || [];
  const values = matches
    .map(parseMoney)
    .filter((value) => Number.isFinite(value));

  return [...new Set(values)];
}

function formatMoney(amount) {
  if (!Number.isFinite(amount)) {
    return "";
  }

  return `$${amount.toFixed(2)}`;
}

function getLabelledMoney(root, labelRegex) {
  const text = normalizeText(root?.textContent || "");
  if (!text) {
    return null;
  }

  const match = text.match(new RegExp(`${labelRegex.source}[^$]{0,80}(\\$\\s*[0-9][0-9,]*(?:\\.\\d{1,2})?)`, "i"));
  return parseMoney(match?.[1] || "");
}

function extractQuantityFromStepper(root) {
  const valueSources = [
    "input[aria-label*='cantidad' i]",
    "input[aria-label*='quantity' i]",
    "input[name*='cantidad' i]",
    "input[name*='quantity' i]",
    "input[name*='qty' i]",
    "input[id*='cantidad' i]",
    "input[id*='quantity' i]",
    "input[id*='qty' i]",
    "input[data-automation-id*='qty' i]",
    "input[data-automation-id*='quantity' i]",
    "[role='spinbutton']",
  ];

  for (const selector of valueSources) {
    const node = root.querySelector(selector);
    if (!node) {
      continue;
    }

    const raw = node.value || node.getAttribute("value") || node.textContent;
    const parsed = Number.parseInt(String(raw || "").replace(/[^0-9]/g, ""), 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const ariaHints = [...root.querySelectorAll("[aria-label]")]
    .map((node) => node.getAttribute("aria-label") || "")
    .join(" ");
  const hintMatch = ariaHints.match(/(?:cantidad|quantity|qty)\D{0,20}(\d{1,3})/i);
  if (hintMatch) {
    const parsed = Number.parseInt(hintMatch[1], 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  const textMatch = normalizeText(root.textContent || "").match(/(?:cantidad|quantity|qty)\D{0,20}(\d{1,3})/i);
  if (textMatch) {
    const parsed = Number.parseInt(textMatch[1], 10);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
}

function hasQuantityControl(root) {
  const selectors = [
    "input[aria-label*='cantidad' i]",
    "input[aria-label*='quantity' i]",
    "input[name*='cantidad' i]",
    "input[name*='quantity' i]",
    "input[name*='qty' i]",
    "input[id*='cantidad' i]",
    "input[id*='quantity' i]",
    "input[id*='qty' i]",
    "input[data-automation-id*='qty' i]",
    "input[data-automation-id*='quantity' i]",
    "[role='spinbutton']",
  ];

  return selectors.some((selector) => !!root.querySelector(selector));
}

function extractProductName(root) {
  const selectors = [
    "[data-testid='productName']",
    "a[href*='/ip/']",
    "[class*='product-title']",
    "[class*='item-title']",
    "h3 a",
    "h3",
    "[link-identifier='itemClick'] span",
  ];

  for (const selector of selectors) {
    const node = root.querySelector(selector);
    const text = normalizeText(node?.textContent || "");
    if (text) {
      return text;
    }
  }

  return "";
}

function extractPrices(root, quantity) {
  const totalLabelRegex = /(subtotal|total|importe)/i;
  const unitLabelRegex = /(precio\s*unitario|unit\s*price|precio\s*por\s*unidad)/i;

  let total = getLabelledMoney(root, totalLabelRegex);
  let unit = getLabelledMoney(root, unitLabelRegex);

  if (!Number.isFinite(unit) || !Number.isFinite(total)) {
    const candidateSelectors = [
      "[data-testid*='price' i]",
      "[class*='price' i]",
      "[aria-label*='$']",
    ];

    let candidates = [];
    candidateSelectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((node) => {
        candidates = candidates.concat(findAllMoneyValues(node.textContent));
      });
    });

    if (candidates.length === 0) {
      candidates = findAllMoneyValues(root.textContent || "");
    }

    candidates = [...new Set(candidates)].sort((a, b) => a - b);

    if (!Number.isFinite(unit) && candidates.length > 0) {
      unit = candidates[0];
    }

    if (!Number.isFinite(total) && candidates.length > 0) {
      if (quantity > 1) {
        total = candidates[candidates.length - 1];
      } else {
        total = unit;
      }
    }
  }

  if (!Number.isFinite(total) && Number.isFinite(unit)) {
    total = unit * quantity;
  }

  if (!Number.isFinite(unit) && Number.isFinite(total) && quantity > 0) {
    unit = total / quantity;
  }

  return {
    unitPriceValue: Number.isFinite(unit) ? unit : null,
    totalValue: Number.isFinite(total) ? total : null,
    unitPrice: Number.isFinite(unit) ? formatMoney(unit) : "",
    total: Number.isFinite(total) ? formatMoney(total) : "",
  };
}

function extractQuantityFromCartButtons(root) {
  const controlButtons = [...root.querySelectorAll("button[aria-label]")];
  for (const button of controlButtons) {
    const label = button.getAttribute("aria-label") || "";
    const match = label.match(/(?:cantidad\s+actual\s+de|qty|quantity|cantidad)\D{0,20}(\d{1,3})/i);
    if (!match) {
      continue;
    }

    const quantity = Number.parseInt(match[1], 10);
    if (Number.isInteger(quantity) && quantity > 0) {
      return quantity;
    }
  }

  return null;
}

function isCartLikeContainer(root) {
  if (!(root instanceof Element)) {
    return false;
  }

  const hasProductName = Boolean(extractProductName(root));
  const hasQtyControl = hasQuantityControl(root) || Number.isInteger(extractQuantityFromCartButtons(root));
  const hasPriceSignals = findAllMoneyValues(root.textContent || "").length > 0;

  return hasProductName && (hasQtyControl || hasPriceSignals);
}

function getProductTileContainers() {
  return [...new Set([
    ...document.querySelectorAll("[data-testid='product-tile-container']"),
    ...document.querySelectorAll("[data-testid*='product-tile-container' i]"),
  ])];
}

function extractUnitAndTotalFromCartItem(root, quantity) {
  const text = normalizeText(root.textContent || "");
  const descriptionText = normalizeText(
    root.querySelector("[data-testid='productDescription']")?.textContent || "",
  );

  // Prefer product description price (e.g. "$209.00/pza") over promo/installment sections.
  const preferredUnitMatch = descriptionText.match(/(\$\s*[0-9][0-9,]*(?:\.\d{1,2})?)\s*\/\s*pza/i);
  const unitMatch = preferredUnitMatch || text.match(/(\$\s*[0-9][0-9,]*(?:\.\d{1,2})?)\s*\/\s*pza/i);
  const unitValue = parseMoney(unitMatch?.[1] || "");

  let totalValue = getLabelledMoney(root, /(subtotal|total|importe)/i);

  if (!Number.isFinite(totalValue) && Number.isFinite(unitValue) && quantity > 0) {
    totalValue = unitValue * quantity;
  }

  if (!Number.isFinite(unitValue) && Number.isFinite(totalValue) && quantity > 0) {
    return {
      unitPrice: formatMoney(totalValue / quantity),
      total: formatMoney(totalValue),
    };
  }

  return {
    unitPrice: Number.isFinite(unitValue) ? formatMoney(unitValue) : "",
    total: Number.isFinite(totalValue) ? formatMoney(totalValue) : "",
  };
}

function collectCartLineRows() {
  const listItems = [...getProductTileContainers()]
    .flatMap((container) => {
      const itemNodes = [...container.querySelectorAll("li.list.dark-gray")]
        .filter((node) => {
          const hasProductName = !!node.querySelector("[data-testid='productName']");
          const hasProductDescription = !!node.querySelector("[data-testid='productDescription']");
          return hasProductName && hasProductDescription;
        });

      return itemNodes.length > 0 ? itemNodes : [container];
    })
    .filter((item) => isCartLikeContainer(item));

  const rows = [];

  listItems.forEach((item, index) => {
    const productName = normalizeText(
      item.querySelector("h3")?.textContent ||
      item.querySelector("a[href*='/ip/']")?.textContent ||
      ""
    );

    if (!productName) {
      return;
    }

    const quantityFromAria = Number.parseInt(
      (
        item.querySelector("a[link-identifier='itemClick']")?.getAttribute("aria-label") ||
        ""
      ).match(/(\d{1,3})\s+en\s+el\s+carrito/i)?.[1] || "",
      10,
    );

    const quantity =
      (Number.isInteger(quantityFromAria) && quantityFromAria > 0 ? quantityFromAria : null) ||
      extractQuantityFromCartButtons(item) ||
      extractQuantityFromStepper(item);
    const prices = extractUnitAndTotalFromCartItem(item, quantity);

    if (!prices.unitPrice && !prices.total) {
      return;
    }

    const href = item.querySelector("a[href*='/ip/']")?.getAttribute("href") || "";
    rows.push({
      itemId: normalizeText(href || item.id || String(index)),
      productName,
      quantity,
      unitPrice: prices.unitPrice,
      total: prices.total,
    });
  });

  return rows;
}

function findClosestItemRoot(node) {
  if (!(node instanceof Element)) {
    return null;
  }

  const selectors = [
    "[data-testid='product-tile-container']",
    "[data-testid*='product-tile-container' i]",
    "[data-testid*='cart-item' i]",
    "[data-testid*='product-tile' i]",
    "[class*='cart-product-tile' i]",
    "[class*='cart-item' i]",
    "[class*='item-tile' i]",
    "article",
    "li",
  ];

  for (const selector of selectors) {
    const root = node.closest(selector);
    if (root) {
      return root;
    }
  }

  return node.parentElement;
}

function collectDomCartRows() {
  const anchorNodes = [
    ...document.querySelectorAll("[data-testid='productName']"),
    ...document.querySelectorAll("[link-identifier='itemClick']"),
    ...document.querySelectorAll("a[href*='/ip/']"),
  ];

  const rootedFromAnchors = anchorNodes
    .map((node) => findClosestItemRoot(node))
    .filter(Boolean);

  const fallbackRoots = [
    ...getProductTileContainers(),
    ...document.querySelectorAll("[data-testid*='cart-item' i]"),
    ...document.querySelectorAll("[data-testid*='product-tile' i]"),
    ...document.querySelectorAll("[class*='cart-product-tile' i]"),
    ...document.querySelectorAll("[class*='cart-item' i]"),
  ];

  const roots = [...new Set([...rootedFromAnchors, ...fallbackRoots])]
    .filter((node) => node instanceof HTMLElement);
  const rows = [];

  roots.forEach((root, index) => {
    const productName = extractProductName(root);
    const hasStepper = hasQuantityControl(root);
    const quantity = extractQuantityFromCartButtons(root) || extractQuantityFromStepper(root);
    const priceInfo = extractPrices(root, quantity);

    // Some Firefox/cart variants do not expose a quantity stepper but still contain valid item rows.
    if (!productName || (!hasStepper && quantity <= 0)) {
      return;
    }

    if (!priceInfo.unitPrice && !priceInfo.total) {
      return;
    }

    rows.push({
      itemId: normalizeText(root.getAttribute("data-item-id") || root.id || String(index)),
      productName,
      quantity,
      unitPrice: priceInfo.unitPrice,
      total: priceInfo.total,
    });
  });

  return rows;
}

function walkForLineItems(value, output, depth = 0) {
  if (!value || depth > 16) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => walkForLineItems(entry, output, depth + 1));
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const parsedQuantity = Number.parseInt(String(value.quantity ?? value.qty ?? ""), 10);
  const hasQuantity = Number.isInteger(parsedQuantity) && parsedQuantity > 0;
  const hasProductInfo = value.product || value.productInfo || value.genericItemName;
  if (hasQuantity && hasProductInfo) {
    output.push(value);
  }

  Object.values(value).forEach((entry) => walkForLineItems(entry, output, depth + 1));
}

function collectStructuredRows() {
  const rows = [];
  const structures = [];

  const nextDataElement = document.getElementById("__NEXT_DATA__");
  if (nextDataElement?.textContent) {
    try {
      structures.push(JSON.parse(nextDataElement.textContent));
    } catch (error) {
      console.error("Unable to parse __NEXT_DATA__", error);
    }
  }

  const lineItems = [];
  structures.forEach((structure) => walkForLineItems(structure, lineItems));

  lineItems.forEach((item, index) => {
    const product = item.product || item.productInfo || {};
    const quantity = Number.parseInt(String(item.quantity ?? item.qty ?? product.quantity ?? ""), 10);
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

    const name = normalizeText(item.genericItemName || product.name || product.displayName || "");
    const unitPriceValue =
      item?.priceInfo?.itemPrice?.value ??
      item?.priceInfo?.currentPrice?.price ??
      product?.priceInfo?.currentPrice?.price ??
      product?.priceInfo?.itemPrice?.value;
    const totalValue =
      item?.priceInfo?.linePrice?.value ??
      (Number.isFinite(unitPriceValue) ? unitPriceValue * qty : null);

    if (!name && !Number.isFinite(unitPriceValue) && !Number.isFinite(totalValue)) {
      return;
    }

    rows.push({
      itemId: normalizeText(String(item.id || product.usItemId || product.id || index)),
      productName: name,
      quantity: qty,
      unitPrice: formatMoney(unitPriceValue),
      total: formatMoney(totalValue),
    });
  });

  return rows;
}

function normalizeCartRows(rows) {
  return uniqueRows(rows.map((row) => {
    const quantity = Number.isInteger(row.quantity) && row.quantity > 0 ? row.quantity : 1;
    return {
      itemId: row.itemId || "",
      productName: normalizeText(row.productName || ""),
      quantity,
      unitPrice: normalizeText(row.unitPrice || ""),
      total: normalizeText(row.total || ""),
    };
  }).filter((row) => row.productName), (row) => {
    return row.itemId
      ? [row.itemId, row.productName, row.quantity, row.unitPrice, row.total].join("|")
      : [row.productName, row.quantity, row.unitPrice, row.total].join("|");
  });
}

/**
 * Primary cart extraction strategy: parse product link aria-labels.
 * Aria-labels are embedded in SSR HTML and available regardless of React
 * hydration state, making this work on Linux where hydration often fails.
 * Format: "Product Name, $X.XX/pza, N en el carrito [extra info]"
 */
function collectCartRowsFromAriaLabels() {
  const containers = [...new Set([
    ...document.querySelectorAll("[data-testid='product-tile-container']"),
    ...document.querySelectorAll("[data-testid*='product-tile-container' i]"),
  ])];

  const links = containers.length > 0
    ? containers.flatMap((c) => [...c.querySelectorAll("a[link-identifier='itemClick']")])
    : [...document.querySelectorAll("a[link-identifier='itemClick']")];

  const rows = [];
  const seen = new Set();

  links.forEach((link, index) => {
    const aria = link.getAttribute("aria-label") || "";
    if (!aria) {
      return;
    }

    const priceMatch = aria.match(/,\s*(\$\s*[0-9][0-9,]*(?:\.\d{1,2})?)\s*\/\s*pza/i);
    if (!priceMatch) {
      return;
    }

    const unitValue = parseMoney(priceMatch[1]);
    if (!Number.isFinite(unitValue)) {
      return;
    }

    const qtyMatch = aria.match(/,\s*(\d{1,3})\s+en\s+el\s+carrito/i);
    const quantity = qtyMatch ? Number.parseInt(qtyMatch[1], 10) : 1;
    const qty = Number.isInteger(quantity) && quantity > 0 ? quantity : 1;

    const nameEndIdx = aria.search(/,\s*\$\s*[0-9]/);
    const productName = normalizeText(nameEndIdx > 0 ? aria.slice(0, nameEndIdx) : aria.split(",")[0]);
    if (!productName) {
      return;
    }

    const href = link.getAttribute("href") || "";
    const itemId = href.match(/\/ip\/(?:seort\/)?([^/?#]+)/i)?.[1] || String(index);

    const key = [itemId, productName].join("|");
    if (seen.has(key)) {
      return;
    }
    seen.add(key);

    rows.push({
      itemId,
      productName,
      quantity: qty,
      unitPrice: formatMoney(unitValue),
      total: formatMoney(unitValue * qty),
    });
  });

  return rows;
}

function scrapeWalmartCart() {
  if (!/\/cart(?:\/|$|\?)/i.test(location.pathname + location.search)) {
    return {
      rows: [],
      pageTitle: normalizeText(document.title),
      pageUrl: location.href,
    };
  }

  // Primary: aria-label parsing — works on all OSes regardless of React hydration state.
  const ariaRows = collectCartRowsFromAriaLabels();
  if (ariaRows.length > 0) {
    return {
      rows: normalizeCartRows(ariaRows),
      pageTitle: normalizeText(document.title),
      pageUrl: location.href,
    };
  }

  // Fallback: DOM-based extraction for pages where aria-labels are absent.
  const cartRows = collectCartLineRows();
  const rows = cartRows.length > 0
    ? normalizeCartRows(cartRows)
    : normalizeCartRows(collectDomCartRows());

  return {
    rows,
    pageTitle: normalizeText(document.title),
    pageUrl: location.href,
  };
}

const EXTRACTORS = {
  "extract-orders": scrapeAmazonOrders,
  "extract-transactions": scrapeAmazonTransactions,
  "extract-walmart-prices": scrapeWalmartListPrices,
  "extract-walmart-cart": scrapeWalmartCart,
};

browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const extractor = EXTRACTORS[msg?.action];
  if (!extractor) {
    return;
  }

  sendResponse(extractor());
});
