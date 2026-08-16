import { BasketLine } from '../types';
export declare function CustomerCheckout(props: {
  businessId: string;
  businessName: string;
  location: string;
  basket: BasketLine[];
  onBack: () => void;
  onComplete: () => void;
}): import('react').ReactElement;
