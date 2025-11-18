import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Plus, Edit, Trash2, Loader2, Package, X, ShoppingBag, User, MapPin, Phone, Calendar } from 'lucide-react';
import { formatPrice } from '../lib/utils';

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchProducts();
    fetchOrders();
  }, [user, navigate]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/admin/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('/api/orders/admin/all');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await axios.put(`/api/admin/products/${editingProduct.id}`, formData);
      } else {
        await axios.post('/api/admin/products', formData);
      }
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: '', image_url: '', stock: '' });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при сохранении продукта');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      image_url: product.image_url || '',
      stock: product.stock || 0
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот продукт?')) {
      return;
    }
    try {
      await axios.delete(`/api/admin/products/${id}`);
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при удалении продукта');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', image_url: '', stock: '' });
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await axios.put(`/api/orders/admin/${orderId}/status`, { status: newStatus });
      fetchOrders();
    } catch (error) {
      alert(error.response?.data?.error || 'Ошибка при обновлении статуса');
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
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Админ панель</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Управление продуктами и заказами</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 sm:mb-6 border-b overflow-x-auto">
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('products')}
          className="rounded-b-none"
        >
          <Package className="h-4 w-4 mr-2" />
          Продукты
        </Button>
        <Button
          variant={activeTab === 'orders' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('orders')}
          className="rounded-b-none"
        >
          <ShoppingBag className="h-4 w-4 mr-2" />
          Заказы ({orders.length})
        </Button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Добавить продукт</span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </div>

          {showForm && (
            <Card className="mb-6 sm:mb-8">
              <CardHeader>
                <div className="flex items-start sm:items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl">{editingProduct ? 'Редактировать продукт' : 'Новый продукт'}</CardTitle>
                    <CardDescription className="text-sm">
                      {editingProduct ? 'Измените информацию о продукте' : 'Заполните информацию о новом продукте'}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleCancel} className="flex-shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Название *</Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Цена *</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Описание</Label>
                    <textarea
                      id="description"
                      className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="image_url">URL изображения</Label>
                      <Input
                        id="image_url"
                        type="url"
                        value={formData.image_url}
                        onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Количество на складе</Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full sm:w-auto">
                      <span className="hidden sm:inline">{editingProduct ? 'Сохранить изменения' : 'Создать продукт'}</span>
                      <span className="sm:hidden">{editingProduct ? 'Сохранить' : 'Создать'}</span>
                    </Button>
                    <Button type="button" variant="outline" onClick={handleCancel} className="w-full sm:w-auto">
                      Отмена
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div>
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 flex items-center gap-2">
              <Package className="h-6 w-6" />
              Продукты ({products.length})
            </h2>
            {products.length === 0 ? (
              <Card className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <CardTitle className="mb-2">Продукты не найдены</CardTitle>
                <CardDescription>Начните с добавления первого продукта</CardDescription>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video w-full overflow-hidden bg-muted">
                      <img
                        src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    </div>
                    <CardHeader>
                      <CardTitle className="line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="text-lg font-semibold text-foreground">
                        {product.price} ₸
                      </CardDescription>
                      <CardDescription>
                        На складе: {product.stock || 0}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Редактировать
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Orders Tab */}
      {activeTab === 'orders' && (
        <div>
          <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
            <ShoppingBag className="h-6 w-6" />
            Все заказы ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <Card className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">Заказов нет</CardTitle>
              <CardDescription>Заказы появятся здесь после оформления</CardDescription>
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
                            <User className="h-3 w-3 sm:h-4 sm:w-4" />
                            {order.users?.name || order.users?.email || 'Пользователь'}
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

                      {/* Shipping Info & Status */}
                      <div>
                        <h3 className="font-semibold mb-4">Данные доставки</h3>
                        <div className="space-y-3 text-sm mb-6">
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
                        <div>
                          <Label className="mb-2 block text-sm">Изменить статус</Label>
                          <div className="flex flex-wrap gap-2">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
                              <Button
                                key={status}
                                variant={order.status === status ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs sm:text-sm"
                                onClick={() => handleStatusChange(order.id, status)}
                              >
                                {getStatusBadge(status).props.children}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Admin;
