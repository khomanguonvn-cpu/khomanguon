const discountPrice = (price, discount) => {
  if (!price || price <= 0 || !discount || discount <= 0) return price;
  if (discount <= 100) {
    return parseInt((price * ((100 - discount) / 100)).toFixed(2));
  }
  if (discount < price) return discount;
  return price;
};

const getBestPriceWithDiscountFromProduct = (product) => {
  if (!product?.subProducts?.length) return 0;
  const data = product.subProducts.map((subProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options) => {
      return options.discount
        ? discountPrice(options.price, options.discount)
        : options.price;
    });
  });
  const allPrices = data.flat().filter((p) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;
  return Math.min(...allPrices);
};

const getBestPriceWithoutDiscountFromProduct = (product) => {
  if (!product?.subProducts?.length) return 0;
  const data = product.subProducts.map((subProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options) => {
      return options.price;
    });
  });
  const allPrices = data.flat().filter((p) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;
  return Math.min(...allPrices);
};

const getDiscountRate = (price, discountPrice) => {
  if (!price || price <= 0) return 0;
  const d = ((price - discountPrice) * (100 / price));
  return parseFloat(d.toFixed(2));
};

const product = {
  subProducts: [
    {
      options: [
        { price: 1000000, discount: 800000 }
      ]
    }
  ]
};

const bestPriceWithDiscountRaw = getBestPriceWithDiscountFromProduct(product);
const bestPriceWithoutDiscount = getBestPriceWithoutDiscountFromProduct(product);

const bestPriceWithDiscount = bestPriceWithoutDiscount > 0
  ? Math.min(bestPriceWithDiscountRaw || bestPriceWithoutDiscount, bestPriceWithoutDiscount)
  : bestPriceWithDiscountRaw;

const discountRate = Math.round(getDiscountRate(bestPriceWithoutDiscount, bestPriceWithDiscount));
const hasDiscount = discountRate > 0;

console.log("bestPriceWithDiscountRaw:", bestPriceWithDiscountRaw);
console.log("bestPriceWithoutDiscount:", bestPriceWithoutDiscount);
console.log("bestPriceWithDiscount:", bestPriceWithDiscount);
console.log("discountRate:", discountRate);
console.log("hasDiscount:", hasDiscount);
