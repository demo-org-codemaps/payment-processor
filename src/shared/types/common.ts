export interface IUser {
  id: string;
  name: string;
  phone: string;
  email: string;
  businessUnitId: number;
}

export interface ILiability {
  retailerId: number;
  remaingLiabilityAmount: string;
  currency: string;
}
