import { discountPrice, getBestPriceWithDiscountFromProduct, getBestPriceWithoutDiscountFromProduct, getHighestPriceWithDiscountFromProduct, getHighestPriceWithoutDiscountFromProduct, getDiscountRate } from "./lib/utils";

const product: any = {
  subProducts: [
    {
      options: [
        { price: 1000000, discount: 800000 }
      ]
    }
  ]
};

console.log("best price with discount:", getBestPriceWithDiscountFromProduct(product));
console.log("best price without discount:", getBestPriceWithoutDiscountFromProduct(product));
console.log("discount rate:", getDiscountRate(1000000, 800000));
