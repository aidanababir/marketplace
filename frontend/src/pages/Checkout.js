import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Plus, Minus, Trash2, ShoppingBag, Loader2, ArrowRight, CheckCircle2, MapPin, Phone, User } from 'lucide-react';
import { formatPrice } from '../lib/utils';

const Checkout = () => {
  const { user } = useAuth();
  const { cartItems, updateCartItem, removeFromCart, getCartTotal, loading, clearCart } = useCart();
  const navigate = useNavigate();
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderForm, setOrderForm] = useState({
    fullName: user?.name || '',
    phone: '',
    address: '',
    city: '',
    postalCode: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      setOrderForm(prev => ({ ...prev, fullName: user.name || '' }));
    }
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка корзины...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && !orderSuccess) {
    return (
      <div className="container mx-auto py-12 px-4">
        <h1 className="text-4xl font-bold mb-8">Cart</h1>
        <Card className="p-12 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <CardTitle className="mb-2">Your cart is empty</CardTitle>
          <CardDescription className="mb-6">
            Add items from the product catalog
          </CardDescription>
          <Button onClick={() => navigate('/products')}>
            Go to products
          </Button>
        </Card>
      </div>
    );
  }

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      try {
        await updateCartItem(itemId, newQuantity);
      } catch (err) {
        alert(err.response?.data?.error || 'Ошибка при обновлении корзины');
      }
    }
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setOrderProcessing(true);

    try {
      // Сохраняем сумму до очистки корзины
      const totalBeforeClear = getCartTotal();
      
      // Создаем заказ через API
      const response = await axios.post('/api/orders', {
        cartItems: cartItems,
        shippingInfo: orderForm
      });

      setOrderNumber(response.data.order_number);
      setOrderTotal(response.data.total_amount || totalBeforeClear);
      setOrderProcessing(false);
      setOrderSuccess(true);
      setShowOrderDialog(false);
      
      // Очистка корзины после успешного заказа
      clearCart();
    } catch (error) {
      setOrderProcessing(false);
      alert(error.response?.data?.error || 'Error while placing the order');
    }
  };

  const handleContinueShopping = () => {
    setOrderSuccess(false);
    navigate('/products');
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = getCartTotal();

  if (orderSuccess) {
    return (
      <div className="container mx-auto py-6 sm:py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md p-6 sm:p-8 text-center">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-3 sm:p-4">
              <CheckCircle2 className="h-12 w-12 sm:h-16 sm:w-16 text-primary" />
            </div>
          </div>
          <CardTitle className="text-xl sm:text-2xl mb-2">Order successfully placed!</CardTitle>
          <CardDescription className="mb-4 sm:mb-6 text-sm sm:text-base">
            Thank you for your purchase! We will contact you shortly to confirm your order.
          </CardDescription>
          <div className="space-y-2 mb-4 sm:mb-6 text-left bg-muted p-3 sm:p-4 rounded-lg text-sm sm:text-base">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Order number:</span>
              <span className="font-semibold">{orderNumber || 'Загрузка...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total amount:</span>
              <span className="font-semibold">{formatPrice(orderTotal)} ₸</span>
            </div>
          </div>
          <Button onClick={handleContinueShopping} className="w-full">
            Continue Shopping 
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">Cart</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3 sm:space-y-4">
          {cartItems.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-3 sm:p-4">
                <div className="w-full sm:w-24 h-48 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={item.products?.image_url || 'https://via.placeholder.com/100x100?text=No+Image'}
                    alt={item.products?.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <CardTitle className="text-lg mb-1">{item.products?.name}</CardTitle>
                    <CardDescription className="text-lg font-semibold text-foreground">
                      {formatPrice(item.products?.price)} ₸
                    </CardDescription>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mt-3 sm:mt-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        disabled={item.products?.stock !== undefined && item.products.stock <= item.quantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-bold">
                        {formatPrice((item.products?.price || 0) * item.quantity)} ₸
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFromCart(item.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Total Price</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total Price:</span>
                <span className="text-primary">{formatPrice(totalPrice)} ₸</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={() => setShowOrderDialog(true)}>
                Checkout
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="w-[95vw] max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Checkout</DialogTitle>
            <DialogDescription className="text-sm">
              Enter your details below
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleOrderSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">
                <User className="h-4 w-4 inline mr-2" />
                Full name
              </Label>
              <Input
                id="fullName"
                value={orderForm.fullName}
                onChange={(e) => setOrderForm({ ...orderForm, fullName: e.target.value })}
                required
                placeholder="Нұрлан Нұрланұлы Нұрланов"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-2" />
                  Telephone number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={orderForm.phone}
                onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                required
                placeholder="+7 (701) 234-56-78"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={orderForm.city}
                onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })}
                required
                placeholder="Алматы"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">
                <MapPin className="h-4 w-4 inline mr-2" />
                Delivery Adress
              </Label>
              <Input
                id="address"
                value={orderForm.address}
                onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                required
                placeholder="пр. Абая, д. 150, кв. 25"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={orderForm.postalCode}
                onChange={(e) => setOrderForm({ ...orderForm, postalCode: e.target.value })}
                placeholder="050000"
              />
            </div>
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{totalItems}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total Price:</span>
                <span className="text-primary">{formatPrice(totalPrice)} ₸</span>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowOrderDialog(false)}
                disabled={orderProcessing}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={orderProcessing}>
                {orderProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Order
                    <CheckCircle2 className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Checkout;
