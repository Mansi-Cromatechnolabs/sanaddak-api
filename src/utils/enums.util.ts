export enum AgreementType {
  MURABAHA = 1,
  FULLFILLMENT = 2,
  LIQUIDATE = 3,
}

export enum EmiStatus {
  PENDING = 'pending',
  PAID = 'paid',
  EXPIRED = 'expired',
  OVERDUE = 'overdue',
}

export enum AppointmentType {
  Valuation_appointment = 1,
  Buyback_appointment = 2,
  Extends_appointment = 3,
  Liquidate_appointment = 4,
}

export enum ApplicationStatus {
  APPLIED_FOR_LOAN = 1,
  STORE_VISIT = 2,
  VALUATION_REJECT = 3,
  VALUATION_CHECK = 4,
  GENERATE_AGREEMENT = 5,
  APPROVED_BY_CUSTOMER = 6,
  REJECT_BY_CUSTOMER = 7,
  READY_FOR_DISBURSMENT = 8,
  LOAN_PROCESS_COMPLETED = 9,
}

export enum KycStatus {
  CUSTOMER_DOCUMENT_UPLOADED = 'Document uploaded',
  Verified = 'Verified',
  UnVerified = 'Un-Verified',
}

export enum ReviewStatus {
  Approved = 'Approved',
  Disapproved = 'Disapproved',
}

export enum UserRolePermission {
  MAKER = 1,
  CHECKER = 2,
  APPROVER = 3,
}

export enum PriceConfigStatus {
  REQUESTED_FOR_VERIFICATION = 1,
  REQUESTED_FOR_APPROVAL = 2,
  APPROVED = 3,
}

export enum BarcodeStatus {
  PENDING = 1,
  VERIFIED = 2,
  DISPUTE = 3,
  MISSING = 4,
}

export enum BarcodeType {
  GOLD_PIECE = 1,
  LIQUIDITY = 2,
  CONTAINER = 3,
  ZONE = 4,
}

export enum NoteType {
  DEBIT = 1,
  CREDIT = 2,
}

export enum NotificationType {
  All = 1,
  Payment = 2,
  Alert = 3,
}

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum SortByUserKey {
  ID = 'id',
  NAME = 'name',
  EMAIL = 'email',
  PHONE = 'phone',
}

export enum DeviceOs {
  ANDROID = 'android',
  LINUX = 'linux',
  WINDOWS = 'windows',
  MACOS = 'macos',
  IOS = 'ios',
}

export enum KycVerificationMethod {
  KYC_MANUAL = 1,
  KYC_WITH_DIGIFY = 2,
}
