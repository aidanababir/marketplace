import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ShoppingCart, AlertCircle, Loader2, Plus, Minus, Search, X } from 'lucide-react';
import { formatPrice } from '../lib/utils';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('date-desc'); // 'date-desc', 'date-asc', 'name', 'price-asc', 'price-desc'
  const { addToCart, updateCartItem, removeFromCart, getCartItemByProductId } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products');
      setProducts(response.data);
    } catch (err) {
      setError('Ошибка загрузки продуктов');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (productId) => {
    if (!user) {
      alert('Пожалуйста, войдите в систему для добавления товаров в корзину');
      return;
    }
    const product = products.find(p => p.id === productId);
    if (product && product.stock === 0) {
      alert('Товар отсутствует на складе');
      return;
    }
    try {
      await addToCart(productId, 1);
      // Обновляем список продуктов
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка при добавлении в корзину');
    }
  };

  const handleIncreaseQuantity = async (productId) => {
    try {
      const cartItem = getCartItemByProductId(productId);
      if (cartItem) {
        const product = products.find(p => p.id === productId);
        const newQuantity = cartItem.quantity + 1;
        if (product && product.stock < newQuantity) {
          alert(`Недостаточно товара на складе. Доступно: ${product.stock}`);
          return;
        }
        await updateCartItem(cartItem.id, newQuantity);
        // Обновляем список продуктов
        fetchProducts();
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

  // Фильтрация и сортировка товаров
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Поиск по названию и описанию
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(query) ||
        (product.description && product.description.toLowerCase().includes(query))
      );
    }

    // Фильтр по цене
    if (priceRange.min) {
      const min = parseFloat(priceRange.min);
      if (!isNaN(min)) {
        filtered = filtered.filter(product => parseFloat(product.price) >= min);
      }
    }
    if (priceRange.max) {
      const max = parseFloat(priceRange.max);
      if (!isNaN(max)) {
        filtered = filtered.filter(product => parseFloat(product.price) <= max);
      }
    }

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          // Новые первыми
          return new Date(b.created_at) - new Date(a.created_at);
        case 'date-asc':
          // Старые первыми
          return new Date(a.created_at) - new Date(b.created_at);
        case 'price-asc':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-desc':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          // По умолчанию - новые первыми
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    return filtered;
  }, [products, searchQuery, priceRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setPriceRange({ min: '', max: '' });
    setSortBy('date-desc');
  };

  const hasActiveFilters = searchQuery || priceRange.min || priceRange.max || sortBy !== 'date-desc';

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-4 rounded-lg border border-destructive/20">
          <AlertCircle className="h-5 w-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Получаем минимальную и максимальную цены для фильтра
  const minPrice = products.length > 0 ? Math.min(...products.map(p => parseFloat(p.price))) : 0;
  const maxPrice = products.length > 0 ? Math.max(...products.map(p => parseFloat(p.price))) : 0;

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Продукты</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Выберите товары для покупки</p>
      </div>

      {/* Поиск и фильтры */}
      <Card className="mb-6 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm sm:text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Фильтр по минимальной цене */}
            <div>
              <Label htmlFor="minPrice">Минимальная цена (₸)</Label>
              <Input
                id="minPrice"
                type="number"
                placeholder={`От ${formatPrice(minPrice)}`}
                value={priceRange.min}
                onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                min={0}
              />
            </div>

            {/* Фильтр по максимальной цене */}
            <div>
              <Label htmlFor="maxPrice">Максимальная цена (₸)</Label>
              <Input
                id="maxPrice"
                type="number"
                placeholder={`До ${formatPrice(maxPrice)}`}
                value={priceRange.max}
                onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                min={0}
              />
            </div>

            {/* Сортировка */}
            <div>
              <Label htmlFor="sortBy">Сортировка</Label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="date-desc">Новые первыми</option>
                <option value="date-asc">Старые первыми</option>
                <option value="name">По названию</option>
                <option value="price-asc">По цене: дешевле</option>
                <option value="price-desc">По цене: дороже</option>
              </select>
            </div>

            {/* Кнопка сброса фильтров */}
            <div className="flex items-end">
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Сбросить
                </Button>
              )}
            </div>
          </div>

          {/* Информация о результатах */}
          {hasActiveFilters && (
            <div className="text-sm text-muted-foreground">
              Найдено товаров: {filteredAndSortedProducts.length} из {products.length}
            </div>
          )}
        </div>
      </Card>

      {products.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">Продукты не найдены</p>
        </Card>
      ) : filteredAndSortedProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground text-lg">Товары не найдены по заданным фильтрам</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-4">
              Сбросить фильтры
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filteredAndSortedProducts.map((product) => {
            const cartItem = getCartItemByProductId(product.id);
            const quantity = cartItem ? cartItem.quantity : 0;
            const isInCart = quantity > 0;

            return (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col group">
              <Link to={`/product/${product.id}`} className="block">
                <div className="aspect-video w-full overflow-hidden bg-muted cursor-pointer">
                  <img
                    src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                    }}
                  />
                </div>
              </Link>
              <CardHeader>
                <Link to={`/product/${product.id}`} className="block">
                  <CardTitle className="line-clamp-2 hover:text-primary transition-colors cursor-pointer">
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
                  {isInCart ? (
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
                      {product.stock === 0 ? 'Нет в наличии' : 'Добавить в корзину'}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Products;
