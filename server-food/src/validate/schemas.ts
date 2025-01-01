import Joi from "joi";

interface MenuData {
  name: string;
  price: number;
  category: string;
  description: string;
  image: string;
}

interface CategoryData {
  name: string;
  description: string;
  image: string;
}

interface IUser {
  firstName: string;
  email: string;
  password: string;
  role?: "user" | "admin";
}

interface IAdmin extends IUser {}

// new menu validation
const menuValidation = (data: MenuData) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    price: Joi.number().required(),
    category: Joi.string().required(),
    description: Joi.string().required(),
  });
  return schema.validate(data);
};

// new category validation
const categoryValidation = (data: CategoryData) => {
  const schema = Joi.object({
    name: Joi.string().min(3).required(),
    description: Joi.string().required(),
  });
  return schema.validate(data);
};

const userValidation = (data: IUser) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string()
      .min(8)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .required(),
    role: Joi.string().valid("user", "admin").default("user"),
  });
  return schema.validate(data);
};

const adminValidation = (data: IAdmin) => {
  const schema = Joi.object({
    firstName: Joi.string().required(),
    email: Joi.string().required().email(),
    password: Joi.string()
      .min(8)
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
      .required(),
    role: Joi.string().valid("admin").required(),
  });
  return schema.validate(data);
};

const Loginadmin = (data: IAdmin) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

export {
  menuValidation,
  categoryValidation,
  Loginadmin,
  userValidation,
  adminValidation,
};
