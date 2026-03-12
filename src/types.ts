export type UserRole = 'Owner' | 'Employee';
export type UserStatus = 'Pending' | 'Approved' | 'Rejected';
export type UserPermissions = 'Only View' | 'Only Add' | 'All Access';

export interface UserProfile {
  uid: string;
  fullName: string;
  mobileNumber: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  permissions: UserPermissions;
  createdAt: any;
}

export type EMDType = 'FD' | 'DD' | 'BG' | 'Other';
export type DepositLocation = 'Deposited in Department' | 'In Office / Home';
export type DeliveryMethod = 'BY HAND' | 'BY POST';
export type EMDStatus = 'Active' | 'Withdrawn';

export interface EMDRecord {
  id: string;
  emdType: EMDType;
  emdTypeOther?: string;
  emdNumber: string;
  emdAmount: number;
  bidNumber: string;
  bidStartDate: string;
  bidEndDate: string;
  department: string;
  depositLocation: DepositLocation;
  deliveryMethod?: DeliveryMethod;
  deliveryDate?: string;
  trackingId?: string;
  courierReceiptPhoto?: string;
  company: string;
  companyOther?: string;
  bank: string;
  bankOther?: string;
  maturityDate?: string;
  notes?: string;
  photos: string[];
  status: EMDStatus;
  withdrawalDate?: string;
  returnMethod?: string;
  createdAt: any;
  createdBy: string;
}

export interface WithdrawalRequest {
  id: string;
  emdId: string;
  emdNumber: string;
  withdrawalDate: string;
  returnMethod: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedBy: string;
  requestedByName: string;
  createdAt: any;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'Maturity' | 'BidEnd' | 'Withdrawal' | 'Approval';
  read: boolean;
  targetUser: string;
  createdAt: any;
}
