import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Package, Loader2, MapPin, Phone, User, Calendar, ShoppingBag, UserCircle, Mail } from 'lucide-react';
import { formatPrice } from '../lib/utils';

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/my-orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'В обработке', variant: 'secondary' },
      processing: { label: 'Обрабатывается', variant: 'default' },
      shipped: { label: 'Отправлен', variant: 'default' },
      delivered: { label: 'Доставлен', variant: 'default' },
      cancelled: { label: 'Отменен', variant: 'destructive' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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

  return (
    <div className="container mx-auto py-4 sm:py-8 px-4">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Личный кабинет</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Управление профилем и заказами</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">
            <UserCircle className="h-4 w-4 mr-2" />
            Профиль
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingBag className="h-4 w-4 mr-2" />
            Мои заказы ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Информация о профиле</CardTitle>
              <CardDescription>Ваши личные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <UserCircle className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                </div>
                <div className="text-center sm:text-left">
                  <h3 className="text-lg sm:text-xl font-semibold">{user?.name || 'Пользователь'}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    Имя
                  </div>
                  <p className="font-medium">{user?.name || 'Не указано'}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="h-4 w-4" />
                    Роль
                  </div>
                  <p className="font-medium">
                    {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">Заказов пока нет</CardTitle>
              <CardDescription className="mb-6">
                Начните делать покупки, чтобы увидеть здесь свои заказы
              </CardDescription>
              <Button onClick={() => navigate('/products')}>
                Перейти к продуктам
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      <div className="flex-1">
                        <CardTitle className="mb-2 text-lg sm:text-xl">Заказ {order.order_number}</CardTitle>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
                            {formatDate(order.created_at)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                            {order.order_items?.length || 0} товар(ов)
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                        {getStatusBadge(order.status)}
                        <div className="text-xl sm:text-2xl font-bold text-primary">
                          {formatPrice(order.total_amount)} ₸
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-4 sm:pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold mb-4">Товары в заказе</h3>
                        <div className="space-y-3">
                          {order.order_items?.map((item) => (
                            <div key={item.id} className="flex items-center gap-3">
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                <img
                                  src={item.products?.image_url || 'https://via.placeholder.com/64x64?text=No+Image'}
                                  alt={item.products?.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/64x64?text=No+Image';
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{item.products?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {item.quantity} × {formatPrice(item.price)} ₸
                                </p>
                              </div>
                              <div className="font-semibold">
                                {formatPrice(item.quantity * item.price)} ₸
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Shipping Info */}
                      <div>
                        <h3 className="font-semibold mb-4">Данные доставки</h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-start gap-2">
                            <User className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Получатель</p>
                              <p className="font-medium">{order.full_name}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <Phone className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Телефон</p>
                              <p className="font-medium">{order.phone}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                              <p className="text-muted-foreground">Адрес</p>
                              <p className="font-medium">
                                {order.city}, {order.address}
                                {order.postal_code && `, ${order.postal_code}`}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;

