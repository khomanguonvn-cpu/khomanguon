//here types are saved

//Search mobile types
export type FormValues = {
  search: string;
};

//Product Models
export type Product = {
  _id: string;
  sellerProductId?: number;
  sellerId?: number;
  sellerName?: string;
  name: string;
  featured: boolean;
  slug: string;
  description: string;
  productType?: "physical" | "digital" | "ai_account" | "source_code" | "service";
  deliveryMethod?: "manual" | "digital" | "ai_account" | "source_code" | "service";
  category: Category;
  subCategories: SubCategory[];
  brand: Brand;
  content: string;
  details: Detail[];
  questions: Question[];
  reviews: Review[];
  subProducts: SubProduct[];
};

export type Detail = {
  name: string;
  value: string;
};

export type Page = {
  _id: string;
  name: string;
  link: string;
  subPage: SubPage[];
  createdAt: Date;
};

export type SubPage = {
  _id: string;
  name: string;
  link: string;
  slug: string;
  parent: string;
  createdAt: Date;
};

export type Question = {
  name: string;
  value: string;
};

export type Review = {
  _id?: string;
  reviewBy?: User;
  rating: number;
  review: string;
  likes: string[];
  createdAt: Date;
  updatedAt?: Date;
};

export type User = {
  _id: string;
  name: string;
  email: string;
  image: string;
  password: string;
  role: string;
  emailVerified?: boolean;
  createdAt?: Date;
  address: Address[];
  bankInfo?: {
    bankName: string;
    bankAccount: string;
    bankAccountHolder: string;
    isConfigured: boolean;
  };
  bankAccounts?: Array<{
    id: string;
    bankName: string;
    bankAccount: string;
    bankAccountHolder: string;
    isDefault: boolean;
  }>;
  sellerVerification?: {
    hasSellerAccount: boolean;
    status: "not_submitted" | "pending" | "approved" | "rejected";
    isVerified: boolean;
    showWarning: boolean;
  };
};

export type SubProduct = {
  sku: string;
  style: Style;
  options: Option[];
};

export type Style = {
  name: string;
  color: string;
  image: string;
  options: Option[];
};

export type Option = {
  qty: number;
  price: number;
  sold: number;
  option: string;
  images: string[];
  discount: number;
  variantId?: string;
  attributes?: Array<{ key: string; value: string | number | boolean }>;
};

export type Category = {
  _id: string;
  name: string;
  link: string;
  slug: string;
  image: string;
  createdAt?: Date;
  submenu?: SubCategory[];
};

export type SubCategory = {
  _id: string;
  name: string;
  link: string;
  slug: string;
  parent?: string;
  createdAt?: Date;
};

export type Brand = {
  _id: string;
  name: string;
  link: string;
  slug: string;
  image: string;
  createdAt?: Date;
};

export type AccountVariant = {
  type: string;
  durationDays: number;
  label?: string;
};

export type CartItem = {
  product: string;
  sellerProductId?: number;
  selectedVariantId?: string;
  name: string;
  description: string;
  optionBefore: number;
  option: string;
  slug: string;
  sku: string;
  shipping: string;
  images: string[];
  style: Style;
  price: number;
  priceBefore: number;
  qty: number;
  stock: number;
  brand: string;
  likes: string[];
  _uid: string;
  productType?: "physical" | "digital" | "ai_account" | "source_code" | "service";
  attributes?: Array<{ key: string; value: string | number | boolean }>;
  accountVariant?: AccountVariant;
};

export type Order = {
  _id: string;
  user: User;
  products: ProductOrder[];
  paymentMethod: string;
  total: number;
  shippingPrice: number;
  taxPrice: number;
  isPaid: boolean;
  status: string;
  totalBeforeDiscount: number;
  couponApplied: Coupon;
  shippingStatus: string;
  shippingAddress: Address;
  paymentResult: string;
  shippingTimes: string;
  shipping: Address;
  createdAt: Date;
};

export type ProductOrder = {
  _id?: string;
  product: string;
  sellerProductId?: number;
  selectedVariantId?: string;
  name: string;
  images: string;
  option: string;
  qty: number;
  style: Style;
  price: number;
  productType?: "physical" | "digital" | "ai_account" | "source_code" | "service";
  attributes?: Array<{ key: string; value: string | number | boolean }>;
  deliveryAccess?: {
    method: "ai_account" | "source_code";
    accounts?: Array<{
      accountType: string;
      username: string;
      password: string;
      note?: string;
    }>;
    downloads?: Array<{
      label: string;
      url: string;
      note?: string;
      passwordHint?: string;
    }>;
  };
};
export type Coupon = {
  id: string;
  coupon: string;
  startDate: Date;
  endDate: Date;
  discount: number;
};
export type Address = {
  _id: string;
  firstName: string;
  lastName: string;
  city: string;
  country: string;
  zipCode: string;
  address: string;
  phoneNumber: string;
  state: string;
};

export type Slide = {
  id?: number;
  slug: string;
  title: string;
  subtitle: string;
  btn: string;
  link: string;
  image: string;
  textColor: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type ShippingAddress = {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  state?: string;
  city?: string;
  address?: string;
  deliveryInfo?: string;
};

export type Cart = {
  cartItems: CartItem[];
  cartTotal: number;
  products: Product[];
  deliveryInfo?: string;
  shippingAddress?: ShippingAddress;
};

export type Delivery = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  times: string;
  price: number;
};

export type Payment = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
};

export type sendEmailTypes = {
  subject: string;
  email: string;
  message: string;
};
