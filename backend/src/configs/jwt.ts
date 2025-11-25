import {env} from "./env"
export const JWT_CONFIG = {
  secret: env.ACCESS_TOKEN_SECRET,
  expiresIn: "7d",
  refreshExpiresIn: "30d",
};
