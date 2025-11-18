import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Button } from './ui/button';
import { ShoppingCart, User, LogOut, Package, Home, Settings, Menu, X } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2" onClick={() => setMobileMenuOpen(false)}>
          <Package className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">Marketplace</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Home className="h-4 w-4" />
            Главная
          </Link>
          <Link to="/products" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
            <Package className="h-4 w-4" />
            Продукты
          </Link>
          
          {user && (
            <>
              <Link to="/checkout" className="relative flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <ShoppingCart className="h-4 w-4" />
                Корзина
                {getCartCount() > 0 && (
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {getCartCount()}
                  </span>
                )}
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                <User className="h-4 w-4" />
                Личный кабинет
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
                  <Settings className="h-4 w-4" />
                  Админка
                </Link>
              )}
            </>
          )}
          
          {user ? (
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Выйти
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">Войти</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/register">Регистрация</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center gap-2">
          {user && (
            <Link to="/checkout" className="relative p-2 text-muted-foreground">
              <ShoppingCart className="h-5 w-5" />
              {getCartCount() > 0 && (
                <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {getCartCount()}
                </span>
              )}
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container px-4 py-4 space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="h-4 w-4" />
              Главная
            </Link>
            <Link
              to="/products"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary rounded-md"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Package className="h-4 w-4" />
              Продукты
            </Link>
            
            {user && (
              <>
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <User className="h-4 w-4" />
                  Личный кабинет
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary rounded-md"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Админка
                  </Link>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              </>
            )}
            
            {!user && (
              <div className="flex flex-col gap-2 pt-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Войти</Link>
                </Button>
                <Button className="w-full justify-start" asChild>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>Регистрация</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
