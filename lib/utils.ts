import { Option, Review, SubProduct } from "./../types/index";
import { Product } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Get the discount from an option of a product */
export const discountPrice = (price: number, discount: number): number => {
  if (!price || price <= 0) return 0;
  let final_price: number = 0;
  final_price = (price * (100 * discount)) / 100;
  return parseInt(final_price.toFixed(2));
};

/** Get the best low price from a list of number of option for a product with considering its discount */
export const getBestPriceWithDiscountFromProduct = (
  product: Product
): number => {
  if (!product?.subProducts?.length) return 0;

  const data = product.subProducts.map((subProduct: SubProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options: Option) => {
      return options.discount
        ? discountPrice(options.price, options.discount)
        : options.price;
    });
  });

  const allPrices = data.flat().filter((p: number) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;

  return Math.min(...allPrices);
};

/** Get the best low price from a list of number of option for a product without considering its discount */
export const getBestPriceWithoutDiscountFromProduct = (
  product: Product
): number => {
  if (!product?.subProducts?.length) return 0;

  const data = product.subProducts.map((subProduct: SubProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options: Option) => {
      return options.price;
    });
  });

  const allPrices = data.flat().filter((p: number) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;

  return Math.min(...allPrices);
};

/** Get the highest price from options with discount */
export const getHighestPriceWithDiscountFromProduct = (
  product: Product
): number => {
  if (!product?.subProducts?.length) return 0;

  const data = product.subProducts.map((subProduct: SubProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options: Option) => {
      return options.discount
        ? discountPrice(options.price, options.discount)
        : options.price;
    });
  });

  const allPrices = data.flat().filter((p: number) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;

  return Math.max(...allPrices);
};

/** Get the highest price from options without discount */
export const getHighestPriceWithoutDiscountFromProduct = (
  product: Product
): number => {
  if (!product?.subProducts?.length) return 0;

  const data = product.subProducts.map((subProduct: SubProduct) => {
    if (!subProduct?.options?.length) return [];
    return subProduct.options.map((options: Option) => {
      return options.price;
    });
  });

  const allPrices = data.flat().filter((p: number) => typeof p === "number" && p > 0);
  if (!allPrices.length) return 0;

  return Math.max(...allPrices);
};

export const getDiscountRate = (
  price: number,
  discountPrice: number
): number => {
  if (!price || price <= 0) return 0;
  const d = ((price - discountPrice) * (100 / price));
  return parseFloat(d.toFixed(2));
};

export const getRating = (product: Product) => {
  if (!product?.reviews?.length) return 0;
  const ratingTotal = product.reviews.reduce(
    (acc: number, value: Review) => acc + (value?.rating || 0),
    0
  );
  const rating = ratingTotal / product.reviews.length;
  return rating;
};

export const getDate = (date: Date) => {
  if (!date) return "";
  const newDate = new Date(date).toDateString();
  return newDate;
};
