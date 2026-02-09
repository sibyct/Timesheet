import "axios";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    metadata?: {
      startTime?: Date;
      endTime?: Date;
    };
  }

  export interface AxiosResponse {
    metadata?: {
      startTime?: Date;
      endTime?: Date;
    };
  }
}
