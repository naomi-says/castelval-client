import { NavigatorScreenParams } from '@react-navigation/native'
import { TxRow } from '../data/data'
import { LimitFamily } from '../services/rules'

export type TabParamList = {
  Home: undefined
  Accounts: undefined
  Cards: undefined
  Transfers: undefined
  Wealth: { tab?: number } | undefined
}
export type DrawerParamList = { Tabs: NavigatorScreenParams<TabParamList> }

export type InfoKind = 'faq' | 'legal' | 'cookies' | 'a11y'
export type CardInfoKind =
  | 'activate' | 'virtual' | 'mobilepay' | 'internet' | 'contactless' | 'code' | 'viewcard'
  | 'pts' | 'cbx' | 'spend' | 'cassur' | 'cassist' | 'opp'
export type ApprovalKind = 'code' | 'phones' | 'password'

export type RootStackParamList = {
  Login: undefined
  Main: NavigatorScreenParams<DrawerParamList> | undefined
  // accounts & documents
  AccountManage: undefined
  OperationDetail: { row: TxRow }
  Statements: { acct?: number } | undefined
  OtherDocuments: undefined
  DocsToSend: undefined
  DocsToSign: undefined
  Rib: undefined
  // cards
  CardPoints: undefined
  CardSettings: undefined
  CardBlocks: undefined
  CardLimit: { family: LimitFamily }
  CardLimitEdit: { family: LimitFamily; days: number }
  CardInfo: { kind: CardInfoKind }
  // transfers
  TfFrom: undefined
  TfTo: undefined
  TfAmount: undefined
  TfReview: undefined
  TfApproval: undefined
  TfDone: undefined
  Beneficiaries: undefined
  BeneficiaryDetail: { index: number }
  AddBeneficiary: undefined
  TransferLimits: undefined
  LimitInfo: undefined
  Scheduled: undefined
  ManageUpcoming: undefined
  // wealth
  ManualItem: { index?: number; cat?: string }
  // loans / insurance
  Credits: undefined
  LoanDetail: { index: number }
  Insurance: undefined
  // messaging & contact
  Messages: { tab?: 0 | 1 | 2 } | undefined
  MessageRead: { box: 0 | 1 | 2; index: number }
  MessageCompose: undefined
  Contact: undefined
  Appointment: undefined
  // profile & settings
  Profile: { section?: number } | undefined
  ProfileSwitch: undefined
  Settings: undefined
  SettingsContact: undefined
  SettingsAlerts: undefined
  SettingsAggregation: undefined
  ConnectionHistory: undefined
  Approval: { kind: ApprovalKind }
  // other
  Subscribe: undefined
  InfoPage: { kind: InfoKind }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
