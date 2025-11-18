import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Package, Truck, Shield, Star, ShoppingCart, ArrowRight, Sparkles, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart, updateCartItem, removeFromCart, getCartItemByProductId } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      // Берем первые 4 продукта как популярные
      setFeaturedProducts(response.data.slice(0, 4));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      alert('Пожалуйста, войдите в систему для добавления товаров в корзину');
      return;
    }
    const product = featuredProducts.find(p => p.id === productId);
    if (product && product.stock === 0) {
      alert('Товар отсутствует на складе');
      return;
    }
    try {
      await addToCart(productId, 1);
      // Обновляем список продуктов
      fetchFeaturedProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при добавлении в корзину');
    }
  };

  const handleIncreaseQuantity = async (productId) => {
    try {
      const cartItem = getCartItemByProductId(productId);
      if (cartItem) {
        const product = featuredProducts.find(p => p.id === productId);
        const newQuantity = cartItem.quantity + 1;
        if (product && product.stock < newQuantity) {
          alert(`Недостаточно товара на складе. Доступно: ${product.stock}`);
          return;
        }
        await updateCartItem(cartItem.id, newQuantity);
        // Обновляем список продуктов
        fetchFeaturedProducts();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при обновлении корзины');
    }
  };

  const handleDecreaseQuantity = async (productId) => {
    try {
      const cartItem = getCartItemByProductId(productId);
      if (cartItem) {
        if (cartItem.quantity > 1) {
          await updateCartItem(cartItem.id, cartItem.quantity - 1);
        } else {
          await removeFromCart(cartItem.id);
        }
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при обновлении корзины');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background py-20 px-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Новые поступления каждый день</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 sm:mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent px-4">
            Welcome to ElectraHub
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
            Shop High-Quality Electronics at the Best Prices. Enjoy fast and reliable delivery every time. 
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/products">
                Посмотреть каталог
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/products">
                Популярные товары
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-8 sm:py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">10K+</div>
              <div className="text-sm text-muted-foreground">Довольных клиентов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">5K+</div>
              <div className="text-sm text-muted-foreground">Товаров в каталоге</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Поддержка клиентов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Гарантия качества</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto py-8 sm:py-12 md:py-16 px-4">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Почему выбирают нас</h2>
          <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Мы предлагаем лучший сервис и качественные товары для вашего комфорта
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Wide Selection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Тысячи товаров на любой вкус и потребность. От электроники до одежды - у нас есть всё!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Truck className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fast Delivery</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Доставка в кратчайшие сроки по всей стране. Получите заказ уже завтра!
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-primary/50 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Reliability</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                Проверенные продавцы и гарантия качества товаров. Покупайте с уверенностью!
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Products Section */}
      {!loading && featuredProducts.length > 0 && (
        <section className="bg-muted/30 py-8 sm:py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0 mb-6 sm:mb-8">
              <div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Популярные товары</h2>
                <p className="text-sm sm:text-base text-muted-foreground">Самые востребованные товары этой недели</p>
              </div>
              <Button variant="outline" asChild className="w-full sm:w-auto">
                <Link to="/products">
                  <span className="hidden sm:inline">Смотреть все</span>
                  <span className="sm:hidden">Все</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {featuredProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all flex flex-col group">
                  <Link to={`/product/${product.id}`} className="block">
                    <div className="aspect-video w-full overflow-hidden bg-muted relative cursor-pointer">
                      <img
                        src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current" />
                        Популярно
                      </div>
                    </div>
                  </Link>
                  <CardHeader>
                    <Link to={`/product/${product.id}`} className="block">
                      <CardTitle className="line-clamp-2 text-lg hover:text-primary transition-colors cursor-pointer">
                        {product.name}
                      </CardTitle>
                    </Link>
                    {product.description && (
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="flex-1">
                    <Link to={`/product/${product.id}`} className="block">
                      <div className="text-2xl font-bold text-primary mb-4 hover:opacity-80 transition-opacity cursor-pointer">
                        {formatPrice(product.price)} ₸
                      </div>
                    </Link>
                  </CardContent>
                  <CardFooter>
                    {(() => {
                      const cartItem = getCartItemByProductId(product.id);
                      const quantity = cartItem ? cartItem.quantity : 0;
                      const isInCart = quantity > 0;

                      return isInCart ? (
                        <div className="w-full flex items-center justify-between gap-2 border rounded-md p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDecreaseQuantity(product.id)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="flex-1 text-center font-semibold min-w-[2rem]">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleIncreaseQuantity(product.id)}
                            disabled={product.stock <= quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleAddToCart(product.id)}
                          disabled={product.stock === 0}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {product.stock === 0 ? 'Нет в наличии' : 'В корзину'}
                        </Button>
                      );
                    })()}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="container mx-auto py-8 sm:py-12 md:py-16 px-4">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20">
          <CardHeader className="text-center px-4 sm:px-6">
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl mb-3 sm:mb-4">
              Готовы начать покупки?
            </CardTitle>
            <CardDescription className="text-sm sm:text-base md:text-lg">
              Присоединяйтесь к тысячам довольных клиентов и откройте для себя лучшие предложения
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/products">
                  Перейти в каталог
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
              {!user && (
                <Button size="lg" variant="outline" asChild>
                  <Link to="/register">
                    Создать аккаунт
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default Home;
