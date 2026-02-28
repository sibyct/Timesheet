export interface Project {
  projectName: string;
  refId?: string;
}

export interface Client {
  _id?: string;
  clientName: string;
  projects: Project[];
}

export interface User {
  userId: number;
  username: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  phoneNo: number;
  contractType: 'PartTime' | 'Permanent';
  role: number;
  projects: Project[];
  clients: Client[];
  address: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: number;
  hourlyPay?: number;
}
