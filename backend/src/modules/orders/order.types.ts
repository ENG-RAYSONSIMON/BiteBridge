export interface CreateOrderInput {
    items: {
        menuItemId: string;
        quantity: number;
    }[];
}