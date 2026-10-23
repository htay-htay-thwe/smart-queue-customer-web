export type User = { id: string; name: string; email: string; phoneNumber?: string; profileImage?: string };
export type Shop = {
  _id: string; id?: string; name: string; description?: string; shopImg?: string;
  phoneNumber?: string; distance?: number; shopTypes?: { shopTypeName?: string } | string;
  isQueueOpen?: boolean;
  address?: { fullAddress?: string; location?: { coordinates?: [number, number] } };
  tableTypes?: Array<{ _id: string; type: string; capacity: number }>;
};
export type Queue = {
  _id: string; id?: string; queue_number?: number; status?: string; estimated_wait_time?: number;
  createdAt?: string; updatedAt?: string; readyAt?: string; noShowDeadline?: string;
  table_type_id?: { _id?: string; type?: string } | string; table_no?: string | number;
  shop_id?: Shop | string; shop?: Shop; userRequirements?: string; queue_qr?: string;
};
export type AppNotification = { _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string; queue_id?: string | { _id: string } };
