import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { ShoppingCart, Loader2, AlertCircle, Plus, Minus, ArrowLeft, Package } from 'lucide-react';
import { formatPrice } from '../lib/utils';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, updateCartItem, removeFromCart, getCartItemByProductId } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProduct = useCallback(async () => {
    try {
      const response = await axios.get(`/api/products/${id}`);
      setProduct(response.data);
    } catch (err) {
      setError('Product not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleAddToCart = async () => {
    if (!user) {
      alert('Please log in to add items to your cart');
      return;
    }
    if (product.stock === 0) {
      alert('Item out of stock');
      return;
    }
    try {
      await addToCart(product.id, 1);
      // Обновляем информацию о товаре после добавления
      fetchProduct();
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding to cart');
    }
  };

  const handleIncreaseQuantity = async () => {
    try {
      const cartItem = getCartItemByProductId(product.id);
      if (cartItem) {
        const newQuantity = cartItem.quantity + 1;
        if (product.stock < newQuantity) {
          alert(`Item out of stock. Available: ${product.stock}`);
          return;
        }
        await updateCartItem(cartItem.id, newQuantity);
        // Обновляем информацию о товаре после изменения
        fetchProduct();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding to cart');
    }
  };

  const handleDecreaseQuantity = async () => {
    try {
      const cartItem = getCartItemByProductId(product.id);
      if (cartItem) {
        if (cartItem.quantity > 1) {
          await updateCartItem(cartItem.id, cartItem.quantity - 1);
        } else {
          await removeFromCart(cartItem.id);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Error adding to cart');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Card className="p-12 text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <CardTitle className="mb-2">Product not found</CardTitle>
          <CardDescription className="mb-6">
            {error || 'Requested product does not exist'}
          </CardDescription>
          <Button onClick={() => navigate('/products')}>
            Back to products
          </Button>
        </Card>
      </div>
    );
  }

  const cartItem = getCartItemByProductId(product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const isInCart = quantity > 0;

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => navigate('/products')}
        className="mb-4 sm:mb-6"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Back to products</span>
        <span className="sm:hidden">Back</span>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Product Image */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="w-full max-w-md mx-auto lg:max-w-full">
              <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-muted">
                <img
                  src={product.image_url || 'https://via.placeholder.com/600x450?text=No+Image'}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x450?text=No+Image';
                  }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Product Info */}
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">{product.name}</h1>
            {product.description && (
              <CardDescription className="text-lg mb-4">
                {product.description}
              </CardDescription>
            )}
          </div>

          <Separator />

          <div>
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-4 sm:mb-6">
              <span className="text-3xl sm:text-4xl font-bold text-primary">
                {formatPrice(product.price)} ₸
              </span>
              {product.stock !== undefined && (
                <Badge variant={product.stock > 0 ? 'default' : 'destructive'}>
                  {product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'}
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>About</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Stock availability</p>
                  <p className="font-medium">{product.stock || 0} pc.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {isInCart ? (
              <div className="flex items-center justify-between gap-4 border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleDecreaseQuantity}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl font-semibold min-w-[3rem] text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleIncreaseQuantity}
                    disabled={product.stock <= quantity}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-muted-foreground ml-4">
                    In cart
                  </span>
                </div>
              </div>
            ) : (
              <Button
                className="w-full"
                size="lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock === 0 ? 'Out of stock' : 'Add to cart'}
              </Button>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/products')}
              >
                Continue shopping
              </Button>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white border-green-600"
                onClick={() => navigate('/checkout')}
              >
                Proceed to cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

