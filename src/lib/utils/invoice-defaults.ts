/** 默认 Invoice 行项目（服务端/客户端均可使用） */
export type DefaultLineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

export function defaultLineItems(): DefaultLineItem[] {
  return [{ description: "", quantity: 1, unitPrice: 0 }];
}
